import { apiRequest } from '../../lib/http/api-client';
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshRequest,
  RefreshResponse,
  SessionResponse,
} from './auth-types';

const AUTH_BASE_PATH = '/api/v1/auth';

export const authClient = {
  getSession(accessToken: string) {
    return apiRequest<SessionResponse>({
      accessToken,
      method: 'GET',
      path: `${AUTH_BASE_PATH}/session`,
    });
  },

  login(payload: LoginRequest) {
    return apiRequest<LoginResponse>({
      body: payload,
      method: 'POST',
      path: `${AUTH_BASE_PATH}/login`,
    });
  },

  logout(accessToken: string | undefined, payload: LogoutRequest) {
    return apiRequest<LogoutResponse>({
      accessToken,
      body: payload,
      method: 'POST',
      path: `${AUTH_BASE_PATH}/logout`,
    });
  },

  refresh(payload: RefreshRequest) {
    return apiRequest<RefreshResponse>({
      body: payload,
      method: 'POST',
      path: `${AUTH_BASE_PATH}/refresh`,
    });
  },
};
