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
- [Usabilidade e acessibilidade](#usabilidade-e-acessibilidade)
- [Dados de demonstração e validação](#dados-de-demonstração-e-validação)
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

**MVP completo.** RF01 a RF09 implementados e integrados ao backend real, com 217 testes automatizados verdes.

| Fase | Escopo | Status |
|---|---|---|
| **Fase 0** — Fundação | Scaffold, casca da aplicação, cliente HTTP | concluída |
| **Fase 1** — Domínio e dados | Tipos, indicadores testados, serviços, fixtures | concluída |
| **Fase 2** — Projetos | Lista, detalhes, cadastro e edição (RF03–RF06) | concluída |
| **Fase 3** — Cadastros auxiliares | Clientes, equipes, usuários (RF01, RF02) | concluída |
| **Fase 4** — Dashboard | Indicadores, gráficos, painel de atenção (RF07–RF09) | concluída |
| **Fase 5** — Integração e fechamento | API real, usabilidade, dados de demonstração | concluída |

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

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3333` | URL base da API REST do backend. **Porta 3333**, não 3000 |
| `VITE_USE_MOCK` | `false` | `true` serve respostas gravadas da API, sem backend no ar |
| `VITE_MOCK_SCENARIO` | `padrao` | Só com `VITE_USE_MOCK=true`: `padrao`, `vazio` ou `erro` |

### Com o backend no ar (modo normal)

Suba o backend primeiro e confirme que `GET http://localhost:3333/projects` responde.

> ⚠️ **A falha mais provável na primeira execução é CORS, não código.** A porta em que o Vite subiu precisa estar em `CORS_ORIGIN` no `.env` do **backend**. Se a 5173 já estiver ocupada, o Vite cai silenciosamente na 5174 e o navegador barra todas as chamadas. Confira a porta que o Vite anunciou no terminal antes de investigar qualquer outra coisa.

O banco do backend (Neon, plano gratuito) hiberna por inatividade: a primeira chamada depois de um tempo parado pode demorar cerca de 1,5 s ou responder `503`. O front repete automaticamente — **só em `GET`**, porque de um `503` em escrita não dá para afirmar que o dado não chegou ao banco.

### Sem o backend (demonstração e testes de tela)

```bash
VITE_USE_MOCK=true npm run dev
```

A camada de fixture serve **respostas capturadas da API real** e as devolve como DTO, atravessando os mesmos mapeadores da resposta verdadeira — ela não pode divergir do contrato sem quebrar o build ([ADR-0008](docs/decisions/ADR-0008-mock-vira-fixture-de-resposta-real.md)). `VITE_MOCK_SCENARIO` exercita os estados de tela: `vazio` (listas vazias) e `erro` (toda chamada falha).

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
│   ├── domain/           # Regras e cálculos puros
│   ├── hooks/            # Orquestração de dados e estado de tela
│   ├── lib/              # Formatação pt-BR (moeda, data, percentual)
│   ├── pages/            # Uma página por tela
│   ├── routes/           # Definição de rotas
│   ├── services/         # Clientes REST — única camada que fala HTTP
│   ├── types/            # Tipos de domínio
│   └── index.css         # Design tokens (cores, raio, fontes, foco visível)
├── context/              # Especificação do projeto (fonte da verdade)
├── docs/                 # Processo, backlog, lições, decisões (ADRs)
├── prototype/            # Protótipo do Figma Make — referência visual
└── .claude/              # Harness de desenvolvimento assistido por IA
```

## Arquitetura em camadas

```
Usuário → pages/components → hooks → services → API REST → backend
                                ↓
                             domain/  (regras e cálculos, sem I/O)
```

Responsabilidades, e por que elas importam:

- **`services/`** é a única camada que faz HTTP e o único lugar onde aparece o formato do JSON da API. Isso mantém as telas estáveis quando o contrato muda — ver [ADR-0002](docs/decisions/ADR-0002-contrato-de-dados-e-mapeamento.md).
- **`domain/`** concentra regra e cálculo puros, sem React e sem I/O, o que os torna testáveis isoladamente.
- **`hooks/`** orquestra dados e estado; **`pages/`** compõe; **`components/`** apresenta; **`lib/`** formata.

**Nenhum indicador é calculado em tela.** O motivo é prático: dashboard, lista e detalhes consomem os mesmos números, e cálculos duplicados fazem as telas discordarem entre si — divergência que costuma aparecer só na demonstração.

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
| `clients` | `id`, `name` (único), `created_at`, `updated_at` |
| `teams` | `id`, `name` (único), `created_at` |
| `projects` | `id`, `name`, `client_id`, `objective`, `manager_id`, `team_id`, `start_date`, `deadline`, `budget`, `budget_spent`, `hours_worked`, `status`, `observations`, `created_at`, `updated_at` |

Identificadores são UUID. A unicidade de `clients.name` e `teams.name` foi acrescentada durante o desenvolvimento e está justificada em [ADR-0006](docs/decisions/ADR-0006-unicidade-de-nome-nos-cadastros.md).

**Casing.** A API usa `snake_case` e o tipo de domínio do front é `camelCase`; a tradução acontece em **um mapeador por recurso**, dentro de `services/`. Nenhum `snake_case` existe fora dessa camada.

**Forma do projeto.** As relações chegam resolvidas (`client: {id, name}`), não como FK solta, e em duas formas: `ProjectSummary` na lista e `Project` no detalhe. O payload de escrita volta a usar id solto — **o objeto do `GET` não é aceito pelo `PUT`**.

**Status do projeto:**

| Valor | Exibição |
|---|---|
| `PLANEJAMENTO` | Planejamento |
| `EM_ANDAMENTO` | Em andamento |
| `EM_RISCO` | Em risco |
| `CONCLUIDO` | Concluído |
| `CANCELADO` | Cancelado |

`status` chega da API como `string`, e não como união fechada: ela devolve valor fora dos cinco canônicos de propósito, para denunciar dado corrompido em vez de escondê-lo. Mapas de cor e rótulo têm valor padrão.

**Perfis de usuário:** `GERENTE`, `COORDENADOR`, `GESTOR_PROJETO`.

No MVP o perfil é **dado cadastral**: é registrado e exibido, mas não restringe acesso a funcionalidade nenhuma (RNF03).

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
| RN09 | Um projeto está em **situação de atenção** quando está atrasado, **ou** teve o orçamento excedido, **ou** consumiu 90% ou mais do previsto — excluídos os encerrados. Cada projeto é contado uma única vez. |

RN07 a RN09 foram formalizadas durante o desenvolvimento, para resolver ambiguidades que produziriam comportamento divergente entre telas ([ADR-0004](docs/decisions/ADR-0004-refinamento-das-regras-de-negocio.md)). A RN09 foi **revista na integração** ([ADR-0007](docs/decisions/ADR-0007-indicadores-vem-do-backend.md)): ganhou o consumo elevado e perdeu o `EM_RISCO` declarado, que virou indicador próprio.

Duas consequências práticas que costumam surpreender:

- **Estouro de orçamento é aviso visual, nunca erro de formulário que impede salvar** (RN03).
- **`EM_RISCO` e "em atenção" são coisas diferentes e não se somam.** O primeiro é julgamento manual do gestor; o segundo é derivado. Um projeto pode estar nos dois, e somar os contadores passaria do total da carteira.

## Indicadores derivados

Nenhum indicador é persistido. Desde a integração, quem calcula a maior parte deles é o **backend** — o front apresenta e **nunca recalcula**, porque duas implementações divergiriam e a tela mostraria número diferente do que a API afirma ([ADR-0007](docs/decisions/ADR-0007-indicadores-vem-do-backend.md)).

**Vêm prontos da API, em `project.indicators`:**

| Indicador | Regra |
|---|---|
| `consumptionPercent` | `budget_spent / budget × 100`; **`null`** quando `budget = 0` (RN07) |
| `isLate` | prazo vencido com o projeto ativo; prazo igual a hoje **não** atrasa (RN08) |
| `isOverBudget` | `budget_spent > budget` |
| `hasHighConsumption` | consumo ≥ 90% — aviso antes do estouro |
| `needsAttention` + `attentionReasons` | RN09, cada projeto uma vez |

**Calculados no front, em `src/domain/indicators.ts`** — o que a API não devolve, e continua com fonte única pelo mesmo motivo:

`budgetRemaining`, `budgetOverrunPercent`, `daysUntilDeadline`, `scheduleProgressPercent`, e os agregados `summarizeProjects`, `aggregateByClient`, `topProjectsByHours`.

O dashboard sai todo de `GET /projects`. Os endpoints `GET /dashboard` e `GET /projects/attention` existem e **não são usados**: não trazem orçamento por cliente nem horas por projeto, que dois dos gráficos do RF08 precisam, e misturar as duas fontes colocaria dois números discordantes na mesma tela. Os nove agregados que o front deriva foram conferidos número a número contra `GET /dashboard` com a API no ar.

## Requisitos funcionais

| ID | Requisito | Onde |
|---|---|---|
| RF01 | Cadastrar usuário com nome, e-mail e perfil de acesso | `/users` |
| RF02 | Cadastrar cliente | `/clients` |
| RF03 | Cadastrar projeto | `/projects/new` |
| RF04 | Consultar a lista de projetos | `/projects` |
| RF05 | Consultar os detalhes de um projeto | `/projects/:id` |
| RF06 | Atualizar as informações de um projeto | `/projects/:id/edit` |
| RF07 | Calcular e exibir indicadores dos projetos | `/` (cards) |
| RF08 | Exibir dashboard gerencial com indicadores e gráficos | `/` (gráficos) |
| RF09 | Identificar e destacar projetos em situação de risco | `/` (painel), `/projects`, `/projects/:id` |

Equipes têm tela própria (`/teams`), como cadastro de apoio ao RF03.

Requisitos não funcionais estão em [context/01_requisitos_funcionais_e_nao_funcionais.md](context/01_requisitos_funcionais_e_nao_funcionais.md).

## Usabilidade e acessibilidade

Atende ao RNF01 (usabilidade) e ao RNF02 (desempenho). O que foi feito, e por quê:

- **Responsividade.** A partir de `lg` a navegação é a coluna fixa do protótipo; abaixo disso vira gaveta aberta por uma barra superior — 224 px de coluna fixa em um aparelho de 375 px deixariam a tabela com menos de metade da largura útil. Fechada, a gaveta sai do fluxo (`display: none`), para o Tab não percorrer uma navegação invisível.
- **Tabelas.** Sete colunas não cabem em 375 px. Em vez de espremer ou esconder coluna — que tira informação de quem está no celular —, a tabela rola horizontalmente dentro de uma região que é alcançável pelo teclado e tem nome e papel.
- **Foco visível.** Um contorno único, declarado em `src/index.css`, para tudo que recebe foco. Sobre a sidebar escura ele é branco: o azul do tema fica em 3,4:1 contra `slate-900`.
- **Contraste.** Texto de apoio usa `slate-500` sobre fundo claro (4,8:1) e `slate-400` sobre o fundo escuro da sidebar (6,9:1) — os tons do protótipo reprovavam em texto pequeno. Os cards de indicador abandonaram a opacidade do protótipo pelo mesmo motivo.
- **Título por tela.** Em aplicação de página única a navegação não recarrega a página; sem trocar o `<title>`, quem usa leitor de tela não é avisado de que mudou de tela.
- **Sinal nunca só por cor.** Atraso, estouro e motivo de atenção aparecem em texto ("Atrasado", "Orç. excedido"), não apenas em vermelho.
- **Gráficos.** Os SVG do Recharts vão como `aria-hidden` — eles não são navegáveis por leitor de tela — e os mesmos números estão em texto nos cards, em uma lista `sr-only` de status e na tabela do RF09.
- **Estados de tela.** Cada tela distingue **carregando**, **erro** (com "Tentar novamente"), **lista vazia** e **recorte vazio por filtro**. O formulário de projeto tem um quinto estado: base sem os cadastros de apoio, que diz o que falta e leva até a tela que resolve.
- **Desempenho.** As duas rotas que usam Recharts saem do pacote inicial por `React.lazy`, o que derruba o pacote de entrada de 715 kB (208 kB gzip) para cerca de 300 kB (91 kB gzip). As demais telas continuam no pacote inicial de propósito: dividir todas trocaria um download grande por um piscar de "carregando" a cada navegação.

## Dados de demonstração e validação

Os dados do MVP são **fictícios e inseridos manualmente**.

Para a demonstração valer alguma coisa, a carteira precisa conter os casos que fazem indicador mentir quando não estão tratados — não basta volume:

| Caso | Como montar | O que precisa aparecer |
|---|---|---|
| Orçamento previsto zero, com consumo | `budget = 0`, `budget_spent > 0` | Consumo "—", nunca "0%" nem "∞%" |
| Prazo vencendo hoje | `deadline` = data de hoje, status ativo | **Não** aparece como atrasado |
| Prazo vencido ontem | `deadline` = véspera, status ativo | Aparece como atrasado |
| Encerrado depois do prazo | `deadline` no passado, status `CONCLUIDO` | **Não** aparece como atrasado nem em atenção |
| Orçamento estourado | `budget_spent > budget` | Salva com aviso, não com erro |

O roteiro completo da avaliação com profissionais de gestão — participantes, preparação, tarefas cronometradas, perguntas abertas, questionário e limitações a declarar — está em **[docs/ROTEIRO_VALIDACAO.md](docs/ROTEIRO_VALIDACAO.md)**.

## Escopo do MVP

**Incluído:** cadastro de usuários, clientes e equipes; cadastro, consulta, atualização e detalhamento de projetos; dashboard gerencial com indicadores e gráficos; usuário logado simulado; dados fictícios.

**Fora de escopo** — não implementado por decisão de projeto:

- Autenticação e autorização reais (o usuário logado é simulado)
- Controle de acesso efetivo por perfil
- NPS e pesquisa de satisfação embarcada
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
- **Não portar:** navegação por `useState` (usamos rotas), cálculos de indicador dentro de componentes, campos em `snake_case` no tipo de domínio, e os defeitos conhecidos de divisão por zero e comparação de data em UTC que o protótipo contém.

Os design tokens dele (Inter, DM Mono, `--primary: #2563eb`, raio de 6px) foram portados para `src/index.css`.

## Documentação do projeto

| Diretório | Conteúdo |
|---|---|
| [context/](context/) | **Especificação — fonte da verdade.** Requisitos, arquitetura, modelo de dados e o contrato real da API. Os `.docx`/`.pdf` são as fontes originais, mantidas para rastreabilidade acadêmica e imutáveis; edite os `.md`. |
| [docs/HARNESS.md](docs/HARNESS.md) | Processo de desenvolvimento: ciclo de tarefa, guardrails, Definition of Done |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Backlog fatiado, rastreado até os requisitos funcionais |
| [docs/LESSONS.md](docs/LESSONS.md) | Lições aprendidas e armadilhas conhecidas do domínio e da stack |
| [docs/ROTEIRO_VALIDACAO.md](docs/ROTEIRO_VALIDACAO.md) | Roteiro da avaliação com profissionais de gestão |
| [docs/decisions/](docs/decisions/) | Registro de decisões de arquitetura (ADRs) |

Decisões registradas:

| ADR | Decisão |
|---|---|
| [0001](docs/decisions/ADR-0001-mock-primeiro.md) | Front desenvolvido sobre dados mock antes da API real |
| [0002](docs/decisions/ADR-0002-contrato-de-dados-e-mapeamento.md) | Contrato de dados isolado em `services/` com mapeamento explícito |
| [0003](docs/decisions/ADR-0003-ui-tailwind-em-vez-de-mui.md) | Tailwind CSS v4 como camada de UI, em vez de MUI |
| [0004](docs/decisions/ADR-0004-refinamento-das-regras-de-negocio.md) | Refinamento das regras de negócio (RF03, RNF03, RN06, RN07–RN09) |
| [0005](docs/decisions/ADR-0005-camada-lib-de-formatacao.md) | Camada `lib/` para formatação pt-BR, separada de `domain/` |
| [0006](docs/decisions/ADR-0006-unicidade-de-nome-nos-cadastros.md) | Nome único em clientes e equipes |
| [0007](docs/decisions/ADR-0007-indicadores-vem-do-backend.md) | Indicadores calculados pelo backend; RN09 revista |
| [0008](docs/decisions/ADR-0008-mock-vira-fixture-de-resposta-real.md) | Mock passa a servir respostas reais capturadas, em DTO |

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

O backend é um repositório separado, com a organização `Routes → Controllers → Services → Prisma`, sobre PostgreSQL. A comunicação é REST/JSON, na porta **3333**.

```
Frontend React → API REST → Express → Prisma → PostgreSQL
```

O contrato real está em [context/CONTRATO_API.md](context/CONTRATO_API.md), extraído do backend pronto. Onde ele contradisser os outros documentos de `context/`, ele vence.

**O que a integração revelou** — e que vale para quem for planejar a próxima:

- A divergência cara não foi de **casing**, que o mapeador por recurso já cobria, e sim de **responsabilidade**: a API resolve as relações na resposta, calcula os indicadores e tem duas formas de projeto. Isso não muda um mapeador — muda o tipo de domínio, os hooks e o que `domain/` ainda tem o direito de calcular ([L-007](docs/LESSONS.md)).
- Erros seguem o formato `{ erro, detalhes? }`. Quando há `detalhes`, ele vem legível campo a campo e é o que a tela mostra, porque diz **qual** campo corrigir.
- Escrita comprovada com a API no ar: payload montado pelo front aceito no `PUT` (200) enquanto o objeto cru do `GET` é recusado (400); estouro de orçamento aceito (201, RN03); prazo invertido recusado (400, RN05); reabertura de projeto `CONCLUIDO` recusada (400); nome de cliente repetido com caixa diferente respondendo 409.

---

Projeto acadêmico desenvolvido como parte do Projeto Final II.
