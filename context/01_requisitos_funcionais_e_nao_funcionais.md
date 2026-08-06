# Projeto Final II - Requisitos Funcionais e Nao Funcionais

## 1. Requisitos Funcionais

Os requisitos funcionais definem as principais funcionalidades previstas para o MVP da plataforma de centralizacao e analise de informacoes para apoio a gestao de projetos.

| ID | Requisito | Descricao | Prioridade |
|---|---|---|---|
| RF01 | Cadastrar usuario | O sistema deve permitir o cadastro de usuarios com nome, e-mail e perfil de acesso. | Alta |
| RF02 | Cadastrar cliente | O sistema deve permitir cadastrar clientes associados aos projetos gerenciados pela organizacao. | Alta |
| RF03 | Cadastrar projeto | O sistema deve permitir cadastrar um projeto informando nome, cliente, objetivo, gestor responsavel, equipe, data de inicio, prazo, orcamento previsto, orcamento consumido, horas realizadas, status e observacoes. | Alta |
| RF04 | Consultar projetos | O sistema deve apresentar uma lista dos projetos cadastrados, permitindo visualizar suas principais informacoes. | Alta |
| RF05 | Consultar detalhes de um projeto | O sistema deve permitir selecionar um projeto e visualizar suas informacoes detalhadas, incluindo orcamento, horas realizadas, prazo, equipe, status, objetivo e observacoes. | Alta |
| RF06 | Atualizar projeto | O sistema deve permitir atualizar as informacoes de um projeto durante sua execucao. | Alta |
| RF07 | Exibir indicadores dos projetos | O sistema deve calcular e apresentar indicadores relacionados aos projetos cadastrados, incluindo quantidade de projetos, projetos por status, orcamento, horas realizadas, projetos por cliente e projetos em risco ou atraso. | Alta |
| RF08 | Exibir dashboard gerencial | O sistema deve apresentar uma visao consolidada dos projetos por meio de indicadores e graficos. | Alta |
| RF09 | Identificar projetos em situacao de risco | O sistema deve destacar projetos classificados como Em risco ou que apresentem condicoes que indiquem necessidade de atencao, como atraso ou elevado consumo do orcamento. | Alta |

## 2. Requisitos Nao Funcionais

| ID | Categoria | Descricao |
|---|---|---|
| RNF01 | Usabilidade | A interface deve apresentar as informacoes de forma clara e organizada, permitindo que usuarios com diferentes funcoes de gestao consultem os dados dos projetos. |
| RNF02 | Desempenho | As consultas aos projetos e indicadores devem apresentar tempo de resposta adequado para utilizacao cotidiana. |
| RNF03 | Seguranca | O sistema deve registrar o perfil de acesso de cada usuario (GERENTE, COORDENADOR, GESTOR_PROJETO) de modo a viabilizar a restricao de funcionalidades em evolucao futura. No MVP nao ha autenticacao nem autorizacao efetiva: o usuario logado e simulado e o perfil e dado cadastral, sem efeito sobre o acesso as telas. |
| RNF04 | Manutenibilidade | A aplicacao deve possuir uma arquitetura organizada, permitindo manutencao e evolucao das funcionalidades. |
| RNF05 | Integridade dos dados | O sistema deve garantir a consistencia das informacoes relacionadas aos projetos, clientes, usuarios e equipes. |

## 3. Escopo do MVP

- Usuarios: Gerente, Coordenador e Gestor de Projeto.
- Autenticacao: nao sera implementada autenticacao real no MVP; sera utilizado um usuario simulado.
- Cadastro e gerenciamento de clientes, equipes e projetos.
- Cadastro de projeto com orcamento e orcamento consumido.
- Dashboard integrado ao frontend para visualizacao dos indicadores.
- Status de projeto: Planejamento, Em andamento, Em risco, Concluido e Cancelado.
- Registro apenas do total de horas realizadas no projeto, sem timesheet individual.

## 4. Regras de Negocio Iniciais

| ID | Regra |
|---|---|
| RN01 | O orcamento do projeto deve ser maior ou igual a zero. |
| RN02 | O orcamento consumido deve ser maior ou igual a zero. |
| RN03 | O orcamento consumido nao sera bloqueado quando ultrapassar o orcamento previsto, pois essa situacao devera poder ser evidenciada pelo dashboard. |
| RN04 | As horas realizadas devem ser maiores ou iguais a zero. |
| RN05 | A data de termino prevista deve ser igual ou posterior a data de inicio. |
| RN06 | Todo projeto deve possuir cliente, gestor, equipe, objetivo, data de inicio, prazo, orcamento e status. |
| RN07 | Quando o orcamento previsto for igual a zero, o percentual de consumo nao e calculavel e deve ser apresentado como indisponivel, nunca como zero, infinito ou erro. |
| RN08 | A verificacao de atraso compara datas de calendario, sem considerar hora, no fuso local do usuario. Um projeto cujo prazo e a data atual nao esta atrasado. |
| RN09 | Um projeto esta em situacao de atencao quando possui status EM_RISCO, ou esta atrasado conforme RN08, ou teve o orcamento consumido superior ao previsto. Um projeto que atenda a mais de uma condicao e contado uma unica vez. |

## 5. Indicadores Derivados

| Indicador | Regra de calculo | Finalidade |
|---|---|---|
| Consumo do orcamento | orcamento consumido / orcamento previsto x 100; indisponivel quando o previsto e zero (RN07) | Percentual do orcamento previsto que ja foi consumido. |
| Projeto atrasado | data atual > prazo, comparando datas de calendario no fuso local (RN08), e status diferente de CONCLUIDO/CANCELADO | Identifica projetos cujo prazo foi ultrapassado. |
| Orcamento excedido | orcamento consumido > orcamento previsto | Identifica projetos cujo consumo ultrapassou o orcamento previsto. |
| Projeto em situacao de atencao | status EM_RISCO, ou atrasado, ou com orcamento excedido, sem duplicidade (RN09) | Concentra em um unico indicador os projetos que exigem acao gerencial. |

Os indicadores derivados nao serao armazenados diretamente no banco de dados. Eles serao calculados pela aplicacao a partir dos dados dos projetos.
