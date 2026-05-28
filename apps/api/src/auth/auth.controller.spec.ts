import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
      getSession: jest.fn(),
    } as unknown as AuthService;

    controller = new AuthController(authService);
  });

  it('should delegate login to AuthService', () => {
    const result = {
      tokenType: 'Bearer',
      accessToken: 'test',
      refreshToken: 'test',
      user: { roles: ['user'] },
      session: { sessionId: 'test', issuedAt: new Date(), expiresAt: new Date() },
    };
    (authService.login as jest.Mock).mockReturnValue(result);

    const response = controller.login(
      {
        identifier: 'alice@example.com',
        password: 'password123',
      },
      'corr-1',
    );

    expect(response).toEqual(result);
    expect(authService.login).toHaveBeenCalled();
  });
});
