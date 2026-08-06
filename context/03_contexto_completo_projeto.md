# Projeto Final II - Contexto Completo do Projeto

Documento de contexto para uso com ferramentas e agentes de IA durante o desenvolvimento do MVP.

## 1. Visao geral

Projeto para desenvolvimento de uma plataforma web de centralizacao e analise de informacoes relacionadas a gestao de projetos em empresas de consultoria de tecnologia.

## 2. Problema

Informacoes de um mesmo projeto ficam distribuidas em diferentes fontes, dificultando visao consolidada, acompanhamento de desempenho, identificacao de riscos e tomada de decisao.

## 3. Questao de pesquisa

Como a centralizacao e analise de informacoes de projetos em uma plataforma unica podem contribuir para melhorar a gestao de projetos em empresas de consultoria de tecnologia?

## 4. Objetivo geral

Desenvolver uma plataforma para centralizacao e analise de informacoes de projetos para apoiar a gestao de projetos e melhorar a eficiencia operacional.

## 5. Objetivos especificos

- Identificar informacoes e indicadores principais da gestao de projetos.
- Analisar desafios da dispersao de informacoes.
- Projetar arquitetura da plataforma.
- Desenvolver visualizacao e analise via dashboards e relatorios.
- Avaliar ganhos de acompanhamento e decisao.

## 6. Escopo do MVP

- Cadastro de clientes, equipes, usuarios e perfis.
- Cadastro, consulta e atualizacao de projetos.
- Visao detalhada de projeto.
- Dashboard gerencial com indicadores.
- Usuario logado simulado (sem autenticacao real).
- Dados ficticios inseridos manualmente.
- Sem NPS.
- Sem timesheet individual (somente total de horas por projeto).
- Sem controle individual de membros de equipe.
- Sem IA generativa obrigatoria no produto.

## 7. Usuarios

- Gerente
- Coordenador
- Gestor de Projeto

## 8. Dados principais de projeto

- Nome do projeto
- Cliente
- Objetivo
- Gestor responsavel
- Equipe
- Data de inicio
- Prazo final
- Orcamento previsto
- Orcamento consumido
- Total de horas realizadas
- Status
- Observacoes

## 9. Status

- PLANEJAMENTO
- EM_ANDAMENTO
- EM_RISCO
- CONCLUIDO
- CANCELADO

Status armazenado como texto e validado no backend.

## 10. Indicadores e dashboard

Indicadores principais:
- Quantidade total de projetos
- Projetos por status
- Projetos por cliente
- Projetos em risco
- Projetos atrasados
- Orcamento total
- Orcamento consumido
- Percentual de consumo por projeto
- Projetos com orcamento excedido
- Total de horas trabalhadas
- Visao geral de um projeto especifico

Regra: indicadores derivados nao sao persistidos; sao calculados pela aplicacao.

## 11. Arquitetura da solucao

Fluxo conceitual:
Frontend React -> API REST Node.js -> Camada de negocio -> Prisma ORM -> PostgreSQL

## 12. Stack tecnologica

### 12.1 Frontend
- React
- TypeScript
- Biblioteca de UI orientada a produtividade
- Biblioteca de graficos para dashboard
- Consumo de API REST

### 12.2 Backend
- Node.js
- TypeScript
- API REST
- Prisma ORM
- Validacoes e regras de negocio

### 12.3 Banco de dados
- PostgreSQL
- UUID como identificador
- Chaves estrangeiras
- Prisma Migrations

### 12.4 Ferramentas
- Git
- GitHub ou GitLab
- VS Code
- Ferramentas de IA para apoio

## 13. Estrutura dos repositorios

- Frontend: React + TypeScript
- Backend: API Node.js + TypeScript

## 14. Modelagem de dados

Tabelas principais:
- users
- clients
- teams
- projects

projects e a entidade central, com client_id, manager_id, team_id.

## 15. Tabela users

- id: UUID, PK
- name: VARCHAR(100), NOT NULL
- email: VARCHAR(150), NOT NULL, UNIQUE
- role: VARCHAR(30), NOT NULL
- created_at: TIMESTAMP, NOT NULL

Roles: GERENTE, COORDENADOR, GESTOR_PROJETO.

## 16. Tabela clients

- id: UUID, PK
- name: VARCHAR(150), NOT NULL
- created_at: TIMESTAMP, NOT NULL
- updated_at: TIMESTAMP, NOT NULL

