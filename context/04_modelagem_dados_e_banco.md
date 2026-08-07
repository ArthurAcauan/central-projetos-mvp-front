# Projeto Final II - Modelagem de Dados e Estrutura do Banco

## 1. Visao Geral

O banco de dados do MVP sera relacional e utilizara PostgreSQL. A modelagem foi mantida simples, com quatro tabelas principais: users, clients, teams e projects.

## 2. Entidades e Relacionamentos

- Client 1:N Project: um cliente pode possuir varios projetos e cada projeto possui apenas um cliente.
- User 1:N Project: um usuario pode ser responsavel por varios projetos e cada projeto possui apenas um gestor responsavel.
- Team 1:N Project: uma equipe pode estar associada a varios projetos e cada projeto possui uma equipe responsavel.

## 3. Tabela users

| Campo | Tipo PostgreSQL | Restricao |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | NOT NULL, UNIQUE |
| role | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Valores para role: GERENTE, COORDENADOR e GESTOR_PROJETO.

## 4. Tabela clients

| Campo | Tipo PostgreSQL | Restricao |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(150) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

## 5. Tabela teams

| Campo | Tipo PostgreSQL | Restricao |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | NOT NULL |

## 6. Tabela projects

| Campo | Tipo PostgreSQL | Restricao |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(150) | NOT NULL |
| client_id | UUID | FK -> clients.id |
| objective | TEXT | NOT NULL |
| manager_id | UUID | FK -> users.id |
| team_id | UUID | FK -> teams.id |
| start_date | DATE | NOT NULL |
| deadline | DATE | NOT NULL |
| budget | NUMERIC(15,2) | NOT NULL |
| budget_spent | NUMERIC(15,2) | NOT NULL DEFAULT 0 |
| hours_worked | NUMERIC(10,2) | NOT NULL DEFAULT 0 |
| status | VARCHAR(30) | NOT NULL |
| observations | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

## 7. Status do Projeto

- PLANEJAMENTO
- EM_ANDAMENTO
- EM_RISCO
- CONCLUIDO
- CANCELADO

Os status serao armazenados como VARCHAR e validados no backend. Nao sera utilizado ENUM do PostgreSQL neste momento.

## 8. Indicadores Derivados

| Indicador | Calculo/Regra |
|---|---|
| Consumo do orcamento | budget_spent / budget x 100; indisponivel quando budget = 0 (RN07) |
| Projeto atrasado | data atual > deadline comparando datas de calendario no fuso local (RN08) e status diferente de CONCLUIDO/CANCELADO |
| Orcamento excedido | budget_spent > budget |
| Projeto em situacao de atencao | status EM_RISCO, ou atrasado, ou com orcamento excedido, sem duplicidade (RN09) |

Os indicadores nao serao armazenados como campos proprios nas tabelas. Serao calculados pela aplicacao.

## 9. Estrutura Final do Banco

- users
- clients
- teams
- projects

## 10. Representacao textual do DER

CLIENTS (1) ---- (N) PROJECTS (N) ---- (1) TEAMS
USERS (1) ------ (N) PROJECTS

A tabela PROJECTS concentra as chaves estrangeiras client_id, manager_id e team_id.

## 10.1 Pendencia de padronizacao

As tabelas clients e projects possuem created_at e updated_at; users e teams possuem apenas created_at. O frontend nao depende desses campos, portanto a padronizacao e decisao do backend. Registrado em docs/decisions/ADR-0004.

## 10.2 Unicidade de nome em clients e teams

clients.name e teams.name receberam UNIQUE. O nome e a unica propriedade que distingue esses cadastros na interface e nos agregados por cliente do RF08: dois clientes com o mesmo nome produzem duas barras indistinguiveis no grafico e duas opcoes iguais no seletor de projeto. O frontend ja recusa o nome repetido no cadastro, mas essa verificacao e conveniencia, nao garantia — a restricao no banco continua sendo necessaria. Registrado em docs/decisions/ADR-0006.

## 11. Decisoes de Escopo

- Nao havera autenticacao real no MVP.
- Nao havera controle individual de membros das equipes.
- Nao havera timesheet individual; somente total de horas por projeto.
- Nao serao armazenados indicadores calculados no banco.
- Nao serao incluidos dados adicionais de clientes sem contribuicao direta ao objetivo do projeto.
