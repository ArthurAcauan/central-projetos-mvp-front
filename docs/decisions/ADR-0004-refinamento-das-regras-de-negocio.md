# ADR-0004 — Refinamento das regras de negócio e requisitos

- **Status:** Aceito
- **Data:** 2026-08-06
- **Afeta:** `context/01_requisitos_funcionais_e_nao_funcionais.md`, `context/00_harness_frontend.md`, `context/04_modelagem_dados_e_banco.md`, RF03, RNF03, RN06, indicadores derivados

## Contexto

Ao preparar a implementação da camada de domínio (F1-2) e comparar a especificação com o protótipo, apareceram lacunas e contradições. Todas produziriam decisão silenciosa em código — cada tela resolveria de um jeito, e a divergência apareceria só na demonstração.

Cinco problemas encontrados:

1. **RF03 incompleto.** Lista os campos do cadastro de projeto mas omite a **data de início**, embora `projects.start_date` seja `NOT NULL` e a RN05 dependa dela (`deadline >= start_date`). Omite também o **orçamento consumido**, que o §3 do mesmo documento inclui explicitamente no escopo do MVP.
2. **RN06 incompleta.** Lista os campos obrigatórios de um projeto sem incluir a data de início — mesma inconsistência.
3. **Divisão por zero não especificada.** O indicador de consumo é `budget_spent / budget * 100`. Com `budget = 0` (permitido por RN01, que exige apenas `>= 0`) o resultado é `Infinity` ou `NaN`. O protótipo reproduz o problema em `Dashboard.tsx`.
4. **Comparação de datas não especificada.** "Projeto atrasado" é definido como "data atual > deadline", sem dizer se a comparação considera hora ou fuso. `deadline` é `DATE`, sem hora; interpretado como UTC e comparado com o instante local (UTC-3), um projeto que vence hoje é classificado como atrasado. O protótipo reproduz o problema.
5. **"Em risco" nunca formalizado.** Os documentos dizem "status EM_RISCO e/ou condições de atenção", sem definir quais. O protótipo já adotou uma definição concreta (status, atraso ou estouro de orçamento, sem duplicar projetos), mas ela não estava escrita em nenhum requisito.

Além disso, **RNF03 se contradiz**: afirma que o sistema "deve restringir funcionalidades de acordo com o perfil de acesso" e, na frase seguinte, que não haverá autenticação no MVP. Como está, o requisito é reprovável em avaliação — promete um comportamento que o MVP não entrega.

## Decisão

Corrigir os documentos de `context/`, que são a fonte da verdade do projeto:

- **RF03** passa a listar data de início e orçamento consumido.
- **RN06** passa a incluir a data de início entre os campos obrigatórios.
- **RN07 (nova):** com orçamento previsto igual a zero, o percentual de consumo é *indisponível* — apresentado como indicador ausente, nunca como zero, infinito ou erro.
- **RN08 (nova):** a verificação de atraso compara datas de calendário, sem hora, no fuso local. Um projeto cujo prazo é a data atual **não** está atrasado.
- **RN09 (nova):** um projeto está em *situação de atenção* quando tem status `EM_RISCO`, **ou** está atrasado (RN08), **ou** teve o orçamento excedido. O contador do dashboard não duplica projetos que atendam a mais de uma condição — formaliza o comportamento já adotado no protótipo.
- **RNF03** é reescrito: no MVP o perfil é dado cadastral, sem efeito sobre acesso; a restrição efetiva por perfil é evolução futura.

RN01–RN05 permanecem como estavam, inclusive RN03 (o estouro de orçamento continua permitido).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Resolver os casos direto no código, sem tocar os documentos | O `context/` deixaria de ser fonte da verdade e a próxima sessão de trabalho reintroduziria o comportamento antigo. Também não serviria ao documento teórico do TCC. |
| Proibir `budget = 0` para evitar a divisão por zero | Contraria RN01 (`>= 0`) e é plausível no domínio: projeto em planejamento sem orçamento definido. |
| Tratar "em risco" apenas como o status manual | O dashboard precisa evidenciar atraso e estouro (RF09); restringir ao status esconderia justamente os projetos que exigem atenção. |

## Consequências

- As regras ficam testáveis: RN07, RN08 e RN09 são casos de teste obrigatórios em F1-2 e já estavam mapeados como armadilhas A-001, A-002 e A-007 em [LESSONS](../LESSONS.md).
- O seed de dados mock (F1-4) precisa incluir um projeto com `budget = 0` e um com prazo igual à data atual.
- **Pendência para o backend:** RN07 e RN08 valem para os dois lados. Se o backend também calcular indicadores, precisa das mesmas regras.
- **Pendência de modelagem, não resolvida aqui:** `clients` e `projects` têm `updated_at`, `users` e `teams` não. Como o front não depende desses campos, a padronização é decisão do backend — apenas registrada.
- **Pendência para o TCC:** as tabelas de requisitos e regras de negócio do documento teórico precisam ser atualizadas com RF03/RNF03 revisados e RN07–RN09.
