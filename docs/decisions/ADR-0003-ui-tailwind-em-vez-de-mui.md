# ADR-0003 — Tailwind CSS v4 como camada de UI, em vez de MUI

- **Status:** Aceito
- **Data:** 2026-08-06
- **Afeta:** toda a camada de apresentação, `context/00_harness_frontend.md`, `context/02_arquitetura_final_projeto.md`, Fases 0 a 4 do backlog

## Contexto

A arquitetura documentada previa **MUI** como biblioteca de interface (`context/02_arquitetura_final_projeto.md`, §2; `context/00_harness_frontend.md`). Essa escolha foi feita antes de existir protótipo.

Foi produzido um protótipo funcional e validado visualmente no Figma Make, disponível em [prototype/](../../prototype/), cobrindo dashboard, lista de projetos, detalhes, formulário e os três cadastros auxiliares. Esse protótipo usa **Tailwind CSS v4** e **não usa nenhuma biblioteca de componentes** — os componentes são escritos à mão com classes utilitárias.

Dois fatos pesaram na decisão:

1. Como o protótipo não depende de biblioteca de componentes, a escolha aqui não é "componentes prontos vs. escrever à mão", e sim **reescrever um visual já aprovado vs. reaproveitá-lo**. O visual do protótipo (sidebar escura, cards com faixa de acento, tabelas densas, Inter + DM Mono, raio de 6px) não é a linguagem do Material Design; reproduzi-lo em MUI exigiria tema customizado extenso e ainda assim divergiria do print aprovado.
2. A amarração documental com MUI é menor do que parecia: `context/03_contexto_completo_projeto.md`, §12.1, fala apenas em "biblioteca de UI orientada a produtividade". Só dois documentos citam MUI pelo nome.

## Decisão

A camada de UI é **Tailwind CSS v4** via `@tailwindcss/vite`, sem biblioteca de componentes. Os design tokens do protótipo (cores, raio, fontes) foram portados para `src/index.css` e são a única fonte de estilo global.

O protótipo em `prototype/` é a **referência visual** do projeto: as telas implementadas devem corresponder a ele. Não é código de produção e está excluído de build, lint, typecheck e testes.

Recharts permanece como biblioteca de gráficos — era comum às duas opções.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Manter MUI conforme o documento | Descarta o protótipo validado e entrega visual diferente do aprovado. O ganho (componentes de formulário prontos) não compensa reescrever telas que já existem. |
| Tailwind + shadcn/ui (Radix) | Traz acessibilidade pronta, mas adiciona ~10 dependências e uma camada de componentes que o protótipo não usa, contra a diretriz explícita de simplicidade do projeto. |

## Consequências

- O visual aprovado é preservado e o esforço do protótipo é reaproveitado.
- **Custo assumido:** componentes de formulário (input, select, data, modal) são escritos à mão. O protótipo já os tem, então o custo é de porte, não de criação.
- **Risco assumido:** sem Radix/MUI, acessibilidade (foco, `aria-*`, navegação por teclado) passa a ser responsabilidade nossa. Vira item de revisão em F5-2 e critério do agente `revisor-front`.
- Documentos atualizados neste mesmo commit: `context/00_harness_frontend.md`, `context/02_arquitetura_final_projeto.md`, `CLAUDE.md`, `docs/BACKLOG.md`, e a allowlist de dependências em `.claude/hooks/scope-guard.mjs`.
- **Pendência para o TCC:** a seção de stack do documento teórico precisa refletir Tailwind CSS v4 em lugar de MUI, com a justificativa acima.
