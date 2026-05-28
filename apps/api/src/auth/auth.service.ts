import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { AppException } from '../common/http/app-exception';
import type { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { authConfig } from './config/auth.config';
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
    private readonly logger: StructuredLoggerService,
  ) {}

  login(request: LoginRequestDto, correlationId: string): LoginResponseDto {
    this.logger.info('auth.login.attempt', {
      correlationId,
      identifier: request.identifier,
      hasDeviceContext: Boolean(request.deviceContext),
    });

    // TODO(auth-phase-1): integrate credential verification and account lockout policy.
    // TODO(auth-phase-1): mint real JWT access token and rotating refresh token.
    // TODO(auth-phase-2): include authoritative RBAC roles sourced from identity provider.

    const session = this.buildSession();
    const response: LoginResponseDto = {
      accessToken: 'todo-access-token',
      accessTokenExpiresIn: this.config.accessTokenTtlSeconds,
      refreshToken: 'todo-refresh-token',
      refreshTokenExpiresIn: this.config.refreshTokenTtlSeconds,
      tokenType: 'Bearer',
      session,
      user: {
        userId: 'todo-user-id',
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
    this.requireAuthorizationHeader(authorizationHeader, correlationId);

    this.logger.info('auth.logout.requested', {
      correlationId,
      allSessions: request.allSessions ?? false,
      requestedSessionId: request.sessionId,
    });

    // TODO(auth-phase-1): revoke session in persistence store and enforce idempotency.
    // TODO(auth-phase-2): support admin-initiated revocation with RBAC guards.

    const response: LogoutResponseDto = {
      revoked: true,
      revokedSessionCount: request.allSessions ? 3 : 1,
      message: 'Logout accepted for placeholder auth implementation.',
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

    // TODO(auth-phase-1): validate refresh token, rotate token family, detect replay.
    // TODO(auth-phase-1): persist refresh session metadata and emit audit event.

    const session = this.buildSession();
    const response: RefreshResponseDto = {
      accessToken: 'todo-rotated-access-token',
      accessTokenExpiresIn: this.config.accessTokenTtlSeconds,
      refreshToken: 'todo-rotated-refresh-token',
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
    this.requireAuthorizationHeader(authorizationHeader, correlationId);

    // TODO(auth-phase-1): validate JWT signature/claims and session status.
    // TODO(auth-phase-2): enrich response with dynamic RBAC context from policy service.

    const session = this.buildSession();
    const response: SessionResponseDto = {
      authenticated: true,
      user: {
        userId: 'todo-user-id',
        displayName: 'Placeholder User',
        roles: ['user'],
      },
      session,
      token: {
        expiresAt: session.expiresAt,
        issuer: this.config.issuer,
        audience: this.config.audience,
      },
    };

    this.logger.info('auth.session.checked', {
      correlationId,
      sessionId: session.sessionId,
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
  ): void {
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      return;
    }

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
}
