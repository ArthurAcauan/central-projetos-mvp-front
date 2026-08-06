# ADR-0002 — Contrato de dados isolado em `services/` com mapeamento explícito

- **Status:** Aceito
- **Data:** 2026-08-06
- **Afeta:** `src/services/`, `src/types/`, RF03–RF07

## Contexto

A documentação do projeto é ambígua quanto ao formato do JSON da API:

- `context/04_modelagem_dados_e_banco.md` e `context/00_harness_frontend.md` usam `snake_case` (`budget_spent`, `client_id`, `start_date`) — que é o nome das colunas no PostgreSQL.
- `context/01_requisitos_funcionais_e_nao_funcionais.md`, §5, escreve o indicador como `budgetSpent / budget`.

O Prisma expõe os campos como definidos no schema, e o backend pode serializar em qualquer um dos dois formatos. A decisão real pertence ao backend e ainda não foi confirmada.

Se cada componente acessar o campo do jeito que achar, descobrir o formato errado na integração (F5-1) custa uma correção espalhada por todas as telas.

## Decisão

O tipo de domínio usado por páginas, componentes e indicadores é **camelCase** (`budgetSpent`, `clientId`, `startDate`), padrão da linguagem no front.

A tradução entre o formato da API e o tipo de domínio acontece em **um único lugar** por recurso, dentro de `src/services/`. Se o backend confirmar `snake_case`, muda apenas o mapeador.

Nenhum campo em `snake_case` aparece fora de `src/services/`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Usar `snake_case` em todo o front | Contamina componentes com o formato do banco e destoa do padrão de React/TS. |
| Adivinhar camelCase e consumir direto, sem mapeador | Se o backend devolver `snake_case`, a correção atinge todas as telas em vez de um arquivo. |
| Esperar a definição do backend para começar | Bloqueia a Fase 1 por uma decisão que o mapeador torna barata de mudar. |

## Consequências

- Componentes ficam estáveis mesmo se o contrato mudar.
- Custo: uma função de mapeamento por recurso, que precisa ser mantida junto com o tipo.
- F5-1 deve verificar o formato real e ajustar **só** os mapeadores.
- Pendência para o backend: confirmar o casing da serialização e se datas vêm como `YYYY-MM-DD` ou ISO completo (impacta a armadilha A-002 em [LESSONS](../LESSONS.md)).
