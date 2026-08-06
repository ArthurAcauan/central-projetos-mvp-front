# Harness de Desenvolvimento - Frontend MVP

Este arquivo consolida as regras de contexto para orientar desenvolvimento assistido por IA no frontend.

## Escopo funcional obrigatorio (MVP)

- Dashboard gerencial.
- Lista de projetos com consulta e filtros basicos.
- Cadastro de projeto.
- Detalhes de projeto.
- Cadastros auxiliares de clientes, equipes e usuarios (conforme necessidade).

## Fora de escopo (nao implementar sem solicitacao)

- Autenticacao e autorizacao reais.
- IA generativa como funcionalidade do produto.
- Integracoes corporativas reais.
- NPS.
- Timesheet individual.
- Controle individual de membros da equipe.
- Arquitetura de microsservicos.

## Stack e arquitetura do front

- React + TypeScript + Vite.
- UI: Tailwind CSS v4, sem biblioteca de componentes (ver docs/decisions/ADR-0003).
- Referencia visual: prototipo em prototype/ (Figma Make).
- Graficos: Recharts.
- Integracao com backend via REST/JSON.
- Separacao por camadas/pastas: components, pages, services, hooks, types, routes.

## Entidades relevantes para UI

- users
- clients
- teams
- projects

Campos centrais de projects para telas:
- name, client_id, objective, manager_id, team_id
- start_date, deadline
- budget, budget_spent, hours_worked
- status, observations

## Status aceitos

- PLANEJAMENTO
- EM_ANDAMENTO
- EM_RISCO
- CONCLUIDO
- CANCELADO

## Regras de negocio que impactam validacao de formulario

- budget >= 0
- budget_spent >= 0
- hours_worked >= 0
- deadline >= start_date
- budget_spent pode ultrapassar budget (nao bloquear; exibir como aviso)
- Campos obrigatorios: cliente, gestor, equipe, objetivo, start_date, deadline, budget e status (RN06)

## Indicadores derivados esperados na UI

- Consumo do orcamento: budget_spent / budget x 100. Com budget igual a zero o indicador e indisponivel, nunca 0, Infinity ou NaN (RN07).
- Projeto atrasado: hoje > deadline comparando datas de calendario no fuso local, e status diferente de CONCLUIDO/CANCELADO. Prazo igual a hoje nao esta atrasado (RN08).
- Orcamento excedido: budget_spent > budget
- Projeto em situacao de atencao: status EM_RISCO, ou atrasado, ou com orcamento excedido, contado uma unica vez (RN09).

## Diretrizes para implementacao

- Priorizar simplicidade e clareza da interface.
- Evitar overengineering.
- Manter codigo legivel, testavel e facil de manter.
- Nao adicionar novos campos/tabelas sem necessidade funcional comprovada.
- Atualizar documentacao em mudancas estruturais.
