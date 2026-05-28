import { AuthService } from './auth.service';
import type { StructuredLoggerService } from '../common/logging/structured-logger.service';

describe('AuthService', () => {
  let service: AuthService;
  let logger: StructuredLoggerService;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as StructuredLoggerService;

    service = new AuthService(
      {
        issuer: 'test-issuer',
        audience: 'test-audience',
        accessTokenTtlSeconds: 900,
        refreshTokenTtlSeconds: 1209600,
      },
      logger,
    );
  });

  it('returns placeholder login response with role-ready user structure', () => {
    const response = service.login(
      {
        identifier: 'alice@example.com',
        password: 'password123',
      },
      'corr-1',
    );

    expect(response.tokenType).toBe('Bearer');
    expect(response.user.roles).toEqual(['user']);
    expect(response.session.sessionId).toBeTruthy();
  });

  it('throws unauthorized when session is requested without bearer token', () => {
    expect(() => service.getSession(undefined, 'corr-2')).toThrow(
      'Missing or invalid bearer token.',
    );
  });
});
