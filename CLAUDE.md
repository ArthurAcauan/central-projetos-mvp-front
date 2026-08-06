# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Comunicação: responda sempre em **português (pt-BR)**. Código, nomes de arquivos e identificadores em inglês; textos de interface, mensagens de validação e documentação em português.

## Estado do repositório

Este é o **frontend** de um MVP acadêmico de dois repositórios (Projeto Final II — "Plataforma de Centralização e Análise de Informações para Gestão de Projetos"). Concluídas as fases 0 (fundação) e 1 (domínio, serviços e mock): o front roda sem backend. Em andamento a fase 2 (telas de projeto) — estado corrente sempre em [docs/BACKLOG.md](docs/BACKLOG.md).

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

Indicadores derivados **nunca são persistidos** — são calculados a partir dos campos do projeto. O cálculo vive **só** em `src/domain/indicators.ts`, para que dashboard, lista e detalhes nunca discordem. Duplicar cálculo é motivo de rejeição no Definition of Done.

## Modelo de domínio

Quatro entidades: `users`, `clients`, `teams`, `projects`. `projects` é central e concentra as três FKs (`client_id → clients.id`, `manager_id → users.id`, `team_id → teams.id`), todas N:1. IDs são UUID.

Campos de `projects` usados na UI: `name`, `client_id`, `objective`, `manager_id`, `team_id`, `start_date`, `deadline`, `budget`, `budget_spent`, `hours_worked`, `status`, `observations` (mais `id`, `created_at`, `updated_at`).

Enumerações são strings simples — use exatamente estes literais:

- `status`: `PLANEJAMENTO`, `EM_ANDAMENTO`, `EM_RISCO`, `CONCLUIDO`, `CANCELADO`
- `role` (users): `GERENTE`, `COORDENADOR`, `GESTOR_PROJETO`

**Casing do contrato** ([ADR-0002](docs/decisions/ADR-0002-contrato-de-dados-e-mapeamento.md)): a documentação é ambígua (`budget_spent` na modelagem, `budgetSpent` nos requisitos) e o formato real da API ainda não foi confirmado. Decisão vigente: o tipo de domínio no front é **camelCase**, e a tradução acontece em **um único mapeador por recurso** dentro de `services/`. Nenhum `snake_case` fora de `services/`.

## Regras de negócio que afetam validação

- `budget >= 0`, `budget_spent >= 0`, `hours_worked >= 0` (RN01, RN02, RN04)
- `deadline >= start_date` (RN05)
- `budget_spent` **pode exceder** `budget` — não bloqueie (RN03). Estouro é sinal a ser evidenciado no dashboard, exibido como aviso, nunca como erro que impede salvar.
- Projeto exige cliente, gestor, equipe, objetivo, **data de início**, prazo, orçamento e status (RN06)
- Cadastro inclui data de início e orçamento consumido (RF03)

## Indicadores derivados

- Consumo do orçamento = `budget_spent / budget * 100` — **`budget = 0` deve retornar `null`**, não `Infinity`/`NaN` (RN07, armadilha A-001)
- Projeto atrasado = hoje > `deadline` **e** status não em (`CONCLUIDO`, `CANCELADO`) — comparar **datas de calendário no fuso local**, não UTC; prazo igual a hoje **não** está atrasado (RN08, armadilha A-002)
- Orçamento excedido = `budget_spent > budget`
- Em situação de atenção = status `EM_RISCO` **ou** atrasado **ou** orçamento excedido, cada projeto contado uma única vez (RN09)

Agregados do dashboard: total de projetos, por status, por cliente, orçamento total vs consumido, horas realizadas, em risco e atrasados.

## Telas no escopo

Dashboard (indicadores + gráficos) · lista de projetos (consulta + filtros) · cadastro/edição de projeto · detalhes do projeto · cadastros auxiliares de clientes, equipes e usuários.

## Fora de escopo — não construir sem pedido explícito

Autenticação/autorização real (o usuário logado é **simulado**), controle de acesso efetivo por perfil, NPS, timesheet individual, gestão individual de membros de equipe, integrações corporativas reais, importação automática de dados, IA como funcionalidade do produto, microsserviços, infraestrutura cloud.

`users.role` é **campo cadastral**: cadastrar e exibir é correto; usar para bloquear funcionalidade é escopo proibido.

Os dados do MVP são fictícios e inseridos manualmente.

## Postura esperada

O spec pede simplicidade acima de completude: prefira a solução direta, evite overengineering, não adicione campos ou entidades sem necessidade funcional comprovada, e explique o impacto antes de mudar qualquer coisa estrutural.
