#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'local';

const required = [
  'NODE_ENV',
  'LOG_LEVEL',
  'NEXT_PUBLIC_API_BASE_URL',
  'API_PORT',
  'API_PREFIX',
  'JWT_ISSUER',
  'JWT_AUDIENCE',
  'JWT_ACCESS_TOKEN_TTL_SECONDS',
  'JWT_REFRESH_TOKEN_TTL_SECONDS',
  'JWT_JWKS_URL',
  'AWS_REGION',
  'TERRAFORM_ENV',
];

const requiredInCiOnly = [];

function parseDotEnv(path) {
  const content = readFileSync(path, 'utf8');
  const parsed = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}

let values = {};

if (mode === 'local') {
  if (!existsSync('.env')) {
    console.error('Missing .env. Copy .env.example to .env before running local workflows.');
    process.exit(1);
  }
  values = parseDotEnv('.env');
} else if (mode === 'ci') {
  values = process.env;
} else {
  console.error('Unknown mode. Use --mode=local or --mode=ci.');
  process.exit(1);
}

const missing = [...required, ...(mode === 'ci' ? requiredInCiOnly : [])].filter(
  (key) => !values[key] || String(values[key]).trim().length === 0,
);

if (missing.length > 0) {
  console.error(`Missing required environment variables (${mode}):`);
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const suspicious = Object.entries(values)
  .filter(([key, value]) => key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY'))
  .filter(([, value]) => /changeme|example|replace|dummy/i.test(String(value)));

if (suspicious.length > 0) {
  console.error('Found placeholder-like secret/token/key values. Replace with valid local values:');
  for (const [key] of suspicious) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log(`Environment validation passed for mode=${mode}.`);
