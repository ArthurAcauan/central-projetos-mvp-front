#!/usr/bin/env node
// PostToolUse: feedback rapido de tipos/lint apos editar codigo em src/.
// Informativo (nao bloqueia): devolve os erros como contexto para correcao imediata.
// Silencioso enquanto o projeto ainda nao tem package.json/node_modules.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

const input = readInput();
const file = input.tool_response?.filePath ?? input.tool_input?.file_path ?? '';
const norm = String(file).replace(/\\/g, '/');

// Só reage a codigo-fonte TS/TSX dentro de src/.
if (!/\/src\/.*\.(ts|tsx)$/.test(norm)) process.exit(0);
if (!existsSync('package.json') || !existsSync('node_modules')) process.exit(0);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(args) {
  const r = spawnSync(npx, args, {
    encoding: 'utf8',
    timeout: 60_000,
    shell: false,
  });
  return {
    ok: r.status === 0,
    out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim(),
    ran: r.status !== null && !r.error,
  };
}

const problems = [];

if (existsSync('tsconfig.json')) {
  const tsc = run(['--no-install', 'tsc', '--noEmit']);
  if (tsc.ran && !tsc.ok && tsc.out) {
    problems.push(`# tsc --noEmit\n${tsc.out.split('\n').slice(0, 40).join('\n')}`);
  }
}

const hasEslintConfig = [
  'eslint.config.js',
  'eslint.config.mjs',
  '.eslintrc.cjs',
  '.eslintrc.json',
].some((f) => existsSync(f));

if (hasEslintConfig) {
  const lint = run(['--no-install', 'eslint', norm]);
  if (lint.ran && !lint.ok && lint.out) {
    problems.push(`# eslint ${norm}\n${lint.out.split('\n').slice(0, 30).join('\n')}`);
  }
}

if (problems.length === 0) process.exit(0);

process.stdout.write(
  JSON.stringify({
    systemMessage: 'Harness: typecheck/lint reportou problemas no arquivo editado.',
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext:
        'Verificacao automatica apos a edicao encontrou problemas. ' +
        'Corrija antes de seguir para a proxima etapa:\n\n' +
        problems.join('\n\n'),
    },
  })
);
process.exit(0);
