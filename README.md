# GestProject — Frontend

> Plataforma de Centralização e Análise de Informações para Gestão de Projetos.
> Parte prática do **Projeto Final II (PF2)** — MVP web para consultorias de tecnologia.

Este repositório contém o **frontend** da plataforma. O backend (Node.js + Express + Prisma + PostgreSQL) fica em repositório separado.

![Dashboard gerencial](prototype/Plataforma%20de%20Gest%C3%A3o%20de%20Projetos/Dashboard%20gerencial.png)

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Status atual](#status-atual)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Comandos disponíveis](#comandos-disponíveis)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Arquitetura em camadas](#arquitetura-em-camadas)
- [Modelo de domínio](#modelo-de-domínio)
- [Regras de negócio](#regras-de-negócio)
- [Indicadores derivados](#indicadores-derivados)
- [Requisitos funcionais](#requisitos-funcionais)
- [Escopo do MVP](#escopo-do-mvp)
- [Protótipo](#protótipo)
- [Documentação do projeto](#documentação-do-projeto)
- [Fluxo de desenvolvimento](#fluxo-de-desenvolvimento)
- [Integração com o backend](#integração-com-o-backend)

---

## Sobre o projeto

**Problema.** Em consultorias de tecnologia, as informações de um mesmo projeto ficam espalhadas por planilhas, e-mails e ferramentas distintas. Isso dificulta a visão consolidada, o acompanhamento de desempenho, a identificação de riscos e a tomada de decisão.

**Questão de pesquisa.** Como a centralização e a análise de informações de projetos em uma plataforma única podem contribuir para melhorar a gestão de projetos em empresas de consultoria de tecnologia?

**Objetivo.** Desenvolver uma plataforma que centralize informações de projetos — orçamento, prazos, horas, equipe e status — e as apresente como indicadores gerenciais, apoiando o acompanhamento e a decisão.

**Usuários previstos.** Gerente, Coordenador e Gestor de Projeto.

## Status atual

O projeto está na **Fase 0 → Fase 1**. O scaffold está pronto e verificado; as telas começam a ser implementadas em seguida.

| Fase | Escopo | Status |
|---|---|---|
| **Fase 0** — Fundação | Scaffold, casca da aplicação, cliente HTTP | scaffold concluído |
| **Fase 1** — Domínio e dados | Tipos, indicadores testados, serviços, dados mock | pendente |
| **Fase 2** — Projetos | Lista, detalhes, cadastro e edição (RF03–RF06) | pendente |
| **Fase 3** — Cadastros auxiliares | Clientes, equipes, usuários (RF01, RF02) | pendente |
| **Fase 4** — Dashboard | Indicadores, gráficos, painel de atenção (RF07–RF09) | pendente |
| **Fase 5** — Integração e fechamento | API real, usabilidade, dados de demonstração | pendente |

O detalhamento de cada fatia, com critério de "pronto quando", está em [docs/BACKLOG.md](docs/BACKLOG.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Biblioteca de UI | React 19 |
| Linguagem | TypeScript 5.9 |
| Build e dev server | Vite 8 |
| Estilo | Tailwind CSS v4 (sem biblioteca de componentes) |
| Gráficos | Recharts 3 |
| Navegação | React Router 7 |
| Testes | Vitest 4 + Testing Library + jsdom |
| Qualidade | ESLint 10, Prettier 3 |

A escolha de Tailwind em lugar de MUI — que era a definição original da arquitetura — está justificada em [ADR-0003](docs/decisions/ADR-0003-ui-tailwind-em-vez-de-mui.md).

> **Nota sobre o TypeScript.** A versão está fixada em `~5.9` de propósito: o `typescript-eslint` 8 declara `peer typescript >=4.8.4 <6.1.0`, e instalar `typescript@latest` (hoje 7.x) quebra o `npm install`. Não resolva esse conflito com `--force` nem `--legacy-peer-deps`. Ver [L-001 em docs/LESSONS.md](docs/LESSONS.md).

## Como rodar

**Pré-requisitos:** Node.js 22+ e npm 10+.

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o ambiente
cp .env.example .env

# 3. Subir o servidor de desenvolvimento
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

Variáveis de ambiente (ver [.env.example](.env.example)):

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API REST do backend |
| `VITE_USE_MOCK` | `true` faz o front rodar sobre dados fictícios locais, sem backend |

Enquanto o backend não estiver disponível, mantenha `VITE_USE_MOCK=true` — ver [ADR-0001](docs/decisions/ADR-0001-mock-primeiro.md).

## Comandos disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Typecheck + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run lint` | ESLint em todo o projeto |
| `npm run lint:fix` | ESLint corrigindo o que é automático |
| `npm test` | Roda os testes uma vez |
| `npm run test:watch` | Testes em modo watch |
| `npm run format` | Formata com Prettier |
| `npm run format:check` | Verifica formatação sem alterar arquivos |

Para rodar **um** arquivo de teste ou filtrar por nome:

```bash
npm test -- src/domain/indicators.test.ts
npm test -- -t "orçamento zero"
```

O alias `@/` aponta para `src/` — por exemplo, `import { Project } from '@/types/project'`.

## Estrutura do repositório

```
.
├── src/                  # Código da aplicação
│   ├── components/       # Componentes de apresentação reutilizáveis
│   ├── domain/           # Regras e cálculos puros (indicadores)
│   ├── hooks/            # Orquestração de dados e estado de tela
│   ├── pages/            # Uma página por tela
│   ├── routes/           # Definição de rotas
│   ├── services/         # Clientes REST — única camada que fala HTTP
│   ├── types/            # Tipos de domínio
│   └── index.css         # Design tokens (cores, raio, fontes)
├── context/              # Especificação do projeto (fonte da verdade)
├── docs/                 # Processo, backlog, lições, decisões (ADRs)
├── prototype/            # Protótipo do Figma Make — referência visual
└── .claude/              # Harness de desenvolvimento assistido por IA
```

## Arquitetura em camadas

```
Usuário → pages/components → hooks → services → API REST → backend
                                ↓
                             domain/  (regras e indicadores, sem I/O)
```

Responsabilidades, e por que elas importam:

- **`services/`** é a única camada que faz HTTP e o único lugar onde aparece o formato do JSON da API. Isso mantém as telas estáveis se o contrato mudar — ver [ADR-0002](docs/decisions/ADR-0002-contrato-de-dados-e-mapeamento.md).
- **`domain/`** concentra regra e cálculo puros, sem React e sem I/O, o que os torna testáveis isoladamente.
- **`hooks/`** orquestra dados e estado; **`pages/`** compõe; **`components/`** apresenta.

Os indicadores derivados vivem **somente** em `src/domain/indicators.ts`. O motivo é prático: dashboard, lista e detalhes consomem os mesmos números, e cálculos duplicados fazem as telas discordarem entre si — divergência que costuma aparecer só na demonstração.

## Modelo de domínio

Quatro entidades. `projects` é central e concentra as três chaves estrangeiras.

```
CLIENTS (1) ──── (N) PROJECTS (N) ──── (1) TEAMS
                      │
USERS (1) ──────── (N)┘
```

| Entidade | Campos principais |
|---|---|
| `users` | `id`, `name`, `email` (único), `role`, `created_at` |
| `clients` | `id`, `name`, `created_at`, `updated_at` |
| `teams` | `id`, `name`, `created_at` |
| `projects` | `id`, `name`, `client_id`, `objective`, `manager_id`, `team_id`, `start_date`, `deadline`, `budget`, `budget_spent`, `hours_worked`, `status`, `observations`, `created_at`, `updated_at` |

Identificadores são UUID. Relacionamentos: `projects.client_id → clients.id`, `projects.manager_id → users.id`, `projects.team_id → teams.id`.

**Status do projeto** (armazenados como texto, validados na aplicação):

| Valor | Exibição |
|---|---|
| `PLANEJAMENTO` | Planejamento |
| `EM_ANDAMENTO` | Em andamento |
| `EM_RISCO` | Em risco |
| `CONCLUIDO` | Concluído |
| `CANCELADO` | Cancelado |

**Perfis de usuário:** `GERENTE`, `COORDENADOR`, `GESTOR_PROJETO`.

No MVP o perfil é **dado cadastral**: é registrado e exibido, mas não restringe acesso a funcionalidades (ver RNF03 e [Escopo do MVP](#escopo-do-mvp)).

## Regras de negócio

| ID | Regra |
|---|---|
| RN01 | O orçamento previsto deve ser maior ou igual a zero. |
| RN02 | O orçamento consumido deve ser maior ou igual a zero. |
| RN03 | O orçamento consumido **não é bloqueado** quando ultrapassa o previsto — essa situação precisa ser evidenciada pelo dashboard. |
| RN04 | As horas realizadas devem ser maiores ou iguais a zero. |
| RN05 | A data de término prevista deve ser igual ou posterior à data de início. |
| RN06 | Todo projeto deve possuir cliente, gestor, equipe, objetivo, data de início, prazo, orçamento e status. |
| RN07 | Com orçamento previsto igual a zero, o percentual de consumo é **indisponível** — nunca zero, infinito ou erro. |
| RN08 | A verificação de atraso compara **datas de calendário no fuso local**, sem hora. Um projeto cujo prazo é a data atual não está atrasado. |
| RN09 | Um projeto está em **situação de atenção** quando tem status `EM_RISCO`, **ou** está atrasado, **ou** teve o orçamento excedido. Cada projeto é contado uma única vez. |

RN07 a RN09 foram formalizadas durante o desenvolvimento, para resolver ambiguidades que produziriam comportamento divergente entre telas. A análise está em [ADR-0004](docs/decisions/ADR-0004-refinamento-das-regras-de-negocio.md).

Consequência prática da RN03: estouro de orçamento é **aviso visual**, nunca erro de formulário que impede salvar.

## Indicadores derivados

Nenhum indicador é persistido — todos são calculados pela aplicação a partir dos dados dos projetos.

| Indicador | Cálculo |
|---|---|
| Consumo do orçamento | `budget_spent / budget × 100`; indisponível se `budget = 0` (RN07) |
| Projeto atrasado | prazo anterior à data atual (RN08) **e** status diferente de `CONCLUIDO`/`CANCELADO` |
| Orçamento excedido | `budget_spent > budget` |
| Situação de atenção | `EM_RISCO` ∪ atrasado ∪ orçamento excedido, sem duplicidade (RN09) |

Agregados do dashboard: total de projetos, projetos por status, projetos por cliente, orçamento total e consumido, percentual de consumo, horas realizadas, projetos em atenção e atrasados.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | Cadastrar usuário com nome, e-mail e perfil de acesso |
| RF02 | Cadastrar cliente |
| RF03 | Cadastrar projeto com nome, cliente, objetivo, gestor, equipe, data de início, prazo, orçamento previsto, orçamento consumido, horas realizadas, status e observações |
| RF04 | Consultar a lista de projetos |
| RF05 | Consultar os detalhes de um projeto |
| RF06 | Atualizar as informações de um projeto |
| RF07 | Calcular e exibir indicadores dos projetos |
| RF08 | Exibir dashboard gerencial com indicadores e gráficos |
| RF09 | Identificar e destacar projetos em situação de risco |

Requisitos não funcionais (usabilidade, desempenho, segurança, manutenibilidade e integridade) estão em [context/01_requisitos_funcionais_e_nao_funcionais.md](context/01_requisitos_funcionais_e_nao_funcionais.md).

## Escopo do MVP

**Incluído:** cadastro de usuários, clientes e equipes; cadastro, consulta, atualização e detalhamento de projetos; dashboard gerencial com indicadores; usuário logado simulado; dados fictícios.

**Fora de escopo** — não implementado por decisão de projeto:

- Autenticação e autorização reais (o usuário logado é simulado)
- Controle de acesso efetivo por perfil
- NPS
- Timesheet individual (apenas o total de horas por projeto)
- Gestão individual de membros de equipe
- Integrações corporativas e importação automática de dados
- IA como funcionalidade do produto
- Microsserviços e infraestrutura cloud
- Ferramenta externa de BI — o dashboard é construído no próprio frontend

Para incluir qualquer um desses itens, o caminho é registrar um ADR em [docs/decisions/](docs/decisions/) e atualizar a especificação em `context/` antes de escrever código.

## Protótipo

O protótipo funcional, construído no Figma Make e validado visualmente, está em [prototype/](prototype/) e é a **referência visual** das telas. Não é código de produção: está fora de build, lint, typecheck e testes.

| Tela | Print |
|---|---|
| Dashboard gerencial | [Dashboard gerencial.png](prototype/Plataforma%20de%20Gest%C3%A3o%20de%20Projetos/Dashboard%20gerencial.png) |
| Projetos | [Projetos.png](prototype/Plataforma%20de%20Gest%C3%A3o%20de%20Projetos/Projetos.png) |
| Clientes | [Clientes.png](prototype/Plataforma%20de%20Gest%C3%A3o%20de%20Projetos/Clientes.png) |
| Equipes | [Equipes.png](prototype/Plataforma%20de%20Gest%C3%A3o%20de%20Projetos/Equipes.png) |
| Usuários | [Usuários.png](prototype/Plataforma%20de%20Gest%C3%A3o%20de%20Projetos/Usu%C3%A1rios.png) |

Ao portar uma tela do protótipo:

- **Portar:** layout, hierarquia visual, cores de status, formatação em pt-BR, textos.
- **Não portar:** navegação por `useState` (usamos rotas), cálculos de indicador dentro de componentes (vão para `domain/`), campos em `snake_case` no tipo de domínio, e os defeitos conhecidos de divisão por zero e comparação de data em UTC que o protótipo contém.

Os design tokens dele (Inter, DM Mono, `--primary: #2563eb`, raio de 6px) foram portados para `src/index.css`.

## Documentação do projeto

| Diretório | Conteúdo |
|---|---|
| [context/](context/) | **Especificação — fonte da verdade.** Requisitos, arquitetura, modelo de dados. Os `.docx`/`.pdf` são as fontes originais, mantidas para rastreabilidade acadêmica e imutáveis; edite os `.md`. |
| [docs/HARNESS.md](docs/HARNESS.md) | Processo de desenvolvimento: ciclo de tarefa, guardrails, Definition of Done |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Backlog fatiado, rastreado até os requisitos funcionais |
| [docs/LESSONS.md](docs/LESSONS.md) | Lições aprendidas e armadilhas conhecidas do domínio e da stack |
| [docs/decisions/](docs/decisions/) | Registro de decisões de arquitetura (ADRs) |

Decisões registradas até aqui:

| ADR | Decisão |
|---|---|
| [0001](docs/decisions/ADR-0001-mock-primeiro.md) | Front desenvolvido sobre dados mock antes da API real |
| [0002](docs/decisions/ADR-0002-contrato-de-dados-e-mapeamento.md) | Contrato de dados isolado em `services/` com mapeamento explícito |
| [0003](docs/decisions/ADR-0003-ui-tailwind-em-vez-de-mui.md) | Tailwind CSS v4 como camada de UI, em vez de MUI |
| [0004](docs/decisions/ADR-0004-refinamento-das-regras-de-negocio.md) | Refinamento das regras de negócio (RF03, RNF03, RN06, RN07–RN09) |

## Fluxo de desenvolvimento

O projeto é construído com apoio de IA, sob um harness que mantém escopo e qualidade sob controle. Uma tarefa = um item do backlog = um branch = uma entrega verificável.

```
/tarefa F1-2 → implementar → /fechar-tarefa F1-2 → commit
```

**Definition of Done:** typecheck, lint e testes verdes; nenhum campo ou entidade novo sem necessidade comprovada; nada da lista de fora de escopo introduzido; nenhum cálculo de indicador duplicado; backlog atualizado.

Guardrails automáticos (em [.claude/hooks/](.claude/hooks/)):

| Guardrail | Comportamento |
|---|---|
| Fontes protegidas | Bloqueia edição dos `.docx`/`.pdf` em `context/` |
| Escopo e stack | Bloqueia instalação de pacotes fora do MVP (auth real, BI); pede confirmação para pacotes fora da stack aprovada |
| Verificação pós-edição | Roda typecheck e lint após editar arquivos em `src/` |

Detalhes em [docs/HARNESS.md](docs/HARNESS.md).

## Integração com o backend

O backend é um repositório separado, com a organização `Routes → Controllers → Services → Prisma`, sobre PostgreSQL. A comunicação é REST/JSON.

```
Frontend React → API REST → Express → Prisma → PostgreSQL
```

Pontos abertos a confirmar com o backend antes da integração (Fase 5):

- **Casing do JSON.** A modelagem usa `snake_case` (`budget_spent`); um trecho dos requisitos usa `budgetSpent`. O front trata isso com um mapeador único por recurso em `services/`, então a definição afeta apenas essa camada — ver [ADR-0002](docs/decisions/ADR-0002-contrato-de-dados-e-mapeamento.md).
- **Formato das datas.** `YYYY-MM-DD` ou ISO completo — impacta a aplicação da RN08.
- **Indicadores.** Se o backend também calcular indicadores, precisa seguir RN07 e RN08 para não divergir do front.

---

Projeto acadêmico desenvolvido como parte do Projeto Final II.
