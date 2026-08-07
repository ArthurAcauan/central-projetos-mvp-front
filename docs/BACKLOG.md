# Backlog do Frontend

Fatias pequenas, cada uma rastreada até um requisito funcional. Uma fatia = um branch = uma entrega verificável.

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluído

Atualizado em: 2026-08-07

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
- [x] **F2-2 — Detalhes do projeto (RF05)** — todos os campos + indicadores específicos do projeto.
  *Entregue:* `src/pages/ProjectDetailPage.tsx` (layout portado de `ProjectDetail.tsx` do protótipo, com o painel de alertas que também atende ao RF09), `src/hooks/useProject.ts`, rota `/projects/:id` e o link a partir da lista — no nome do projeto, não na linha inteira, que não recebe foco nem teclado.
  *Indicadores novos em `domain/indicators.ts`:* `budgetRemaining`, `budgetOverrunPercent`, `daysUntilDeadline`, `scheduleProgressPercent`. O protótipo calcula os três últimos dentro do componente e traz três defeitos junto — data lida em UTC, divisão pelo orçamento zero e divisão por período zero quando início e prazo são o mesmo dia. Aqui cada um tem guarda e teste.
  *Verificado:* 31 testes novos, incluindo prazo igual a hoje, projeto encerrado após o prazo (não é atraso), `budget = 0` sem `NaN`, e período indisponível quando início = prazo.
  *Fora desta fatia, de propósito:* botão "Editar projeto" (F2-4).
- [x] **F2-3 — Cadastro de projeto (RF03)** — formulário com validação das regras RN01–RN06. `budget_spent > budget` passa com aviso, não com erro.
  *Entregue:* `src/components/projects/ProjectForm.tsx` (apresentação controlada, layout portado de `ProjectForm.tsx` do protótipo), `src/hooks/useProjectFormData.ts`, `src/hooks/useProjectFormState.ts`, rota `/projects/new` e o botão "Novo projeto" na lista. `toProjectInput` entrou em `domain/projectRules.ts` — devolve `null` exatamente quando `validateProject` acusa erro, então a página não precisa de `!` nem de `as`.
  *Verificado:* estouro de orçamento avisa e **salva** (RN03/A-003), prazo igual ao início aceito e anterior recusado (RN05), horas negativas recusadas (RN04), `budget = 0` aceito (RN01), observação em branco vira `null`, falha da API preserva o preenchimento, e `/projects/new` resolve como cadastro e não como detalhe de id `"new"`.

- [x] **F2-4 — Atualização de projeto (RF06)** — reaproveitar o formulário de F2-3.
  *Entregue:* `src/pages/ProjectFormPage.tsx` atende cadastro **e** edição — o modo vem da presença do `:id` na rota (`/projects/:id/edit`). Duas páginas separadas seriam duas cópias das mesmas regras de exibição. Link "Editar projeto" nos detalhes.
  *Verificado:* 21 testes; o formulário nasce preenchido com o projeto carregado (estado inicial do `useState`, sem `setState` em efeito — L-004), envia só o payload sem id nem timestamps, aplica as mesmas RN01–RN06 do cadastro e limpa a observação apagada para `null`.

## Fase 3 — Cadastros auxiliares (RF01, RF02)

Base comum das três telas: `src/components/registry/RegistryLayout.tsx` (casca: título com contagem, botão, confirmação, estados de carga), `src/components/registry/NameFieldForm.tsx` (cadastro de campo único), `src/hooks/useRegistry.ts` (carga genérica do recurso + projetos, com `addItem` para não recarregar tudo após cadastrar) e `src/domain/registryRules.ts`.

- [x] **F3-1 — Clientes (RF02)** — lista + cadastro.
  *Verificado:* contagem de projetos por cliente derivada dos projetos carregados (nada persistido), data em pt-BR via `formatTimestamp` (novo em `lib/format.ts` — instante ISO, não data de calendário), nome repetido recusado ignorando caixa e acento, lista vazia distinguida de falha de carga.

- [x] **F3-2 — Equipes** — lista + cadastro.
  *Verificado:* cards com total/ativos/concluídos por equipe. Projeto `CANCELADO` não entra em ativos nem em concluídos — a soma das colunas pode ser menor que o total, de propósito. Gestão individual de membros continua fora de escopo.

