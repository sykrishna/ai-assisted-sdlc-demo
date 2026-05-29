'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { ApiError } from '../../lib/http/api-client';
import { logFrontendEvent } from '../../lib/observability/frontend-logger';
import { isPwaContext } from '../../lib/pwa';
import { authClient } from './auth-client';
import {
  ACCESS_TOKEN_MIN_REFRESH_DELAY_MS,
  ACCESS_TOKEN_REFRESH_WINDOW_MS,
  SESSION_RESTORE_BACKOFF_MS,
} from './auth-constants';
import type {
  AuthSession,
  AuthStatus,
  AuthUser,
  AuthenticatedSession,
  LoginRequest,
} from './auth-types';

type AuthState = {
  accessTokenExpiresAt: string | null;
  error: string | null;
  isInitializing: boolean;
  isRefreshing: boolean;
  session: AuthSession | null;
  status: AuthStatus;
  user: AuthUser | null;
};

type AuthContextValue = {
  error: string | null;
  hasAnyRole: (roles: string[]) => boolean;
  hasRole: (role: string) => boolean;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (reason: string) => Promise<void>;
  session: AuthSession | null;
  status: AuthStatus;
  user: AuthUser | null;
};

type AuthAction =
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthenticatedSession }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_START' };

const GENERIC_AUTH_ERROR = 'Authentication failed. Verify your credentials and try again.';
const GENERIC_SESSION_ERROR = 'Your session could not be restored. Please sign in again.';

const initialState: AuthState = {
  accessTokenExpiresAt: null,
  error: null,
  isInitializing: true,
  isRefreshing: false,
  session: null,
  status: 'loading',
  user: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let inMemoryAccessToken: string | null = null;

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        error: null,
        isInitializing: true,
        status: 'loading',
      };
    case 'REFRESH_START':
      return {
        ...state,
        error: null,
        isRefreshing: true,
      };
    case 'AUTH_SUCCESS':
      return {
        accessTokenExpiresAt: action.payload.accessTokenExpiresAt,
        error: null,
        isInitializing: false,
        isRefreshing: false,
        session: action.payload.session,
        status: 'authenticated',
        user: action.payload.user,
      };
    case 'AUTH_FAILURE':
      return {
        accessTokenExpiresAt: null,
        error: action.payload.error,
        isInitializing: false,
        isRefreshing: false,
        session: null,
        status: 'unauthenticated',
        user: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isInitializing: false,
        status: 'unauthenticated',
      };
    default:
      return state;
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return 'Authentication is temporarily unavailable. Please try again shortly.';
    }

    if (error.status >= 500 || error.code === 'AUTH_DEPENDENCY_UNAVAILABLE') {
      return 'Authentication is temporarily unavailable. Please try again later.';
    }

    if (error.status === 401 || error.status === 403 || error.status === 409) {
      return fallbackMessage;
    }
  }

  if (error instanceof Error) {
    return fallbackMessage;
  }

  return fallbackMessage;
}

function createAuthenticatedSession(payload: {
  accessToken: string;
  accessTokenExpiresIn: number;
  session: AuthSession;
  user: AuthUser;
}): AuthenticatedSession {
  return {
    accessToken: payload.accessToken,
    accessTokenExpiresAt: new Date(Date.now() + payload.accessTokenExpiresIn * 1000).toISOString(),
    session: payload.session,
    user: payload.user,
  };
}

