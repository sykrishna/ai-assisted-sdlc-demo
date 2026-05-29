import { createCorrelationId } from '../../../lib/http/correlation-id';
import { AUTH_REFRESH_COOKIE_NAME } from '../auth-constants';
import type {
  AuthSession,
  AuthTokenMetadata,
  AuthUser,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
  SessionResponse,
} from '../auth-types';

type AccessTokenRecord = {
  expiresAt: string;
  sessionId: string;
  token: AuthTokenMetadata;
  user: AuthUser;
};

type RefreshSessionRecord = {
  expiresAt: string;
  issuedAt: string;
  refreshToken: string;
  revoked: boolean;
  sessionId: string;
  user: AuthUser;
};

type ProblemDetails = {
  code: string;
  correlationId: string;
  detail: string;
  retryable: boolean;
  status: number;
  timestamp: string;
  title: string;
  type: string;
};

type MockSessionEnvelope = {
  accessToken: string;
  accessTokenExpiresAt: string;
  accessTokenExpiresIn: number;
  refreshRecord: RefreshSessionRecord;
  responseSession: AuthSession;
};

type AuthOperationResult<TResponse> = {
  refreshCookie: {
    expiresAt: string;
    token: string;
  };
  response: TResponse;
};

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEMO_IDENTIFIER = 'demo@example.com';
const DEMO_PASSWORD = 'Password123!';
const DEMO_USER: AuthUser = {
  displayName: 'Demo User',
  roles: ['user'],
  userId: 'user-demo-001',
};

const accessTokens = new Map<string, AccessTokenRecord>();
const refreshSessions = new Map<string, RefreshSessionRecord>();

function createProblem(
  status: number,
  code: string,
  detail: string,
  retryable = false,
): ProblemDetails {
  return {
    code,
    correlationId: createCorrelationId(),
    detail,
    retryable,
    status,
    timestamp: new Date().toISOString(),
    title:
      status === 401 ? 'Unauthorized' : status === 400 ? 'Bad Request' : 'Authentication Error',
    type: `https://example.com/problems/${code.toLowerCase()}`,
  };
}

function createAuthTokenMetadata(expiresAt: string): AuthTokenMetadata {
  return {
    audience: 'web-client',
    expiresAt,
    issuer: 'ai-assisted-sdlc-demo',
  };
}

