import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { authConfig } from './config/auth.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: authConfig.KEY,
          useValue: {
            issuer: 'test-issuer',
            audience: 'test-audience',
            accessTokenTtlSeconds: 900,
            refreshTokenTtlSeconds: 1209600,
          },
        },
        {
          provide: StructuredLoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
