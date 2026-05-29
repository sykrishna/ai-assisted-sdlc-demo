import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { AppException } from '../common/http/app-exception';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { authConfig } from './config/auth.config';
import { JwtTokenService } from './services/jwt-token.service';
import {
  type LoginRequestDto,
  type LoginResponseDto,
  type LogoutRequestDto,
  type LogoutResponseDto,
  type RefreshRequestDto,
  type RefreshResponseDto,
  type SessionResponseDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    @Inject(StructuredLoggerService)
    private readonly logger: StructuredLoggerService,
    @Inject(JwtTokenService)
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  login(request: LoginRequestDto, correlationId: string): LoginResponseDto {
    this.logger.info('auth.login.attempt', {
      correlationId,
      identifier: request.identifier,
      hasDeviceContext: Boolean(request.deviceContext),
    });

    // TODO(auth-phase-1): integrate credential verification and account lockout policy.
    // TODO(auth-phase-2): include authoritative RBAC roles sourced from identity provider.

    const userId = 'placeholder-user-id'; // TODO: get from identity provider
    const session = this.buildSession();

    // Generate real JWT tokens
    const accessToken = this.jwtTokenService.generateAccessToken(
      userId,
      session.sessionId,
      correlationId,
    );
    const refreshToken = this.jwtTokenService.generateRefreshToken(
      userId,
      session.sessionId,
      correlationId,
    );

    const response: LoginResponseDto = {
      accessToken,
      accessTokenExpiresIn: this.config.accessTokenTtlSeconds,
      refreshToken,
      refreshTokenExpiresIn: this.config.refreshTokenTtlSeconds,
      tokenType: 'Bearer',
      session,
      user: {
        userId,
        displayName: 'Placeholder User',
        roles: ['user'],
      },
    };

    this.logger.info('auth.login.success', {
      correlationId,
      sessionId: response.session.sessionId,
      userId: response.user.userId,
    });

    return response;
  }

  logout(
    request: LogoutRequestDto,
    authorizationHeader: string | undefined,
    correlationId: string,
  ): LogoutResponseDto {
    const token = this.requireAuthorizationHeader(authorizationHeader, correlationId);

    // Validate access token to get session ID
    const payload = this.jwtTokenService.validateAccessToken(token, correlationId);
    if (!payload) {
      throw new AppException({
        status: 401,
        code: 'AUTH_INVALID_TOKEN',
        title: 'Unauthorized',
        detail: 'Invalid or expired access token.',
        retryable: false,
      });
    }

    this.logger.info('auth.logout.requested', {
      correlationId,
      allSessions: request.allSessions ?? false,
      requestedSessionId: request.sessionId,
    });

    // Revoke tokens
    let revokedCount = 0;
    if (request.allSessions) {
      revokedCount = this.jwtTokenService.revokeSessionTokens(payload.sessionId, correlationId);
    } else {
      this.jwtTokenService.revokeRefreshToken(payload.jti, correlationId);
      revokedCount = 1;
    }

    // TODO(auth-phase-2): persist revocations to database for multi-instance support.
    // TODO(auth-phase-2): support admin-initiated revocation with RBAC guards.

    const response: LogoutResponseDto = {
      revoked: true,
      revokedSessionCount: revokedCount,
      message: 'Logout completed successfully.',
    };

    this.logger.info('auth.logout.completed', {
      correlationId,
      revokedSessionCount: response.revokedSessionCount,
    });

    return response;
  }

  refresh(request: RefreshRequestDto, correlationId: string): RefreshResponseDto {
    this.logger.info('auth.refresh.attempt', {
      correlationId,
      hasSessionId: Boolean(request.sessionId),
    });

    // Validate refresh token
    const payload = this.jwtTokenService.validateRefreshToken(request.refreshToken, correlationId);
    if (!payload) {
      throw new AppException({
        status: 401,
        code: 'AUTH_INVALID_REFRESH_TOKEN',
        title: 'Unauthorized',
        detail: 'Invalid or revoked refresh token.',
        retryable: false,
      });
    }

    // TODO(auth-phase-2): implement token family rotation to detect replay attacks.
    // TODO(auth-phase-2): persist refresh session metadata and emit audit event.

    const session = this.buildSession();

    // Generate new token pair
    const accessToken = this.jwtTokenService.generateAccessToken(
      payload.sub,
      session.sessionId,
      correlationId,
    );
    const refreshToken = this.jwtTokenService.generateRefreshToken(
      payload.sub,
      session.sessionId,
      correlationId,
    );

    const response: RefreshResponseDto = {
      accessToken,
      accessTokenExpiresIn: this.config.accessTokenTtlSeconds,
      refreshToken,
      refreshTokenExpiresIn: this.config.refreshTokenTtlSeconds,
      tokenType: 'Bearer',
      session,
    };

    this.logger.info('auth.refresh.success', {
      correlationId,
      sessionId: response.session.sessionId,
    });

    return response;
  }

  getSession(authorizationHeader: string | undefined, correlationId: string): SessionResponseDto {
    const token = this.requireAuthorizationHeader(authorizationHeader, correlationId);

    // Validate access token
    const payload = this.jwtTokenService.validateAccessToken(token, correlationId);
    if (!payload) {
      throw new AppException({
        status: 401,
        code: 'AUTH_INVALID_TOKEN',
        title: 'Unauthorized',
        detail: 'Invalid or expired access token.',
        retryable: false,
      });
    }

    // TODO(auth-phase-2): enrich response with dynamic RBAC context from policy service.

    const response: SessionResponseDto = {
      authenticated: true,
      user: {
        userId: payload.sub,
        displayName: 'Placeholder User',
        roles: ['user'],
      },
      session: this.buildSession(),
      token: {
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        issuer: payload.iss,
        audience: payload.aud,
      },
    };

    this.logger.info('auth.session.checked', {
      correlationId,
      sessionId: response.session.sessionId,
      userId: response.user.userId,
    });

    return response;
  }

  private buildSession() {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + this.config.accessTokenTtlSeconds * 1000);

    return {
      sessionId: randomUUID(),
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  private requireAuthorizationHeader(
    authorizationHeader: string | undefined,
    correlationId: string,
  ): string {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      this.logger.warn('auth.authorization.missing_or_invalid', {
        correlationId,
      });

      throw new AppException({
        status: 401,
        code: 'AUTH_UNAUTHORIZED',
        title: 'Unauthorized',
        detail: 'Missing or invalid bearer token.',
        retryable: false,
      });
    }

    return authorizationHeader.substring('Bearer '.length);
  }
}
