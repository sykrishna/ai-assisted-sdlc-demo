import { registerAs } from '@nestjs/config';

type AuthConfig = {
  issuer: string;
  audience: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  accessTokenSecret: string;
  refreshTokenSecret: string;
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

function parseSecret(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required auth config: ${key}`);
  }

  if (value.length < 32) {
    throw new Error(
      `Invalid auth config value for ${key}: secret must be at least 32 characters (256 bits)`,
    );
  }

  return value;
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
    accessTokenSecret: parseSecret(process.env.JWT_ACCESS_TOKEN_SECRET, 'JWT_ACCESS_TOKEN_SECRET'),
    refreshTokenSecret: parseSecret(
      process.env.JWT_REFRESH_TOKEN_SECRET,
      'JWT_REFRESH_TOKEN_SECRET',
    ),
  }),
);
