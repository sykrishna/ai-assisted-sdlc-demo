export type AuthUser = {
  displayName: string;
  roles: string[];
  userId: string;
};

export type AuthSession = {
  expiresAt: string;
  issuedAt: string;
  sessionId: string;
};

export type AuthTokenMetadata = {
  audience: string;
  expiresAt: string;
  issuer: string;
};

export type ProblemDetails = {
  code: string;
  correlationId: string;
  detail: string;
  retryable: boolean;
  status: number;
  timestamp: string;
  title: string;
  type: string;
};

export type HealthDependencyStatus = {
  detail?: string;
  status: 'degraded' | 'ok';
};

export type HealthStatusResponse = {
  dependencies: {
    auth: HealthDependencyStatus;
  };
  service: string;
  status: 'degraded' | 'ok';
  timestamp: string;
};

export type LoginRequest = {
  deviceContext?: {
    deviceId?: string;
    userAgent?: string;
  };
  identifier: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  session: AuthSession;
  tokenType: 'Bearer';
  user: AuthUser;
};

export type LogoutRequest = {
  allSessions?: boolean;
  sessionId?: string;
};

export type LogoutResponse = {
  message: string;
  revoked: boolean;
  revokedSessionCount: number;
};

export type RefreshRequest = {
  refreshToken?: string;
  sessionId?: string;
};

export type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  session: AuthSession;
  tokenType: 'Bearer';
};

export type SessionResponse = {
  authenticated: boolean;
  session: AuthSession;
  token: AuthTokenMetadata;
  user: AuthUser;
};

export type AuthenticatedSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  session: AuthSession;
  user: AuthUser;
};

export type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';