function issueSession(user: AuthUser, existingSessionId?: string): MockSessionEnvelope {
  const issuedAt = new Date();
  const accessTokenExpiresAt = new Date(issuedAt.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const refreshTokenExpiresAt = new Date(issuedAt.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  const sessionId = existingSessionId ?? `session-${createCorrelationId()}`;
  const accessToken = `mock-access-${createCorrelationId()}`;
  const refreshToken = `mock-refresh-${createCorrelationId()}`;

  const refreshRecord: RefreshSessionRecord = {
    expiresAt: refreshTokenExpiresAt.toISOString(),
    issuedAt: issuedAt.toISOString(),
    refreshToken,
    revoked: false,
    sessionId,
    user,
  };

  accessTokens.set(accessToken, {
    expiresAt: accessTokenExpiresAt.toISOString(),
    sessionId,
    token: createAuthTokenMetadata(accessTokenExpiresAt.toISOString()),
    user,
  });
  refreshSessions.set(refreshToken, refreshRecord);

  return {
    accessToken,
    accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshRecord,
    responseSession: {
      expiresAt: refreshTokenExpiresAt.toISOString(),
      issuedAt: refreshRecord.issuedAt,
      sessionId,
    },
  };
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function createLoginResponse(
  identifier: string,
  password: string,
): AuthOperationResult<LoginResponse> {
  if (!identifier || !password) {
    throw createProblem(400, 'AUTH_INVALID_REQUEST', 'The authentication request is invalid.');
  }

  if (identifier !== DEMO_IDENTIFIER || password !== DEMO_PASSWORD) {
    throw createProblem(401, 'AUTH_INVALID_CREDENTIALS', 'Authentication failed.');
  }

  const envelope = issueSession(DEMO_USER);

  return {
    refreshCookie: {
      expiresAt: envelope.refreshRecord.expiresAt,
      token: envelope.refreshRecord.refreshToken,
    },
    response: {
      accessToken: envelope.accessToken,
      accessTokenExpiresIn: envelope.accessTokenExpiresIn,
      refreshToken: 'cookie-managed',
      refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
      session: envelope.responseSession,
      tokenType: 'Bearer',
      user: DEMO_USER,
    },
  };
}

export function createRefreshResponse(
  refreshToken: string | undefined,
  sessionId?: string,
): AuthOperationResult<RefreshResponse> {
  if (!refreshToken) {
    throw createProblem(401, 'AUTH_REFRESH_INVALID', 'Authentication failed.');
  }

  const existingSession = refreshSessions.get(refreshToken);

  if (!existingSession || isExpired(existingSession.expiresAt)) {
    throw createProblem(401, 'AUTH_REFRESH_INVALID', 'Authentication failed.');
  }

  if (existingSession.revoked) {
    throw createProblem(409, 'AUTH_REFRESH_REPLAY_DETECTED', 'Authentication failed.');
  }

  if (sessionId && sessionId !== existingSession.sessionId) {
    throw createProblem(401, 'AUTH_REFRESH_INVALID', 'Authentication failed.');
  }

  existingSession.revoked = true;

  const envelope = issueSession(existingSession.user, existingSession.sessionId);

  return {
    refreshCookie: {
      expiresAt: envelope.refreshRecord.expiresAt,
      token: envelope.refreshRecord.refreshToken,
    },
    response: {
      accessToken: envelope.accessToken,
      accessTokenExpiresIn: envelope.accessTokenExpiresIn,
      refreshToken: 'cookie-managed',
      refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
      session: envelope.responseSession,
      tokenType: 'Bearer',
    },
  };
}

export function createSessionResponse(accessToken: string | undefined): SessionResponse {
  if (!accessToken) {
    throw createProblem(401, 'AUTH_UNAUTHORIZED', 'Authentication failed.');
  }

  const tokenRecord = accessTokens.get(accessToken);

  if (!tokenRecord || isExpired(tokenRecord.expiresAt)) {
    throw createProblem(401, 'AUTH_UNAUTHORIZED', 'Authentication failed.');
  }

  const matchingRefreshSession = Array.from(refreshSessions.values()).find(
    (session) => session.sessionId === tokenRecord.sessionId && !session.revoked,
  );

  if (!matchingRefreshSession) {
    throw createProblem(401, 'AUTH_UNAUTHORIZED', 'Authentication failed.');
  }

  return {
    authenticated: true,
    session: {
      expiresAt: matchingRefreshSession.expiresAt,
      issuedAt: matchingRefreshSession.issuedAt,
      sessionId: matchingRefreshSession.sessionId,
    },
    token: tokenRecord.token,
    user: tokenRecord.user,
  };
}

export function createLogoutResponse(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): LogoutResponse {
  const revokedSessionIds = new Set<string>();

  if (refreshToken) {
    const refreshRecord = refreshSessions.get(refreshToken);
    if (refreshRecord && !refreshRecord.revoked) {
      refreshRecord.revoked = true;
      revokedSessionIds.add(refreshRecord.sessionId);
    }
  }

  if (accessToken) {
    const accessRecord = accessTokens.get(accessToken);
    if (accessRecord) {
      revokedSessionIds.add(accessRecord.sessionId);
      for (const session of refreshSessions.values()) {
        if (session.sessionId === accessRecord.sessionId) {
          session.revoked = true;
        }
      }
    }
  }

  return {
    message: 'Logout completed successfully.',
    revoked: true,
    revokedSessionCount: revokedSessionIds.size || 1,
  };
}

export function getProblemDetails(error: unknown): ProblemDetails {
  if (error && typeof error === 'object' && 'code' in error && 'status' in error) {
    return error as ProblemDetails;
  }

  return createProblem(500, 'AUTH_INTERNAL_ERROR', 'Authentication failed.', true);
}

export function buildRefreshCookie(tokenValue: string, expiresAt: string) {
  return {
    expires: new Date(expiresAt),
    httpOnly: true,
    name: AUTH_REFRESH_COOKIE_NAME,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    value: tokenValue,
  };
}

export function clearRefreshCookie() {
  return {
    expires: new Date(0),
    httpOnly: true,
    name: AUTH_REFRESH_COOKIE_NAME,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    value: '',
  };
}
