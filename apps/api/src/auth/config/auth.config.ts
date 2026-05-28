import { registerAs } from '@nestjs/config';

type AuthConfig = {
  issuer: string;
  audience: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
};

function parseTtl(value: string | undefined, key: string): number {
  if (!value) {
    throw new Error(`Missing required auth config: ${key}`);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid auth config value for ${key}: expected positive integer`);
  }

  return parsed;
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    issuer: process.env.JWT_ISSUER ?? 'ai-assisted-sdlc-demo',
    audience: process.env.JWT_AUDIENCE ?? 'web-client',
    accessTokenTtlSeconds: parseTtl(
      process.env.JWT_ACCESS_TOKEN_TTL_SECONDS,
      'JWT_ACCESS_TOKEN_TTL_SECONDS',
    ),
    refreshTokenTtlSeconds: parseTtl(
      process.env.JWT_REFRESH_TOKEN_TTL_SECONDS,
      'JWT_REFRESH_TOKEN_TTL_SECONDS',
    ),
  }),
);