- [x] **F3-3 — Usuários (RF01)** — lista + cadastro com `role` (GERENTE, COORDENADOR, GESTOR_PROJETO). Perfil é dado cadastral, **não** controle de acesso.
  *Verificado:* e-mail obrigatório, validado no formato e único (`users.email` é `UNIQUE` na modelagem); os três perfis são aceitos igualmente e nenhum libera ou bloqueia nada (A-007). Coluna "Projetos" conta onde a pessoa é gestora responsável.
  *Decisão estrutural:* nome de cliente e de equipe também são recusados quando repetidos, o que não estava na modelagem. Formalizado em [ADR-0006](decisions/ADR-0006-unicidade-de-nome-nos-cadastros.md), com `UNIQUE` acrescentado a `clients.name` e `teams.name` em `context/04_modelagem_dados_e_banco.md` — **pendência para o backend**, já que a verificação do front é conveniência, não garantia.

## Fase 4 — Dashboard (RF07, RF08, RF09)

Entregues juntas em `src/pages/DashboardPage.tsx` + `src/hooks/useDashboard.ts`. Nenhum número nasce na página: `summarizeProjects`, `aggregateByClient`, `projectsNeedingAttention` e `topProjectsByHours` vivem em `domain/indicators.ts`.

- [x] **F4-1 — Cards de indicadores (RF07)** — total de projetos, orçamento total, orçamento consumido e %, horas realizadas, em risco, atrasados.
  *Verificado:* carteira sem orçamento previsto exibe "—", nunca "0%" nem "∞%" (RN07/A-001); atrasados e orçamento excedido aparecem detalhados, e o card de atenção conta cada projeto uma vez só (RN09).

- [x] **F4-2 — Gráficos (RF08)** — Recharts: projetos por status (rosca/barras), orçamento previsto vs consumido (barras), projetos por cliente (barras), horas por projeto (barras).
  *Verificado:* cada série vazia vira uma frase no lugar do gráfico (A-006); status sem projeto não vira fatia; projeto sem apontamento não vira barra de altura zero. Cores de status idênticas às do `StatusBadge`. Os SVG vão como `aria-hidden` e os mesmos números estão em texto (cards, lista `sr-only` de status, tabela do RF09).

- [x] **F4-3 — Painel de atenção (RF09)** — tabela dos projetos em risco/atrasados/com orçamento excedido, com link para os detalhes.
  *Verificado:* prazo igual a hoje **não** entra (A-002) e projeto encerrado após o prazo também não (RN08); o motivo aparece em texto ("Em risco · Orç. excedido"), não só em cor.

## Fase 5 — Integração e fechamento

- [x] **F5-1 — Integração com a API real** — trocar mock por backend; validar casing do contrato na prática.
  *O contrato real ([context/CONTRATO_API.md](../context/CONTRATO_API.md)) divergiu do que o ADR-0002 assumiu, em responsabilidade e não em casing:* relações chegam resolvidas (`client: {id,name}`), indicadores vêm calculados pela API, o projeto tem duas formas (lista e detalhe), `status` chega como `string`, o erro é `{ erro, detalhes }` e a porta é 3333.
  *Decidido em [ADR-0007](decisions/ADR-0007-indicadores-vem-do-backend.md):* o backend passa a ser a fonte dos indicadores — `domain/indicators.ts` fica com o que a API não manda; **RN09 redefinido** (ganha consumo ≥ 90%, perde o `EM_RISCO` declarado, que vira indicador próprio); o dashboard sai todo de `GET /projects`, porque `GET /dashboard` não traz orçamento por cliente nem horas por projeto.
  *Decidido em [ADR-0008](decisions/ADR-0008-mock-vira-fixture-de-resposta-real.md):* o mock passa a servir respostas capturadas da API e a devolver DTO, atravessando os mesmos mapeadores da resposta real — não pode divergir do contrato sem quebrar o build. `VITE_USE_MOCK` agora é `false` por padrão.
  *Verificado com a API no ar:* os **nove agregados** que o front deriva de `GET /projects` batem número a número com `GET /dashboard`, incluindo a contagem dos cinco status. No caminho de escrita, o payload que o front monta é aceito no `PUT` (200) enquanto o objeto cru do `GET` é recusado (400), estouro de orçamento passa (201, RN03), prazo invertido é recusado (400, RN05), reabrir projeto `CONCLUIDO` é recusado (400) e nome de cliente repetido com caixa diferente responde 409 — confirmando o [ADR-0006](decisions/ADR-0006-unicidade-de-nome-nos-cadastros.md) do lado do banco.
  *Novo no front:* limites de tamanho e casas decimais em `projectRules.ts`, transição de status bloqueada em projeto encerrado, retry automático em `503` **só para `GET`** (cold start do Neon), e `src/test/factories.ts` para os testes declararem o indicador que exercitam.
