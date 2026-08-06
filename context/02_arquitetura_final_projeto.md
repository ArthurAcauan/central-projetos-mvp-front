# Arquitetura Final do Projeto

Plataforma de Centralizacao e Analise de Informacoes para Gestao de Projetos.

Documento-base para o desenvolvimento do Projeto Final II, servindo como referencia para implementacao, documentacao academica e utilizacao por ferramentas de IA.

## 1. Visao geral

A solucao sera desenvolvida como um MVP de uma plataforma web destinada a centralizacao de informacoes de projetos em empresas de consultoria de tecnologia. O sistema permitira cadastrar projetos, clientes, equipes e responsaveis, acompanhar orcamento, horas, prazos e status, alem de apresentar indicadores por meio de dashboards.

## 2. Arquitetura definida

A arquitetura sera composta por tres camadas principais: frontend, backend e banco de dados.

- Frontend: React + TypeScript + Vite
- Interface: Tailwind CSS v4, sem biblioteca de componentes (decisao registrada em docs/decisions/ADR-0003; a definicao anterior era MUI, alterada apos a validacao do prototipo)
- Visualizacao de dados: Recharts
- Backend: Node.js + Express + TypeScript
- ORM: Prisma
- Banco de dados: PostgreSQL
- Comunicacao: REST API utilizando JSON
- Versionamento: Git

## 3. Fluxo arquitetural

Usuario -> Frontend React -> REST API -> Backend Node.js/Express -> Prisma -> PostgreSQL

## 4. Responsabilidades das camadas

### 4.1 Frontend

Responsavel pela interface da aplicacao, navegacao, formularios de cadastro, consulta de projetos, visualizacao dos detalhes e apresentacao dos indicadores em dashboards.

### 4.2 Backend

Responsavel pelas rotas da API, validacoes, regras de negocio e acesso aos dados. A organizacao seguira, de forma simplificada, o fluxo Routes -> Controllers -> Services -> Prisma.

### 4.3 Banco de dados

O PostgreSQL armazenara os dados estruturados da plataforma, utilizando o Prisma como camada de acesso e mapeamento objeto-relacional.

## 5. Modelo de dados

O modelo inicial possui quatro entidades principais: users, clients, teams e projects.

| Tabela | Finalidade | Principais campos | Relacionamentos |
|---|---|---|---|
| users | Usuarios do sistema | id, name, email, role | 1:N com projects |
| clients | Clientes dos projetos | id, name | 1:N com projects |
| teams | Equipes responsaveis | id, name | 1:N com projects |
| projects | Entidade central | id, name, client_id, manager_id, team_id, objective, dates, budget, budget_spent, hours_worked, status, observations | N:1 com clients, users e teams |

Relacionamentos: projects.client_id -> clients.id; projects.manager_id -> users.id; projects.team_id -> teams.id.

## 6. Dados do projeto

- Nome do projeto
- Cliente
- Objetivo do projeto
- Responsavel/gestor
- Equipe
- Data de inicio
- Prazo
- Orcamento
- Orcamento consumido
- Horas realizadas
- Status
- Observacoes

## 7. Status previstos

- Planejamento
- Em andamento
- Em risco
- Concluido
- Cancelado

## 8. Dashboard

O dashboard sera implementado dentro do proprio frontend. Nao sera utilizada uma ferramenta externa de BI no MVP.

### 8.1 Indicadores planejados

- Quantidade total de projetos
- Projetos por status
- Orcamento total dos projetos
- Orcamento consumido
- Percentual de orcamento consumido
- Projetos em risco
- Projetos atrasados
- Horas realizadas
- Projetos por cliente

### 8.2 Graficos sugeridos

| Indicador | Visualizacao | Objetivo |
|---|---|---|
| Projetos por status | Grafico de barras ou rosca | Visualizar a distribuicao entre Planejamento, Em andamento, Em risco, Concluido e Cancelado. |
| Orcamento consumido | Barras/progresso | Comparar orcamento total e orcamento consumido. |
| Projetos por cliente | Grafico de barras | Identificar a quantidade de projetos associados a cada cliente. |
| Horas realizadas por projeto | Grafico de barras | Comparar o esforco registrado entre os projetos. |
| Projetos em risco/atrasados | Cards + tabela | Destacar rapidamente projetos que exigem atencao. |

## 9. Telas previstas

- Dashboard: visao consolidada e indicadores.
- Lista de projetos: consulta e filtros.
- Cadastro de projeto: formulario para criacao de projetos.
- Detalhes do projeto: informacoes completas e indicadores especificos.

## 10. Diagramas recomendados para o PF2

- Figura 1: Arquitetura da solucao proposta.
- Figura 2: Modelo Entidade-Relacionamento da plataforma.

O diagrama de arquitetura podera ser produzido em Mermaid e o DER em dbdiagram.io, facilitando alteracoes durante o desenvolvimento.

## 11. Estrutura simplificada dos projetos

### Frontend

- src/components
- src/pages
- src/services
- src/hooks
- src/types
- src/routes

### Backend

- src/routes
- src/controllers
- src/services
- src/validators
- src/middlewares
- prisma/schema.prisma

## 12. Fora do escopo do MVP

- Autenticacao real; o usuario sera inicialmente simulado.
- Integracao com sistemas corporativos reais.
- NPS.
- Inteligencia Artificial para analise ou recomendacoes.
- Power BI ou outra plataforma externa de BI.
- Arquitetura de microsservicos.
- Infraestrutura cloud complexa.
- Funcionalidades que nao contribuam diretamente para o objetivo do projeto.

## 13. Diretriz de desenvolvimento

A implementacao devera priorizar simplicidade, funcionalidade e aderencia ao objetivo do Projeto Final. A utilizacao de ferramentas de IA sera incentivada para acelerar o desenvolvimento, mas as decisoes de arquitetura, escopo e regras de negocio deverao seguir este documento. Novas tecnologias ou funcionalidades somente deverao ser adicionadas quando houver justificativa clara para o projeto.
