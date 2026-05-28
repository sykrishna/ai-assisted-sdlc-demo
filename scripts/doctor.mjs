#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function commandVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    return null;
  }

  return (result.stdout || '').trim();
}

function major(version) {
  const clean = version.replace(/^v/, '').split('.')[0];
  return Number(clean);
}

const nodeVersion = process.version;
const pnpmVersion = commandVersion('pnpm', ['-v']);
const dockerVersion = commandVersion('docker', ['--version']);

if (major(nodeVersion) < 20) {
  console.error(`Node.js ${nodeVersion} detected. Require >= v20.`);
  process.exit(1);
}

if (!pnpmVersion || major(pnpmVersion) < 9) {
  console.error(`pnpm ${pnpmVersion ?? 'not found'} detected. Require >= 9.`);
  process.exit(1);
}

console.log(`Node.js ${nodeVersion}: ok`);
console.log(`pnpm ${pnpmVersion}: ok`);
console.log(`Docker ${dockerVersion ?? 'not installed (optional for host-only workflow)'}`);
