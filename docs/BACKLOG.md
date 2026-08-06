# Backlog do Frontend

Fatias pequenas, cada uma rastreada até um requisito funcional. Uma fatia = um branch = uma entrega verificável.

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluído

Atualizado em: 2026-08-06

Referência visual de todas as telas: [prototype/](../prototype/) (código + prints).

---

## Fase 0 — Fundação (nenhum requisito funcional entregue ainda)

Objetivo: sair do esqueleto para um app que roda, com verificação automática funcionando.

- [x] **F0-1 — Scaffold do projeto**
  Vite 8 + React 19 + TypeScript 5.9, Tailwind CSS v4, ESLint + Prettier + Vitest, alias `@/`, `prototype/` excluído de build/lint/typecheck/test.
  *Verificado:* typecheck, lint, test (1) e build verdes.

- [ ] **F0-2 — Casca da aplicação**
  `AppShell` com a sidebar escura do protótipo (seções PRINCIPAL / CADASTROS, rodapé com o usuário), rotas em `src/routes/` com páginas placeholder, usuário logado **simulado** (contexto fixo com nome e `role`).
  *Pronto quando:* navegar entre Dashboard, Projetos, Clientes, Equipes e Usuários funciona por URL. Sem autenticação real (RNF03).
  *Referência:* `prototype/**/src/components/Sidebar.tsx` e o rodapé "Rodrigo Almeida · Gerente" nos prints.

- [ ] **F0-3 — Cliente HTTP base**
  `src/services/http.ts` com `baseURL` vindo de `VITE_API_URL`, tratamento de erro padronizado, `.env.example` versionado.
  *Pronto quando:* um serviço consegue fazer uma chamada e o erro chega tratado na UI.

## Fase 1 — Domínio e dados (base de todo o resto)

Objetivo: tipos, regras e indicadores testados **antes** de qualquer tela depender deles.

- [ ] **F1-1 — Tipos de domínio** — `src/types/`: `Project`, `Client`, `Team`, `User`, `ProjectStatus`, `UserRole` com os literais exatos do spec.

- [ ] **F1-2 — Indicadores e regras (crítico)** — `src/domain/indicators.ts` + testes.
  Funções: `budgetConsumptionPercent`, `isLate`, `isOverBudget`, `needsAttention`, e os agregados do dashboard.
  *Cuidado obrigatório (ver [LESSONS](LESSONS.md)):* `budget = 0` não pode gerar `Infinity`/`NaN`; comparação de `deadline` em data local; `budget_spent > budget` **não** é erro de validação (RN03).
  *Pronto quando:* testes cobrem RN01–RN06, os três indicadores derivados e os casos de borda acima.

- [ ] **F1-3 — Serviços REST** — `src/services/{projects,clients,teams,users}.ts` + mapeamento do contrato (ver [ADR-0002](decisions/ADR-0002-contrato-de-dados-e-mapeamento.md)).
  *Pronto quando:* nenhuma página conhece o formato do JSON da API.

- [ ] **F1-4 — Dados mock** — camada de mock + seed fictício (~15 projetos cobrindo os 5 status, um atrasado, um com orçamento excedido, um com `budget = 0`).
  *Pronto quando:* o front roda inteiro sem backend (ver [ADR-0001](decisions/ADR-0001-mock-primeiro.md)).

## Fase 2 — Projetos (RF03, RF04, RF05, RF06)

- [ ] **F2-1 — Lista de projetos (RF04)** — tabela com filtros por status e cliente, destaque visual para atrasado/em risco, estados de carregando/vazio/erro.
- [ ] **F2-2 — Detalhes do projeto (RF05)** — todos os campos + indicadores específicos do projeto.
- [ ] **F2-3 — Cadastro de projeto (RF03)** — formulário com validação das regras RN01–RN06. `budget_spent > budget` passa com aviso, não com erro.
- [ ] **F2-4 — Atualização de projeto (RF06)** — reaproveitar o formulário de F2-3.

## Fase 3 — Cadastros auxiliares (RF01, RF02)

- [ ] **F3-1 — Clientes (RF02)** — lista + cadastro.
- [ ] **F3-2 — Equipes** — lista + cadastro.
- [ ] **F3-3 — Usuários (RF01)** — lista + cadastro com `role` (GERENTE, COORDENADOR, GESTOR_PROJETO). Perfil é dado cadastral, **não** controle de acesso.

## Fase 4 — Dashboard (RF07, RF08, RF09)

- [ ] **F4-1 — Cards de indicadores (RF07)** — total de projetos, orçamento total, orçamento consumido e %, horas realizadas, em risco, atrasados.
- [ ] **F4-2 — Gráficos (RF08)** — Recharts: projetos por status (rosca/barras), orçamento previsto vs consumido (barras), projetos por cliente (barras), horas por projeto (barras).
- [ ] **F4-3 — Painel de atenção (RF09)** — tabela dos projetos em risco/atrasados/com orçamento excedido, com link para os detalhes.

## Fase 5 — Integração e fechamento

- [ ] **F5-1 — Integração com a API real** — trocar mock por backend; validar casing do contrato na prática.
- [ ] **F5-2 — Usabilidade e robustez (RNF01, RNF02)** — revisão de estados vazios/erro, responsividade, formatação de moeda/data pt-BR, acessibilidade básica.
- [ ] **F5-3 — Fechamento acadêmico** — README com instruções, dados de demonstração, roteiro para a validação com profissionais de gestão.

---

## Fora do backlog por decisão de escopo

Autenticação/autorização real · RBAC efetivo · NPS · timesheet individual · gestão individual de membros de equipe · integrações corporativas · importação automática · IA no produto · microsserviços · BI externo.

Se algum destes precisar entrar, o caminho é: ADR em [docs/decisions/](decisions/) → atualizar `context/` → atualizar `CLAUDE.md`. Nunca direto no código.
