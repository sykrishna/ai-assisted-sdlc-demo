import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { authConfig } from '../config/auth.config';
import type { TokenPayload } from '../services/jwt-token.service';

/**
 * JWT Strategy for Passport.js integration.
 * Extracts and validates JWT tokens from incoming requests.
 * SECURITY: Uses symmetric key (HMAC) for signing and verification.
 * For production, consider asymmetric keys (RS256) for multi-service architectures.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
  ) {
    super({
      // Extract token from Authorization header as "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Validate issuer and audience to ensure token is from expected source
      audience: config.audience,
      issuer: config.issuer,
      // Use the access token secret for validation
      secretOrKey: config.accessTokenSecret,
      // Ensure token hasn't expired
      ignoreExpiration: false,
    });
  }

  /**
   * Validate JWT payload after Passport verification.
   * This is called after the JWT has been cryptographically verified.
   * SECURITY: Token expiration is checked automatically by Passport.
   * Returns the payload if valid, which becomes available as user context.
   */
  validate(payload: TokenPayload): TokenPayload {
    // Additional custom validation can go here if needed
    // For now, we trust the JWT payload since signature was verified
    return payload;
  }
}