- [x] **F5-2 — Usabilidade e robustez (RNF01, RNF02)** — revisão de estados vazios/erro, responsividade, formatação de moeda/data pt-BR, acessibilidade básica.
  - [x] **Code-splitting** — `React.lazy` nas duas rotas que usam Recharts (dashboard e detalhes) e `<Suspense>` em volta do `<Outlet>` do `AppShell`, para a sidebar não piscar. O pacote inicial caiu de **715 kB (208 kB gzip) para 296 kB (90 kB gzip)** e o aviso do Vite sumiu. As demais telas continuam no pacote inicial de propósito: dividir todas trocaria um download grande por um piscar de "carregando" a cada navegação.
    *Efeito nos testes:* as asserções do dashboard em `App.test.tsx` viraram `findBy` e precisaram de teto maior — o primeiro `import()` do Recharts sob o Vitest passa dos 5 s de timeout do teste quando a suíte roda em paralelo. É limite do ferramental; no navegador o pedaço já vem compilado.
  - [x] **Responsividade em telas estreitas** — a sidebar vira gaveta abaixo de `lg`, aberta por uma barra superior (`AppShell`), fechada por Esc, pelo fundo, pelo botão de fechar e ao navegar. Fechada, sai do fluxo com `hidden`, e não deslocada para fora da tela: item invisível mas focável faz o Tab passar por uma navegação que não está lá (ver [L-009](LESSONS.md)). As quatro tabelas passaram a rolar horizontalmente dentro de `components/TableScroll.tsx`, que carrega junto o que é fácil esquecer copiando o `div`: `tabIndex`, papel e nome. Cards do dashboard empilham em uma coluna, o padding cai para `p-4` e o cadastro de nome único empilha campo e botão.
  - [x] **Acessibilidade** — link "Pular para o conteúdo" como primeiro item focável, `<main id="conteudo" tabIndex={-1}>`, anel de foco único declarado em `index.css` (branco sobre a sidebar escura, onde o azul do tema fica em 3,4:1), e `useDocumentTitle` trocando o `<title>` a cada tela — sem isso a navegação da SPA não é anunciada.
    *Contraste:* `slate-400` reprova em texto pequeno sobre branco (2,6:1). Trocado por `slate-500` em todo o conteúdo claro, inclusive nos eixos do Recharts; na sidebar é o inverso — `slate-500` reprova sobre `slate-900` e `slate-400` é o piso. Os `KpiCard` perderam o `opacity` do protótipo: a 60% o detalhe de 11px cai para ~4:1.
  - [x] **Estados vazios e de erro de ponta a ponta** — conferidos contra a API real (404 de id inexistente, 400 com `detalhes` campo a campo, 409 de nome repetido: as três mensagens chegam à tela pelo caminho de `http.ts`). Estado novo: o formulário de projeto com a base sem cadastros de apoio — antes abria três seletores vazios e recusava salvar sem dizer o que faltava; agora aponta o que falta e leva até a tela que resolve.
  *Pendência de configuração, não de código:* a porta do front precisa estar em `CORS_ORIGIN` no `.env` do **backend**. Hoje ele autoriza 5173 e 3000; se a 5173 estiver ocupada, o Vite cai na 5174 e o navegador barra tudo com erro de CORS — verificado.
- [x] **F5-3 — Fechamento acadêmico** — README com instruções, dados de demonstração, roteiro para a validação com profissionais de gestão.
  *Entregue:* [README](../README.md) reescrito (estava parado na Fase 0) — status real, como rodar com e sem backend, o aviso de CORS em destaque por ser a falha mais provável da primeira execução, RN09 na redação revista pelo ADR-0007, quem calcula qual indicador, os oito ADRs e o que a integração revelou. E [docs/ROTEIRO_VALIDACAO.md](ROTEIRO_VALIDACAO.md): participantes por perfil, preparação, oito tarefas cronometradas com o que observar em cada uma, perguntas abertas, questionário Likert e as limitações a declarar no trabalho.
  *Sobre o questionário:* é instrumento de pesquisa aplicado **fora do sistema**, e está dito assim no roteiro — pesquisa de satisfação embarcada continua fora de escopo.

---

## Fora do backlog por decisão de escopo

Autenticação/autorização real · RBAC efetivo · NPS · timesheet individual · gestão individual de membros de equipe · integrações corporativas · importação automática · IA no produto · microsserviços · BI externo.

Se algum destes precisar entrar, o caminho é: ADR em [docs/decisions/](decisions/) → atualizar `context/` → atualizar `CLAUDE.md`. Nunca direto no código.