## 17. Tabela teams

- id: UUID, PK
- name: VARCHAR(100), NOT NULL
- created_at: TIMESTAMP, NOT NULL

## 18. Tabela projects

- id: UUID, PK
- name: VARCHAR(150), NOT NULL
- client_id: UUID, FK clients.id
- objective: TEXT, NOT NULL
- manager_id: UUID, FK users.id
- team_id: UUID, FK teams.id
- start_date: DATE, NOT NULL
- deadline: DATE, NOT NULL
- budget: NUMERIC(15,2), NOT NULL
- budget_spent: NUMERIC(15,2), NOT NULL, DEFAULT 0
- hours_worked: NUMERIC(10,2), NOT NULL, DEFAULT 0
- status: VARCHAR(30), NOT NULL
- observations: TEXT, NULL
- created_at: TIMESTAMP, NOT NULL
- updated_at: TIMESTAMP, NOT NULL

## 19. Regras de negocio principais

- Orcamento >= 0
- Orcamento consumido >= 0
- Orcamento consumido pode ultrapassar orcamento previsto
- Horas realizadas >= 0
- Deadline >= start_date
- Projeto deve ter cliente, gestor, equipe, objetivo, prazo, orcamento e status
- Projeto possui um unico cliente
- Projeto possui um unico gestor responsavel
- Projeto possui uma equipe responsavel
- Uma equipe pode estar em varios projetos

## 20. Indicadores derivados

- Consumo do orcamento = budget_spent / budget x 100
- Projeto atrasado = hoje > deadline e status diferente de CONCLUIDO/CANCELADO
- Orcamento excedido = budget_spent > budget
- Projetos em risco = status EM_RISCO e/ou condicoes de atencao

## 21. Requisitos funcionais principais

RF01 a RF09 (cadastro, consulta, atualizacao, indicadores, dashboard e identificacao de risco).

## 22. Requisitos nao funcionais principais

RNF01 a RNF05 (usabilidade, desempenho, seguranca, manutenibilidade e integridade).

## 23. Telas previstas

- Dashboard principal
- Lista de projetos
- Cadastro de projeto
- Detalhes do projeto
- Cadastros auxiliares de clientes, equipes e usuarios

## 24. Estrategia de desenvolvimento

- Configurar repositorios e ambiente
- Configurar PostgreSQL e Prisma
- Criar schema e migrations
- Implementar entidades e regras no backend
- Implementar endpoints REST
- Implementar frontend base
- Implementar telas de CRUD
- Integrar frontend e backend
- Implementar dashboard e indicadores
- Gerar dados ficticios
- Testar e corrigir
- Preparar validacao
- Documentar resultados

## 25. Validacao do projeto

Avaliacao com profissionais de gestao para verificar clareza, organizacao e apoio a tomada de decisao.

## 26. Uso de IA no desenvolvimento

IA como apoio para codigo, testes, revisao, documentacao e investigacao. Nao substitui requisitos, arquitetura e validacao.

## 27. Principios para as IAs de desenvolvimento

- Nao adicionar funcionalidades fora do escopo
- Priorizar simplicidade e funcionalidade
- Evitar overengineering
- Manter TypeScript no front e back
- Manter separacao front/back/banco
- Nao criar tabelas/campos sem necessidade
- Nao implementar autenticacao real no MVP
- Nao introduzir IA generativa como requisito
- Explicar impacto antes de alterar arquitetura
- Priorizar codigo legivel, testavel e manutenivel
- Gerar testes para regras importantes
- Manter migrations versionadas
- Nao inserir segredos no codigo
- Atualizar documentacao em decisoes estruturais

## 28. Fora do MVP

- Autenticacao e autorizacao reais
- Controle individual de membros de equipe
- Timesheet detalhado por colaborador
- NPS
- Integracoes corporativas reais
- Importacao automatica de dados
- Agentes autonomos de IA
- Recomendacoes comerciais automatizadas
- Microsservicos
- Infraestrutura corporativa de producao

## 29. Diretriz principal

A plataforma deve demonstrar, de forma pratica e mensuravel, que centralizar informacoes essenciais em um unico ambiente facilita acompanhamento gerencial, analise e tomada de decisao, priorizando uma solucao simples, funcional e validavel.
