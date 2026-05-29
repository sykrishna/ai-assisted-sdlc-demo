import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard.
 * Guards endpoints by verifying a valid JWT access token is present.
 * Usage: @UseGuards(JwtAuthGuard)
 *
 * SECURITY: This guard only validates the token signature and expiration.
 * Additional authorization checks (roles, permissions) should be handled
 * by separate guards (e.g., RolesGuard in Phase 2).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
