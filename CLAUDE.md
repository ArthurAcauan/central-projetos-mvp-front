# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Comunicação: responda sempre em **português (pt-BR)**. Código, nomes de arquivos e identificadores em inglês; textos de interface, mensagens de validação e documentação em português.

## Estado do repositório

Este é o **frontend** de um MVP acadêmico de dois repositórios (Projeto Final II — "Plataforma de Centralização e Análise de Informações para Gestão de Projetos"). Concluídas as fases 0 a 4 e a **integração com a API real** (F5-1): RF01–RF09 cobertos, rodando contra o backend em `http://localhost:3333`. Faltam F5-2 (usabilidade e code-splitting) e F5-3 (fechamento acadêmico) — estado corrente sempre em [docs/BACKLOG.md](docs/BACKLOG.md).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm test` | Vitest, uma passada |
| `npm run test:watch` | Vitest em watch |
| `npm test -- src/domain/indicators.test.ts` | Roda **um** arquivo de teste |
| `npm test -- -t "orçamento zero"` | Roda os testes cujo nome casa com o texto |
| `npm run build` | Typecheck + build de produção |
| `npm run format` / `format:check` | Prettier |

O alias `@/` aponta para `src/`.

`prototype/` está fora de build, lint, typecheck e testes — é referência visual, não código do projeto. Não edite nada lá.

## Processo de trabalho (leia antes de codar)

| Documento | Para que serve |
|---|---|
| [docs/HARNESS.md](docs/HARNESS.md) | Como o trabalho flui: ciclo de tarefa, guardrails, Definition of Done |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Fatias de trabalho (`F0-1`, `F1-2`, …) rastreadas até os RFs |
| [docs/LESSONS.md](docs/LESSONS.md) | Armadilhas conhecidas — **consulte antes de mexer em indicadores, datas ou serviços** |
| [docs/decisions/](docs/decisions/) | ADRs; decisões estruturais já tomadas |

Rituais disponíveis: `/tarefa <id>` para começar, `/checar-escopo` durante, `/fechar-tarefa <id>` para fechar, `/licao` para registrar aprendizado. Subagentes: `revisor-escopo` e `revisor-front`.

Guardrails automáticos ativos (em `.claude/hooks/`): edição dos binários em `context/` é negada; instalação de pacotes fora do MVP é negada e fora da stack aprovada pede confirmação; após editar `src/**/*.ts(x)` roda typecheck e lint.

## Fonte da verdade: `context/`

Requisitos, arquitetura e modelo de dados estão em [context/](context/). Esses documentos são **prescritivos**, não leitura de apoio: escopo, entidades, nomes de campos e valores de status vêm deles, não de inferência. Ordem recomendada:

1. [00_harness_frontend.md](context/00_harness_frontend.md) — regras de implementação e limites de escopo (o mais operacional)
2. [01_requisitos_funcionais_e_nao_funcionais.md](context/01_requisitos_funcionais_e_nao_funcionais.md) — RF01–RF09, RNF01–RNF05, regras RN01–RN06
3. [02_arquitetura_final_projeto.md](context/02_arquitetura_final_projeto.md) — arquitetura, stack, gráficos previstos
4. [03_contexto_completo_projeto.md](context/03_contexto_completo_projeto.md) — contexto completo
5. [04_modelagem_dados_e_banco.md](context/04_modelagem_dados_e_banco.md) — modelo de dados e DER textual
6. [CONTRATO_API.md](context/CONTRATO_API.md) — **contrato real da API**, extraído do backend pronto. Endpoints, formatos, erros e armadilhas. É a fonte da verdade do que a API devolve; onde ele contradisser os outros documentos, ele vence.

Os `.docx`/`.pdf` ao lado são as fontes originais para rastreabilidade acadêmica — **imutáveis** (há hook bloqueando). Edite o `.md` equivalente. Decisão estrutural precisa voltar para estes documentos.

## Stack

- React 19 + TypeScript + Vite
- **Tailwind CSS v4**, sem biblioteca de componentes ([ADR-0003](docs/decisions/ADR-0003-ui-tailwind-em-vez-de-mui.md) — substituiu MUI para seguir o protótipo validado)
- Recharts para os gráficos do dashboard
- React Router para navegação
- REST/JSON contra backend em repositório separado (Node.js + Express + TypeScript + Prisma + PostgreSQL)

Fluxo: `frontend React → API REST → Express → Prisma → PostgreSQL`. O dashboard é construído **dentro deste frontend** — sem ferramenta externa de BI.

Design tokens (cores, raio, fontes Inter/DM Mono) vivem em `src/index.css` e vêm do protótipo. Ajuste de estilo global vai lá, não em classes soltas nas telas.

Dependência nova exige ADR. O hook `scope-guard.mjs` pede confirmação para pacotes fora da stack aprovada.

## Referência visual

O protótipo funcional está em [prototype/](prototype/) (Figma Make): código das telas em `prototype/**/src/` e prints (`Dashboard gerencial.png`, `Projetos.png`, `Clientes.png`, `Equipes.png`, `Usuários.png`). As telas implementadas devem corresponder a ele.

O que **portar** dele: layout, hierarquia visual, cores de status, formatação pt-BR, textos.
O que **não** portar: navegação por `useState` (usamos React Router), cálculos de indicador dentro de componentes (vão para `domain/`), campos em `snake_case` no tipo de domínio (ver ADR-0002), e os bugs de divisão por zero e comparação de data em UTC — que o protótipo contém.

## Convenções de arquitetura

Responsabilidade por camada — nenhuma página chama HTTP diretamente:

- `services/` — clientes REST por recurso; **única** camada que fala HTTP e o **único** lugar onde aparece o formato do JSON da API
- `domain/` — regra e cálculo puros, sem React e sem I/O; abriga `indicators.ts`
- `hooks/` — orquestração de dados e estado de tela
- `pages/` — uma por tela
- `components/` — apresentação reutilizável
- `types/` — tipos de domínio
- `routes/` — definição de rotas
- `lib/` — utilitários de apresentação sem regra de negócio; hoje só `format.ts` (moeda, data e percentual pt-BR). Formatar não é decidir: `domain/` decide, `lib/` só formata o que já foi decidido ([ADR-0005](docs/decisions/ADR-0005-camada-lib-de-formatacao.md))

Indicadores derivados **nunca são persistidos**. Desde a integração ([ADR-0007](docs/decisions/ADR-0007-indicadores-vem-do-backend.md)) quem os calcula é o **backend**, e o front lê `project.indicators` — recalcular na tela é motivo de rejeição no Definition of Done. O que a API não manda continua vivendo **só** em `src/domain/indicators.ts`, pelo mesmo motivo de antes: para dashboard, lista e detalhes nunca discordarem.

## Modelo de domínio

Quatro entidades: `users`, `clients`, `teams`, `projects`. `projects` é central e concentra as três FKs (`client_id → clients.id`, `manager_id → users.id`, `team_id → teams.id`), todas N:1. IDs são UUID.

Campos de `projects` usados na UI: `name`, `client_id`, `objective`, `manager_id`, `team_id`, `start_date`, `deadline`, `budget`, `budget_spent`, `hours_worked`, `status`, `observations` (mais `id`, `created_at`, `updated_at`).

Enumerações são strings simples — use exatamente estes literais:

- `status`: `PLANEJAMENTO`, `EM_ANDAMENTO`, `EM_RISCO`, `CONCLUIDO`, `CANCELADO`
- `role` (users): `GERENTE`, `COORDENADOR`, `GESTOR_PROJETO`

**Casing do contrato** ([ADR-0002](docs/decisions/ADR-0002-contrato-de-dados-e-mapeamento.md)): a API usa `snake_case`, confirmado em `context/CONTRATO_API.md`. O tipo de domínio no front é **camelCase**, e a tradução acontece em **um único mapeador por recurso** dentro de `services/`. Nenhum `snake_case` fora de `services/`.

**Forma do projeto na API**: as relações chegam **resolvidas** (`client: {id, name}`, `manager`, `team`), não como FK solta, e vêm em duas formas — `ProjectSummary` na lista, `Project` no detalhe. O payload de escrita volta a usar id solto: **o objeto do `GET` não é aceito pelo `PUT`**, chave a mais responde 400.

## Regras de negócio que afetam validação

- `budget >= 0`, `budget_spent >= 0`, `hours_worked >= 0` (RN01, RN02, RN04)
- `deadline >= start_date` (RN05)
- `budget_spent` **pode exceder** `budget` — não bloqueie (RN03). Estouro é sinal a ser evidenciado no dashboard, exibido como aviso, nunca como erro que impede salvar.
- Projeto exige cliente, gestor, equipe, objetivo, **data de início**, prazo, orçamento e status (RN06)
- Cadastro inclui data de início e orçamento consumido (RF03)
- `users.email` é único (modelagem). `clients.name` e `teams.name` também — o nome é o que distingue esses cadastros no gráfico do RF08 e no seletor de projeto ([ADR-0006](docs/decisions/ADR-0006-unicidade-de-nome-nos-cadastros.md)). A comparação no front ignora caixa e acento e é conveniência, não garantia: a restrição real é do banco.

## Indicadores derivados

**Quem calcula o quê** ([ADR-0007](docs/decisions/ADR-0007-indicadores-vem-do-backend.md)):

O **backend** calcula e devolve em `project.indicators` de toda resposta de projeto — o front apresenta e **nunca recalcula**, porque duas implementações divergiriam e a tela mostraria número diferente do que a API afirma:

- `consumptionPercent` — **`null` quando `budget = 0`**, não `Infinity`/`NaN` (RN07, armadilha A-001)
- `isLate` — prazo vencido com o projeto ativo; prazo igual a hoje **não** atrasa (RN08, armadilha A-002)
- `isOverBudget` — `budgetSpent > budget`
- `hasHighConsumption` — consumo ≥ 90%, aviso antes do estouro
- `needsAttention` + `attentionReasons` — atrasado **ou** estourado **ou** consumo elevado, excluindo encerrados, cada projeto uma vez (RN09 revisado)

O status `EM_RISCO` é julgamento manual do gestor e **não** entra em `needsAttention`: é indicador próprio. **Nunca some os dois** — um projeto pode estar nos dois, e a soma passaria do total da carteira.

`src/domain/indicators.ts` cobre o que a API **não** manda, e continua sendo fonte única disso: `budgetRemaining`, `daysUntilDeadline`, `scheduleProgressPercent`, `budgetOverrunPercent` e os agregados `summarizeProjects`, `aggregateByClient`, `topProjectsByHours`.

O dashboard sai todo de `GET /projects`. `GET /dashboard` e `GET /projects/attention` existem mas não são usados: não trazem orçamento por cliente nem horas por projeto, que dois gráficos do RF08 precisam, e misturar fontes colocaria dois números discordantes na mesma tela.

`status` chega da API como `string`, não como união fechada — ela devolve valor fora dos cinco canônicos de propósito, para denunciar dado corrompido. Mapas de cor e rótulo precisam de valor padrão.

## Telas no escopo

Dashboard (indicadores + gráficos) · lista de projetos (consulta + filtros) · cadastro/edição de projeto · detalhes do projeto · cadastros auxiliares de clientes, equipes e usuários.

## Fora de escopo — não construir sem pedido explícito

Autenticação/autorização real (o usuário logado é **simulado**), controle de acesso efetivo por perfil, NPS, timesheet individual, gestão individual de membros de equipe, integrações corporativas reais, importação automática de dados, IA como funcionalidade do produto, microsserviços, infraestrutura cloud.

`users.role` é **campo cadastral**: cadastrar e exibir é correto; usar para bloquear funcionalidade é escopo proibido.

Os dados do MVP são fictícios e inseridos manualmente.

## Postura esperada

O spec pede simplicidade acima de completude: prefira a solução direta, evite overengineering, não adicione campos ou entidades sem necessidade funcional comprovada, e explique o impacto antes de mudar qualquer coisa estrutural.
