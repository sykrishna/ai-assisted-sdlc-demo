import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    getSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should delegate login to AuthService', () => {
    const result = { tokenType: 'Bearer' };
    authService.login.mockReturnValue(result);

    expect(
      controller.login(
        {
          identifier: 'alice@example.com',
          password: 'password123',
        },
        'corr-1',
      ),
    ).toEqual(result);
    expect(authService.login).toHaveBeenCalled();
  });
});