function isTokenExpiringSoon(accessTokenExpiresAt: string | null): boolean {
  if (!accessTokenExpiresAt) {
    return true;
  }

  return new Date(accessTokenExpiresAt).getTime() - Date.now() <= ACCESS_TOKEN_REFRESH_WINDOW_MS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshTimerRef = useRef<number | null>(null);
  const inflightRefreshRef = useRef<Promise<void> | null>(null);
  const explicitLogoutRef = useRef(false);
  const hasRestoredSessionRef = useRef(false);

  const applyAuthenticatedState = useCallback((session: AuthenticatedSession) => {
    inMemoryAccessToken = session.accessToken;
    dispatch({ type: 'AUTH_SUCCESS', payload: session });
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clearSession = useCallback(() => {
    inMemoryAccessToken = null;
    clearRefreshTimer();
    dispatch({ type: 'LOGOUT' });
  }, [clearRefreshTimer]);

  const refreshSession = useCallback(
    async (reason: string) => {
      if (inflightRefreshRef.current) {
        return inflightRefreshRef.current;
      }

      dispatch({ type: 'REFRESH_START' });
      logFrontendEvent('info', 'auth.client.refresh.started', {
        reason,
        runtime: isPwaContext() ? 'pwa' : 'browser',
      });

      inflightRefreshRef.current = (async () => {
        try {
          const response = await authClient.refresh({ sessionId: state.session?.sessionId });
          const accessToken = response.accessToken;

          const sessionResponse = await authClient.getSession(accessToken);

          applyAuthenticatedState(
            createAuthenticatedSession({
              accessToken,
              accessTokenExpiresIn: response.accessTokenExpiresIn,
              session: sessionResponse.session,
              user: sessionResponse.user,
            }),
          );

          logFrontendEvent('info', 'auth.client.refresh.completed', {
            reason,
            sessionId: sessionResponse.session.sessionId,
          });
        } catch (error) {
          inMemoryAccessToken = null;
          dispatch({
            type: 'AUTH_FAILURE',
            payload: { error: getErrorMessage(error, GENERIC_SESSION_ERROR) },
          });
          logFrontendEvent('warn', 'auth.client.refresh.failed', {
            code: error instanceof ApiError ? error.code : 'AUTH_UNKNOWN',
            reason,
          });
          throw error;
        } finally {
          inflightRefreshRef.current = null;
        }
      })();

      return inflightRefreshRef.current;
    },
    [applyAuthenticatedState, state.session?.sessionId],
  );

  const restoreSession = useCallback(async () => {
    if (explicitLogoutRef.current) {
      dispatch({ type: 'AUTH_FAILURE', payload: { error: null as never } });
      dispatch({ type: 'CLEAR_ERROR' });
      return;
    }

    dispatch({ type: 'AUTH_START' });

    if (inMemoryAccessToken) {
      try {
        const response = await authClient.getSession(inMemoryAccessToken);
        applyAuthenticatedState(
          createAuthenticatedSession({
            accessToken: inMemoryAccessToken,
            accessTokenExpiresIn: Math.max(
              1,
              Math.floor((new Date(response.token.expiresAt).getTime() - Date.now()) / 1000),
            ),
            session: response.session,
            user: response.user,
          }),
        );
        return;
      } catch {
        inMemoryAccessToken = null;
      }
    }

    try {
      await refreshSession('initial-restore');
    } catch {
      dispatch({ type: 'AUTH_FAILURE', payload: { error: GENERIC_SESSION_ERROR } });
    }
  }, [applyAuthenticatedState, refreshSession]);

  useEffect(() => {
    if (hasRestoredSessionRef.current) {
      return;
    }

    hasRestoredSessionRef.current = true;
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    clearRefreshTimer();

    if (state.status !== 'authenticated' || !state.accessTokenExpiresAt) {
      return undefined;
    }

    const delay = Math.max(
      ACCESS_TOKEN_MIN_REFRESH_DELAY_MS,
      new Date(state.accessTokenExpiresAt).getTime() - Date.now() - ACCESS_TOKEN_REFRESH_WINDOW_MS,
    );

    refreshTimerRef.current = window.setTimeout(() => {
      if (!navigator.onLine) {
        logFrontendEvent('warn', 'auth.client.refresh.deferred_offline', {
          sessionId: state.session?.sessionId,
        });
        return;
      }

      void refreshSession('scheduled-refresh');
    }, delay);

    return () => {
      clearRefreshTimer();
    };
  }, [
    clearRefreshTimer,
    refreshSession,
    state.accessTokenExpiresAt,
    state.session?.sessionId,
    state.status,
  ]);

  useEffect(() => {
    const handleVisibilityOrReconnect = () => {
      if (explicitLogoutRef.current) {
        return;
      }

      if (document.visibilityState === 'hidden') {
        return;
      }

      if (state.status === 'authenticated' && isTokenExpiringSoon(state.accessTokenExpiresAt)) {
        void refreshSession('resume-check');
        return;
      }

      if (state.status === 'unauthenticated') {
        window.setTimeout(() => {
          void restoreSession();
        }, SESSION_RESTORE_BACKOFF_MS);
      }
    };

    window.addEventListener('online', handleVisibilityOrReconnect);
    document.addEventListener('visibilitychange', handleVisibilityOrReconnect);

    return () => {
      window.removeEventListener('online', handleVisibilityOrReconnect);
      document.removeEventListener('visibilitychange', handleVisibilityOrReconnect);
    };
  }, [refreshSession, restoreSession, state.accessTokenExpiresAt, state.status]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      explicitLogoutRef.current = false;
      dispatch({ type: 'AUTH_START' });

      try {
        const response = await authClient.login(payload);
        const accessToken = response.accessToken;
        const sessionResponse = await authClient.getSession(accessToken);

        applyAuthenticatedState(
          createAuthenticatedSession({
            accessToken,
            accessTokenExpiresIn: response.accessTokenExpiresIn,
            session: sessionResponse.session,
            user: sessionResponse.user,
          }),
        );
      } catch (error) {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: { error: getErrorMessage(error, GENERIC_AUTH_ERROR) },
        });
        throw error;
      }
    },
    [applyAuthenticatedState],
  );

  const logout = useCallback(async () => {
    explicitLogoutRef.current = true;

    try {
      await authClient.logout(inMemoryAccessToken ?? undefined, {
        sessionId: state.session?.sessionId,
      });
    } catch (error) {
      logFrontendEvent('warn', 'auth.client.logout.failed', {
        code: error instanceof ApiError ? error.code : 'AUTH_UNKNOWN',
      });
    } finally {
      clearSession();
    }
  }, [clearSession, state.session?.sessionId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      error: state.error,
      hasAnyRole: (roles) => roles.some((role) => state.user?.roles.includes(role)),
      hasRole: (role) => state.user?.roles.includes(role) ?? false,
      isAuthenticated: state.status === 'authenticated',
      isRefreshing: state.isRefreshing,
      login,
      logout,
      refreshSession,
      session: state.session,
      status: state.status,
      user: state.user,
    }),
    [
      login,
      logout,
      refreshSession,
      state.error,
      state.isRefreshing,
      state.session,
      state.status,
      state.user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
