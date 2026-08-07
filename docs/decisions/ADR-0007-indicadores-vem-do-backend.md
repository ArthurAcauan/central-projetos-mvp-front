# ADR-0007 — Indicadores calculados pelo backend, e RN09 redefinido

- **Status:** Aceito
- **Data:** 2026-08-07
- **Afeta:** `domain/indicators.ts`, `types/project.ts`, `services/projects.ts`, todas as telas de projeto e o dashboard, RF05, RF07, RF08, RF09, RN09

## Contexto

O backend ficou pronto e o contrato real (`context/CONTRATO_API.md`) chegou.
Ele resolve, na resposta, duas coisas que o front assumia fazer sozinho:

1. **As relações vêm resolvidas.** `client: {id, name}`, `manager`, `team` — não
   `client_id`. Cai a carga de clientes, usuários e equipes que a lista e o
   detalhe faziam só para trocar UUID por nome.
2. **Os indicadores vêm calculados.** Toda resposta de projeto traz
   `indicadores` com `projeto_atrasado`, `consumo_orcamento_percentual`,
   `orcamento_excedido`, `consumo_elevado`, `em_atencao` e `motivos_de_atencao`.
   O contrato é explícito: *"Não recalcule atraso no front comparando `deadline`
   com `new Date()` — você vai obter resultado diferente do backend."*

Isso colide de frente com o `CLAUDE.md`, que dizia que o cálculo vive **só** em
`src/domain/indicators.ts`. A colisão é real: com as duas implementações vivas, o
card diria "em dia" e a API diria "atrasado" na primeira divergência de fuso, de
hora de corte ou de tratamento de status terminal. É a armadilha **A-002**
repetida, agora entre repositórios — e nesse cenário o front perde, porque a
regra que vale é a de quem lê o banco.

Há ainda uma diferença de **definição**, não só de dono. O `em_atencao` do
backend não é o RN09 escrito em `context/01`:

| | RN09 original (front) | `em_atencao` (backend) |
|---|---|---|
| Atrasado | conta | conta |
| Orçamento excedido | conta | conta |
| Consumo ≥ 90% sem estouro | não existia | **conta** |
| Status `EM_RISCO` declarado | conta | **não conta** |
| Projeto encerrado | podia contar por estouro | nunca conta |

## Decisão

**O backend é a fonte dos indicadores que ele devolve.** `domain/indicators.ts`
para de calcular atraso, consumo, estouro e atenção, e passa a cobrir só o que a
API não manda: `budgetRemaining`, `daysUntilDeadline`, `scheduleProgressPercent`,
`budgetOverrunPercent` (que agora deriva do percentual recebido) e os agregados
`summarizeProjects`, `aggregateByClient`, `topProjectsByHours` — estes últimos
somando o que a API mandou por projeto, sem reinterpretar nada.

**RN09 passa a ser a definição do backend**, incluindo consumo elevado e
excluindo o risco declarado. `EM_RISCO` continua visível: vira contador próprio
no card e motivo adicional na linha do painel, ao lado dos motivos derivados.
Somar os dois números é erro — um projeto pode estar nos dois, e a soma passaria
do total da carteira.

**O dashboard sai todo de `GET /projects`**, não de `GET /dashboard`. Não é
desconfiança do endpoint: ele não traz orçamento por cliente nem horas por
projeto, e dois dos quatro gráficos do RF08 precisam disso. Usar as duas fontes
colocaria dois números na mesma tela que podem discordar. `GET /dashboard` e
`GET /projects/attention` ficam sem uso — disponíveis se um dia a carteira
crescer a ponto de a soma no navegador pesar.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Manter o cálculo no front e ignorar `indicadores` | Dois donos da mesma regra. O contrato avisa que os números divergem, e o defeito apareceria na demonstração, não no teste. |
| Recalcular no front e comparar com a API, avisando na divergência | Complexidade sem destinatário: não há quem aja sobre o aviso, e a tela precisaria escolher um dos dois de qualquer forma. |
| Manter o RN09 original compondo `em_atencao \|\| EM_RISCO` | Preservaria o texto da monografia, mas o card não bateria com `projetos_em_atencao` do `GET /dashboard` — e "por que estes dois números diferem?" é exatamente a pergunta que o projeto existe para evitar. |
| Usar `GET /dashboard` nos cards e `GET /projects` nos gráficos | Duas origens na mesma tela. Verificado que hoje batem, mas nada garante que continuem batendo. |

## Consequências

- Os testes de atraso, consumo, estouro e atenção **saíram** de
  `indicators.test.ts`. A responsabilidade mudou de repositório e o teste foi
  junto; mantê-lo aqui verificaria uma regra que este front não implementa mais.
  O que ficou é o que o front ainda decide.
- O front ganhou o sinal de **consumo elevado** (≥ 90%), que o RN09 original não
  tinha: aparece como aviso no detalhe e como motivo no painel.
- As telas ficaram menores. `useProject` deixou de fazer quatro chamadas e passou
  a fazer uma; `useProjectsList` deixou de carregar usuários; `useDashboard`
  carrega só projetos.
- `status` passou a ser `string` nos modelos de leitura. O contrato devolve valor
  fora dos cinco canônicos de propósito, para denunciar dado corrompido — os
  mapas de cor e rótulo têm valor padrão em vez de quebrar a linha.
  `ProjectStatus` continua fechado onde o valor é **escolhido**.
- **Verificado contra a API rodando**: os nove agregados que o front deriva de
  `GET /projects` batem, número a número, com `GET /dashboard` — incluindo
  `em_atencao = 8` e a contagem dos cinco status.
- Atualizar: `context/01_...md` (RN09 e a regra de status terminal), `CLAUDE.md`
  (seção de indicadores) e `docs/BACKLOG.md`.
- **Atenção à numeração**: os dois repositórios têm listas de RN independentes e
  **colidentes**. O RN07 daqui é orçamento zero; o RN07 do backend é status
  terminal. Ao ler o contrato, confira de qual lista a regra é.
