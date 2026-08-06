# ADR-0001 — Front desenvolvido sobre dados mock antes da API real

- **Status:** Aceito
- **Data:** 2026-08-06
- **Afeta:** `src/services/`, Fase 1 e Fase 5 do backlog

## Contexto

O backend (Node + Express + Prisma + PostgreSQL) é um repositório separado e não está disponível para consumo neste momento. As telas do MVP (dashboard, lista, cadastro, detalhes) dependem de dados de projetos para serem construídas e demonstradas, e o próprio spec prevê **dados fictícios inseridos manualmente** (`context/03_contexto_completo_projeto.md`, §6).

Esperar o backend para começar o front sequencia o trabalho sem necessidade e concentra risco no fim do cronograma.

## Decisão

O frontend é desenvolvido contra uma camada de dados mock local, atrás da mesma interface de `services/` que a API real vai usar. A troca para o backend real é uma tarefa isolada (F5-1) e deve se resumir a apontar a `baseURL` e desligar o mock.

Nenhum componente ou página sabe se o dado veio do mock ou da API.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Esperar o backend ficar pronto | Serializa o cronograma e joga a integração das telas para o fim, quando não há folga para corrigir. |
| Dados fixos escritos dentro dos componentes | Some a fronteira de serviço; a integração real viraria reescrita das telas. |
| Backend fake separado (json-server) | Mais uma peça de infraestrutura para rodar e manter, sem ganho para o MVP. |

## Consequências

- O front pode ser construído e demonstrado de ponta a ponta sem backend.
- O seed de mock passa a ser um ativo de teste: precisa cobrir os 5 status, um projeto atrasado, um com orçamento excedido e um com `budget = 0` (ver armadilha A-001 em [LESSONS](../LESSONS.md)).
- Risco a controlar: o mock ser "gentil" e esconder problemas de dados reais (campos nulos, listas vazias, latência, erro HTTP). O mock deve permitir simular erro e lista vazia.
- F5-1 precisa validar o casing real do contrato — ver [ADR-0002](ADR-0002-contrato-de-dados-e-mapeamento.md).
