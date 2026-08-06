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

- [x] **F0-2 — Casca da aplicação**
  `AppShell` com a sidebar escura do protótipo (seções PRINCIPAL / CADASTROS, rodapé com o usuário), rotas em `src/routes/` com páginas placeholder, usuário logado **simulado** (`src/hooks/useCurrentUser.ts`, valor fixo).
  *Verificado:* typecheck, lint, format:check, build e 5 testes verdes — resolução por URL, navegação pela sidebar, `aria-current` só no item ativo, rota desconhecida → Dashboard, rodapé com o usuário. Sem autenticação real (RNF03).
  *Referência:* `prototype/**/src/components/Sidebar.tsx` e o rodapé "Rodrigo Almeida · Gerente" nos prints.
  *Fora do plano, a pedido:* `.gitattributes` corrigindo falha pré-existente de `format:check` (ver [L-003](LESSONS.md)).

- [x] **F0-3 — Cliente HTTP base**
  `src/services/http.ts` com `baseURL` vindo de `VITE_API_URL`, tratamento de erro padronizado, `.env.example` versionado.
  *Verificado:* toda falha sai como `HttpError` com `kind` (`config`/`network`/`timeout`/`client`/`server`/`parse`) e `message` em pt-BR pronta para a tela; cancelamento por `signal` propaga o `AbortError` original. Consumido pela lista de projetos em F2-1.

## Fase 1 — Domínio e dados (base de todo o resto)

Objetivo: tipos, regras e indicadores testados **antes** de qualquer tela depender deles.

- [x] **F1-1 — Tipos de domínio** — `src/types/`: `Project`, `Client`, `Team`, `User`, `ProjectStatus`, `UserRole` com os literais exatos do spec.
  *Verificado:* tudo em camelCase (ADR-0002), com `projectStatuses`/`projectStatusLabels` e `userRoles`/`userRoleLabels` como fonte única de ordem e rótulo. `UserRole` foi expandido no arquivo que já existia, não duplicado.

- [x] **F1-2 — Indicadores e regras (crítico)** — `src/domain/indicators.ts` e `src/domain/projectRules.ts` + testes.
  Funções: `budgetConsumptionPercent`, `isLate`, `isOverBudget`, `needsAttention`, `summarizeProjects`, `projectsNeedingAttention`, `aggregateByClient`; validação RN01–RN06 em `projectRules.ts`.
  *Verificado:* `budget = 0` devolve `null` (A-001); `deadline` comparado como data de calendário local, prazo igual a hoje não atrasa (A-002); estouro de orçamento é aviso, não erro (A-003). `parseCalendarDate`/`formatCalendarDate` centralizam a conversão de data.

- [x] **F1-3 — Serviços REST** — `src/services/{projects,clients,teams,users}.ts` + mapeamento do contrato (ver [ADR-0002](decisions/ADR-0002-contrato-de-dados-e-mapeamento.md)).
  *Verificado:* um `Dto` em `snake_case` e um par de mapeadores por recurso; `NUMERIC` como string é normalizado para número; nenhuma página conhece o formato do JSON.

- [x] **F1-4 — Dados mock** — camada de mock + seed fictício (15 projetos cobrindo os 5 status, um atrasado, um com orçamento excedido, um com `budget = 0`).
  *Verificado:* o front roda sem backend (ADR-0001); `VITE_MOCK_SCENARIO` (`padrao`/`vazio`/`erro`) exercita os estados de tela, e a falha sai como `HttpError`, igual à API real. Prazos do seed são relativos a hoje, então o projeto atrasado continua atrasado sem manutenção.

## Fase 2 — Projetos (RF03, RF04, RF05, RF06)

- [x] **F2-1 — Lista de projetos (RF04)** — tabela com filtros por status e cliente, destaque visual para atrasado/em risco, estados de carregando/vazio/erro.
  *Entregue:* `src/pages/ProjectsPage.tsx` (layout portado de `Projects.tsx` do protótipo), `src/hooks/useProjectsList.ts` (projetos + clientes + usuários em uma carga só), `src/domain/projectFilters.ts` (recorte puro, busca insensível a acento por projeto/cliente/gestor), `src/components/projects/StatusBadge.tsx` e `src/lib/format.ts` (moeda, data e percentual pt-BR — camada nova, registrada em [ADR-0005](decisions/ADR-0005-camada-lib-de-formatacao.md)).
  *Verificado:* 23 testes novos — atraso e estouro destacados, prazo igual a hoje **não** marcado como atrasado, `budget = 0` exibido como "—", filtros combinados, recorte vazio distinguido de lista vazia, erro da API com "Tentar novamente". Todo indicador vem de `domain/indicators.ts`; a página não calcula nada.
  *Fora desta fatia, de propósito:* botão "Novo projeto" (F2-3) e link para os detalhes (F2-2) — a linha ainda não é clicável.
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
