import { Inject, Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import { authConfig } from '../config/auth.config';

/**
 * Token claims payload structure with security-relevant fields.
 * SECURITY: Keeps payload minimal to reduce attack surface. Additional user data
 * should be fetched from a service on demand, not embedded in tokens.
 */
export interface TokenPayload {
  /** Unique token identifier for revocation tracking */
  jti: string;
  /** Subject (user ID) - identifies token owner */
  sub: string;
  /** Session ID for logout tracking across tokens */
  sessionId: string;
  /** Token type: 'access' or 'refresh' */
  type: 'access' | 'refresh';
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Issuer */
  iss: string;
  /** Audience */
  aud: string;
}

/**
 * JWT token generation and validation service.
 * Handles minting, validation, and rotation of access and refresh tokens.
 * SECURITY: All token operations are logged without sensitive values.
 */
@Injectable()
export class JwtTokenService {
  private readonly refreshTokenStore = new Map<string, RefreshTokenMetadata>();

  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    @Inject(NestJwtService)
    private readonly jwtService: NestJwtService,
    @Inject(StructuredLoggerService)
    private readonly logger: StructuredLoggerService,
  ) {}

  /**
   * Generate access token with short TTL.
   * SECURITY: Access tokens are short-lived (default 15min) to minimize
   * exposure if compromised. Refresh tokens are used for extended sessions.
   */
  generateAccessToken(userId: string, sessionId: string, correlationId: string): string {
    const jti = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.accessTokenTtlSeconds;

    // Payload WITHOUT exp - JWT library will add it based on expiresIn
    const payload: Omit<TokenPayload, 'exp'> = {
      jti,
      sub: userId,
      sessionId,
      type: 'access',
      iat: now,
      iss: this.config.issuer,
      aud: this.config.audience,
    };

    try {
      const token = this.jwtService.sign(payload, {
        secret: this.config.accessTokenSecret,
        expiresIn,
      });
      this.logger.info('auth.token.access.generated', {
        correlationId,
        jti,
        expiresIn,
      });
      return token;
    } catch (error) {
      this.logger.error('auth.token.access.generation_failed', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate refresh token with long TTL and rotation support.
   * SECURITY: Refresh tokens are longer-lived but tied to sessions for
   * immediate invalidation on logout. Supports token rotation to prevent
   * family replay attacks (TODO: implement in Phase 2).
   */
  generateRefreshToken(userId: string, sessionId: string, correlationId: string): string {
    const jti = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.refreshTokenTtlSeconds;

    // Payload WITHOUT exp - JWT library will add it based on expiresIn
    const payload: Omit<TokenPayload, 'exp'> = {
      jti,
      sub: userId,
      sessionId,
      type: 'refresh',
      iat: now,
      iss: this.config.issuer,
      aud: this.config.audience,
    };

    try {
      const token = this.jwtService.sign(payload, {
        secret: this.config.refreshTokenSecret,
        expiresIn,
      });

      // Store metadata for refresh token rotation tracking.
      // TODO(auth-phase-2): persist to database for cross-instance support.
      this.refreshTokenStore.set(jti, {
        userId,
        sessionId,
        issuedAt: new Date(now * 1000),
        expiresAt: new Date((now + expiresIn) * 1000),
        familyId: randomUUID(), // For rotation replay detection
        revoked: false,
      });

      this.logger.info('auth.token.refresh.generated', {
        correlationId,
        jti,
        expiresIn,
      });

      return token;
    } catch (error) {
      this.logger.error('auth.token.refresh.generation_failed', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validate and decode access token.
   * SECURITY: Verification is performed server-side. Token signature is
   * cryptographically validated to prevent tampering.
   */
  validateAccessToken(token: string, correlationId: string): TokenPayload | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.accessTokenSecret,
      }) as TokenPayload;

      // Ensure token is of correct type
      if (payload.type !== 'access') {
        this.logger.warn('auth.token.access.type_mismatch', {
          correlationId,
          tokenType: payload.type,
        });
        return null;
      }

      this.logger.info('auth.token.access.validated', {
        correlationId,
        jti: payload.jti,
      });

      return payload;
    } catch (error) {
      this.logger.warn('auth.token.access.validation_failed', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Validate and decode refresh token.
   * SECURITY: Includes revocation check for logout enforcement.
   */
  validateRefreshToken(token: string, correlationId: string): TokenPayload | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.refreshTokenSecret,
      }) as TokenPayload;

      // Ensure token is of correct type
      if (payload.type !== 'refresh') {
        this.logger.warn('auth.token.refresh.type_mismatch', {
          correlationId,
          tokenType: payload.type,
        });
        return null;
      }

      // Check if token has been revoked (for logout support)
      const metadata = this.refreshTokenStore.get(payload.jti);
      if (metadata?.revoked) {
        this.logger.warn('auth.token.refresh.revoked', {
          correlationId,
          jti: payload.jti,
        });
        return null;
      }

      this.logger.info('auth.token.refresh.validated', {
        correlationId,
        jti: payload.jti,
      });

      return payload;
    } catch (error) {
      this.logger.warn('auth.token.refresh.validation_failed', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Revoke refresh token for logout support.
   * SECURITY: Marks tokens as revoked without expiring them cryptographically.
   * Immediate logout effect. Supports global logout (all sessions) in Phase 2.
   * TODO(auth-phase-2): persist revocations to database for multi-instance support.
   */
  revokeRefreshToken(jti: string, correlationId: string): void {
    const metadata = this.refreshTokenStore.get(jti);
    if (metadata) {
      metadata.revoked = true;
      this.logger.info('auth.token.refresh.revoked', {
        correlationId,
        jti,
      });
    }
  }

  /**
   * Revoke all refresh tokens for a session (logout all devices).
   * TODO(auth-phase-2): implement with database persistence.
   */
  revokeSessionTokens(sessionId: string, correlationId: string): number {
    let revokedCount = 0;
    for (const metadata of this.refreshTokenStore.values()) {
      if (metadata.sessionId === sessionId && !metadata.revoked) {
        metadata.revoked = true;
        revokedCount++;
      }
    }

    this.logger.info('auth.token.session.revoked', {
      correlationId,
      sessionId,
      revokedCount,
    });

    return revokedCount;
  }

  /**
   * Get TTL values for client use (in seconds).
   */
  getTokenTtls(): { accessToken: number; refreshToken: number } {
    return {
      accessToken: this.config.accessTokenTtlSeconds,
      refreshToken: this.config.refreshTokenTtlSeconds,
    };
  }
}

/**
 * In-memory metadata for refresh tokens.
 * TODO(auth-phase-2): migrate to persistent store (Redis or database).
 */
interface RefreshTokenMetadata {
  userId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
  familyId: string; // For rotation replay detection (TODO: implement)
  revoked: boolean;
}
