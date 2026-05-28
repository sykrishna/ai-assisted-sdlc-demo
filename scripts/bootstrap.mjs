#!/usr/bin/env node
import { copyFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  console.log('Created .env from .env.example.');
}

run('pnpm', ['install']);
run('pnpm', ['env:validate']);

console.log('Bootstrap complete. Run "pnpm dev" or "pnpm docker:up".');
