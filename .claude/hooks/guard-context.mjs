#!/usr/bin/env node
// PreToolUse guardrail: protege as fontes originais do projeto.
// Os .docx/.pdf em context/ sao a base de rastreabilidade academica do PF2.
// Editar/sobrescrever esses binarios destroi a fonte original -> sempre negar.
import { readFileSync } from 'node:fs';

function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

const input = readInput();
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? '';
const norm = String(target).replace(/\\/g, '/').toLowerCase();

const isContextBinary = /(^|\/)context\/[^/]*\.(docx|pdf)$/.test(norm);

if (isContextBinary) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'Bloqueado pelo harness: os arquivos .docx/.pdf em context/ sao as fontes ' +
          'originais do PF2 e nao devem ser alterados. Edite o .md equivalente ' +
          '(ex.: context/02_arquitetura_final_projeto.md) e registre a mudanca em ' +
          'docs/decisions/ se for estrutural.',
      },
      systemMessage: `Guardrail: escrita bloqueada em ${target}`,
    })
  );
  process.exit(0);
}

process.exit(0);
