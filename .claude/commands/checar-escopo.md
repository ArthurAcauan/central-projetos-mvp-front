---
description: Verifica se as mudanças atuais respeitam o escopo e as regras do MVP
---

Verificação rápida de escopo das mudanças em andamento — use no meio da implementação, quando surgir a dúvida "isso ainda é MVP?".

1. Obtenha o estado atual: `git status --short` e `git diff` (mais `git diff main...HEAD` se já houver commits no branch).

2. Invoque o subagente `revisor-escopo` sobre essas mudanças.

3. Reporte o resultado agrupado em:
   - **Fora de escopo** — precisa sair ou virar ADR antes de continuar.
   - **Regra de negócio violada** — precisa correção.
   - **Atenção** — não bloqueia, mas vale saber.

Se estiver tudo dentro do escopo, responda em uma linha e siga o trabalho. Não transforme uma checagem limpa em relatório longo.
