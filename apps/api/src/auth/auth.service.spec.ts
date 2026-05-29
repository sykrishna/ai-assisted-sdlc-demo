import { AuthService } from './auth.service';
import type { JwtTokenService } from './services/jwt-token.service';
import type { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { AppException } from '../common/http/app-exception';

describe('AuthService', () => {
  let service: AuthService;
  let logger: StructuredLoggerService;
  let jwtTokenService: JwtTokenService;

  const mockConfig = {
    issuer: 'test-issuer',
    audience: 'test-audience',
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 1209600,
    accessTokenSecret: 'test-access-secret-minimum-32-characters-length-here',
    refreshTokenSecret: 'test-refresh-secret-minimum-32-characters-length-here',
  };

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as StructuredLoggerService;

    jwtTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token-123'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token-456'),
      validateAccessToken: jest.fn(),
      validateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeSessionTokens: jest.fn(),
      getTokenTtls: jest.fn().mockReturnValue({
        accessToken: 900,
        refreshToken: 1209600,
      }),
    } as unknown as JwtTokenService;

    service = new AuthService(
      mockConfig as ConstructorParameters<typeof AuthService>[0],
      logger,
      jwtTokenService,
    );
  });

  describe('login', () => {
    it('should generate JWT tokens and return successful response', () => {
      const loginRequest = {
        identifier: 'alice@example.com',
        password: 'password123',
      };

      const response = service.login(loginRequest, 'corr-1');

      expect(response.tokenType).toBe('Bearer');
      expect(response.accessToken).toBe('access-token-123');
      expect(response.refreshToken).toBe('refresh-token-456');
      expect(response.user.roles).toEqual(['user']);
      expect(response.session.sessionId).toBeTruthy();
      expect(jwtTokenService.generateAccessToken).toHaveBeenCalled();
      expect(jwtTokenService.generateRefreshToken).toHaveBeenCalled();
    });

    it('should log login attempt and success events', () => {
      service.login(
        {
          identifier: 'alice@example.com',
          password: 'password123',
        },
        'corr-1',
      );

      expect(logger.info).toHaveBeenCalledWith(
        'auth.login.attempt',
        expect.objectContaining({
          correlationId: 'corr-1',
          identifier: 'alice@example.com',
        }),
      );
      expect(logger.info).toHaveBeenCalledWith('auth.login.success', expect.any(Object));
    });
  });

  describe('logout', () => {
    it('should throw when authorization header is missing', () => {
      expect(() => service.logout({}, undefined, 'corr-1')).toThrow(AppException);
    });

    it('should throw when authorization header is invalid', () => {
      expect(() => service.logout({}, 'InvalidHeader', 'corr-1')).toThrow(AppException);
    });

    it('should revoke tokens on successful logout', () => {
      (jwtTokenService.validateAccessToken as jest.Mock).mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-456',
        jti: 'token-789',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iss: mockConfig.issuer,
        aud: mockConfig.audience,
      });

      const response = service.logout({}, 'Bearer valid-access-token', 'corr-1');

      expect(response.revoked).toBe(true);
      expect(jwtTokenService.revokeRefreshToken).toHaveBeenCalled();
    });

    it('should support logout all sessions', () => {
      (jwtTokenService.validateAccessToken as jest.Mock).mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-456',
        jti: 'token-789',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iss: mockConfig.issuer,
        aud: mockConfig.audience,
      });

      (jwtTokenService.revokeSessionTokens as jest.Mock).mockReturnValue(3);

      const response = service.logout({ allSessions: true }, 'Bearer valid-access-token', 'corr-1');

      expect(jwtTokenService.revokeSessionTokens).toHaveBeenCalledWith('session-456', 'corr-1');
      expect(response.revokedSessionCount).toBe(3);
    });
  });

  describe('refresh', () => {
    it('should throw when refresh token is invalid', () => {
      (jwtTokenService.validateRefreshToken as jest.Mock).mockReturnValue(null);

      expect(() => service.refresh({ refreshToken: 'invalid-token' }, 'corr-1')).toThrow(
        AppException,
      );
    });

    it('should generate new token pair on valid refresh', () => {
      (jwtTokenService.validateRefreshToken as jest.Mock).mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-456',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1209600,
        iss: mockConfig.issuer,
        aud: mockConfig.audience,
        jti: 'token-789',
      });

      const response = service.refresh({ refreshToken: 'valid-refresh-token' }, 'corr-1');

      expect(response.tokenType).toBe('Bearer');
      expect(response.accessToken).toBe('access-token-123');
      expect(response.refreshToken).toBe('refresh-token-456');
      expect(jwtTokenService.generateAccessToken).toHaveBeenCalledWith(
        'user-123',
        expect.any(String),
        'corr-1',
      );
    });
  });

  describe('getSession', () => {
    it('should throw when authorization header is missing', () => {
      expect(() => service.getSession(undefined, 'corr-1')).toThrow(AppException);
    });

    it('should throw when access token is invalid', () => {
      (jwtTokenService.validateAccessToken as jest.Mock).mockReturnValue(null);

      expect(() => service.getSession('Bearer invalid-token', 'corr-1')).toThrow(AppException);
    });

    it('should return session info with validated token payload', () => {
      const now = Math.floor(Date.now() / 1000);
      (jwtTokenService.validateAccessToken as jest.Mock).mockReturnValue({
        sub: 'user-123',
        sessionId: 'session-456',
        jti: 'token-789',
        type: 'access',
        iat: now,
        exp: now + 900,
        iss: mockConfig.issuer,
        aud: mockConfig.audience,
      });

      const response = service.getSession('Bearer valid-access-token', 'corr-1');

      expect(response.authenticated).toBe(true);
      expect(response.user.userId).toBe('user-123');
      expect(response.token.issuer).toBe(mockConfig.issuer);
      expect(response.token.audience).toBe(mockConfig.audience);
      expect(logger.info).toHaveBeenCalledWith('auth.session.checked', expect.any(Object));
    });
  });
});
