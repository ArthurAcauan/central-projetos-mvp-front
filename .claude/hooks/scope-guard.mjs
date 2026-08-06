#!/usr/bin/env node
// PreToolUse (Bash/PowerShell): guardrail de escopo e de stack.
// O maior risco deste MVP nao e erro de codigo, e crescimento de escopo:
// autenticacao real, RBAC, timesheet, BI externo, state manager pesado.
// Aqui a instalacao de dependencias fora da stack aprovada vira uma confirmacao
// explicita, em vez de acontecer silenciosamente.
import { readFileSync } from 'node:fs';

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

const input = readInput();
const cmd = String(input.tool_input?.command ?? '');

// Dependencias aprovadas pela arquitetura (context/02_arquitetura_final_projeto.md).
// UI: Tailwind CSS v4, conforme ADR-0003 (substituiu MUI para seguir o prototipo).
const APPROVED = [
  'react',
  'react-dom',
  'react-router-dom',
  'tailwindcss',
  '@tailwindcss/',
  'recharts',
  'axios',
  'react-hook-form',
  'zod',
  '@hookform/resolvers',
  'dayjs',
  'vite',
  '@vitejs/',
  'typescript',
  'tslib',
  'eslint',
  '@eslint/',
  'typescript-eslint',
  '@typescript-eslint/',
  'eslint-plugin-',
  'eslint-config-',
  'prettier',
  'vitest',
  '@vitest/',
  '@testing-library/',
  'jsdom',
  'msw',
  '@types/',
  'globals',
];

// Termos que sinalizam funcionalidade explicitamente fora do MVP.
const OUT_OF_SCOPE = [
  'passport',
  'next-auth',
  'auth0',
  'jsonwebtoken',
  'jose',
  'bcrypt',
  'keycloak',
  '@azure/msal',
  'firebase',
  'supabase',
  'clerk',
  'powerbi',
  'superset',
];

const installMatch = cmd.match(
  /\b(?:npm\s+(?:i|install|add)|yarn\s+add|pnpm\s+(?:i|install|add))\b([^&|;]*)/i
);

if (!installMatch) process.exit(0);

const rest = installMatch[1] ?? '';
const pkgs = rest
  .split(/\s+/)
  .map((t) => t.trim())
  .filter((t) => t && !t.startsWith('-'));

if (pkgs.length === 0) process.exit(0); // npm install puro (restaura lockfile)

const bare = (p) => p.replace(/(?<=.)@[^@/]*$/, ''); // remove @versao, preserva escopo
const flagged = pkgs.filter((p) => {
  const name = bare(p).toLowerCase();
  return !APPROVED.some((a) => name === a || name.startsWith(a));
});
const blocked = pkgs.filter((p) => {
  const name = bare(p).toLowerCase();
  return OUT_OF_SCOPE.some((o) => name.includes(o));
});

if (blocked.length > 0) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Fora do escopo do MVP: ${blocked.join(', ')}. ` +
          'Autenticacao/autorizacao real e BI externo estao explicitamente fora do ' +
          'MVP (context/00_harness_frontend.md). O usuario logado e simulado. ' +
          'Se o escopo mudou, registre um ADR em docs/decisions/ antes de instalar.',
      },
      systemMessage: `Guardrail de escopo: instalacao bloqueada (${blocked.join(', ')})`,
    })
  );
  process.exit(0);
}

if (flagged.length > 0) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason:
          `Dependencia fora da stack aprovada: ${flagged.join(', ')}. ` +
          'A stack definida e React + TS + Vite + Tailwind CSS v4 + Recharts (ADR-0003). ' +
          'Confirme se realmente precisa disso ou use o que ja existe na stack.',
      },
    })
  );
  process.exit(0);
}

process.exit(0);
