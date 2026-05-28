#!/usr/bin/env node
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

run('pnpm', ['doctor']);
run('pnpm', ['bootstrap']);

console.log('Local setup complete.');
console.log('Use "pnpm dev" for host workflows or "pnpm docker:up" for container workflows.');
