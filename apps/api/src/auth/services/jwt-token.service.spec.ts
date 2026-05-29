import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';
import type { TokenPayload } from './jwt-token.service';
import type { StructuredLoggerService } from '../../common/logging/structured-logger.service';

type DecodedTokenPayload = Pick<
  TokenPayload,
  'jti' | 'sub' | 'sessionId' | 'type' | 'iss' | 'aud' | 'iat' | 'exp'
>;

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: JwtService;
  let logger: StructuredLoggerService;

  const mockConfig = {
    issuer: 'test-issuer',
    audience: 'test-audience',
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 1209600,
    accessTokenSecret: 'test-access-token-secret-minimum-32-characters-length',
    refreshTokenSecret: 'test-refresh-token-secret-minimum-32-characters-length',
  };

  beforeEach(() => {
    jwtService = new JwtService({
      secret: mockConfig.accessTokenSecret,
      signOptions: {
        expiresIn: mockConfig.accessTokenTtlSeconds,
      },
    });

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as StructuredLoggerService;

    service = new JwtTokenService(
      mockConfig as ConstructorParameters<typeof JwtTokenService>[0],
      jwtService,
      logger,
    );
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token with correct claims', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';
      const correlationId = 'corr-789';

      const token = service.generateAccessToken(userId, sessionId, correlationId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(logger.info).toHaveBeenCalledWith('auth.token.access.generated', expect.any(Object));
    });

    it('should include correct payload structure in access token', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';

      const token = service.generateAccessToken(userId, sessionId, 'corr-1');

      // Decode token (without verification for testing)
      const decoded = jwtService.decode(token) as DecodedTokenPayload;

      expect(decoded).toMatchObject({
        sub: userId,
        sessionId,
        type: 'access',
        iss: mockConfig.issuer,
        aud: mockConfig.audience,
      });
      expect(decoded.jti).toBeTruthy();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token with correct claims', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';
      const correlationId = 'corr-789';

      const token = service.generateRefreshToken(userId, sessionId, correlationId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(logger.info).toHaveBeenCalledWith('auth.token.refresh.generated', expect.any(Object));
    });

    it('should store refresh token metadata for revocation tracking', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';

      service.generateRefreshToken(userId, sessionId, 'corr-1');

      // Verify token was logged
      expect(logger.info).toHaveBeenCalledWith(
        'auth.token.refresh.generated',
        expect.objectContaining({
          jti: expect.any(String),
          expiresIn: mockConfig.refreshTokenTtlSeconds,
        }),
      );
    });
  });

  describe('validateAccessToken', () => {
    it('should validate a correctly signed access token', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';

      const token = service.generateAccessToken(userId, sessionId, 'corr-1');
      const payload = service.validateAccessToken(token, 'corr-2');

      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe(userId);
      expect(payload?.sessionId).toBe(sessionId);
      expect(payload?.type).toBe('access');
    });

    it('should reject refresh token when validating as access token', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';

      const refreshToken = service.generateRefreshToken(userId, sessionId, 'corr-1');
      // Try to validate refresh token as access token
      const payload = service.validateAccessToken(refreshToken, 'corr-2');

      expect(payload).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'auth.token.access.validation_failed',
        expect.any(Object),
      );
    });

    it('should reject malformed token', () => {
      const payload = service.validateAccessToken('invalid-token', 'corr-1');

      expect(payload).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'auth.token.access.validation_failed',
        expect.any(Object),
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a correctly signed refresh token', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';

      const token = service.generateRefreshToken(userId, sessionId, 'corr-1');
      const payload = service.validateRefreshToken(token, 'corr-2');

      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe(userId);
      expect(payload?.sessionId).toBe(sessionId);
      expect(payload?.type).toBe('refresh');
    });

    it('should reject revoked refresh token', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';

      const token = service.generateRefreshToken(userId, sessionId, 'corr-1');
      const decoded = jwtService.decode(token) as DecodedTokenPayload;

      // Revoke the token
      service.revokeRefreshToken(decoded.jti, 'corr-2');

      // Try to validate revoked token
      const payload = service.validateRefreshToken(token, 'corr-3');

      expect(payload).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('auth.token.refresh.revoked', expect.any(Object));
    });
  });

  describe('revokeRefreshToken', () => {
    it('should mark refresh token as revoked', () => {
      const token = service.generateRefreshToken('user-123', 'session-456', 'corr-1');
      const decoded = jwtService.decode(token) as DecodedTokenPayload;

      service.revokeRefreshToken(decoded.jti, 'corr-2');

      expect(logger.info).toHaveBeenCalledWith(
        'auth.token.refresh.revoked',
        expect.objectContaining({
          jti: decoded.jti,
        }),
      );
    });
  });

  describe('revokeSessionTokens', () => {
    it('should revoke all tokens for a session', () => {
      const sessionId = 'session-123';

      // Generate multiple tokens for same session
      service.generateRefreshToken('user-1', sessionId, 'corr-1');
      service.generateRefreshToken('user-2', sessionId, 'corr-2');
      service.generateRefreshToken('user-3', 'other-session', 'corr-3');

      const revokedCount = service.revokeSessionTokens(sessionId, 'corr-4');

      expect(revokedCount).toBe(2);
      expect(logger.info).toHaveBeenCalledWith(
        'auth.token.session.revoked',
        expect.objectContaining({
          sessionId,
          revokedCount: 2,
        }),
      );
    });
  });

  describe('getTokenTtls', () => {
    it('should return configured TTL values', () => {
      const ttls = service.getTokenTtls();

      expect(ttls.accessToken).toBe(mockConfig.accessTokenTtlSeconds);
      expect(ttls.refreshToken).toBe(mockConfig.refreshTokenTtlSeconds);
    });
  });
});
