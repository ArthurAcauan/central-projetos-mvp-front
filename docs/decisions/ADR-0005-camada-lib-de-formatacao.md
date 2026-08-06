# ADR-0005 — Formatação pt-BR em `src/lib/`, separada de `domain/`

- **Status:** Aceito
- **Data:** 2026-08-06
- **Afeta:** `src/lib/`, `src/domain/`, `src/pages/`, `src/components/` — RNF02, RF04 em diante

## Contexto

A partir de F2-1 toda tela mostra os mesmos valores: orçamento em reais, prazo em `dd/mm/aaaa`, consumo em percentual. Se cada tela formatar do seu jeito, a lista, os detalhes e o dashboard mostram o mesmo número diferente — o mesmo tipo de divergência que o [ADR-0002](ADR-0002-contrato-de-dados-e-mapeamento.md) evita no contrato e que `domain/indicators.ts` evita no cálculo.

Formatar data é também um ponto de reincidência da armadilha **A-002**: `new Date('2026-08-06').toLocaleDateString('pt-BR')` imprime 05/08 em UTC-3. Espalhar essa conversão pelas telas é reintroduzir o defeito em cada uma.

As camadas listadas em `CLAUDE.md` não tinham lugar óbvio para isso. `domain/` é descrito como "regra e cálculo puros" — formatar não é nem regra nem cálculo; `components/` é apresentação, mas o que precisa ser compartilhado aqui são funções, não JSX.

## Decisão

Formatação de exibição vive em `src/lib/format.ts`: `formatCurrency`, `formatDate`, `formatPercent`, `formatNumber` e a constante `EMPTY_VALUE` (`—`). A camada não decide nada — recebe um valor já calculado e devolve o texto que aparece na tela. `formatDate` delega a conversão de data para `parseCalendarDate` de `domain/indicators.ts`, em vez de reimplementá-la.

A fronteira, em uma frase: **`domain/` decide, `lib/` só formata o que já foi decidido.** Se uma função em `lib/` precisar de uma regra de negócio para responder, ela está no lugar errado.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Pôr as funções em `domain/format.ts` | Tecnicamente puras, mas dilui a definição de `domain/` como o lugar das regras. Com o tempo, "é puro, então vai em domain" acaba trazendo lógica de apresentação para junto de RN01–RN09. |
| Formatar direto em cada página com `Intl` | É como o protótipo faz. Garante divergência entre telas e reincidência da A-002 a cada nova tela. |
| Um componente `<Currency>`/`<DateText>` por valor | Resolveria só JSX; `title`, `aria-label` e mensagens de texto continuariam sem formatação compartilhada. |

## Consequências

- Uma tela nova formata moeda, data e percentual sem decidir nada — e sem risco de reintroduzir a A-002.
- `EMPTY_VALUE` dá tratamento uniforme à ausência de valor, incluindo o consumo `null` de um projeto com `budget = 0` (RN07): a tela mostra "—", nunca `0%` nem `NaN`.
- Passa a existir uma pergunta a fazer em toda função nova: decide ou só formata? Erra-se para o lado de `domain/` quando houver dúvida.
- `formatCurrency` arredonda para reais inteiros, como o protótipo. Se alguma tela precisar de centavos, cria-se um formatador próprio em vez de mudar este e afetar todas as telas.
- Atualizado: `CLAUDE.md` (seção "Convenções de arquitetura", com `lib/` na lista de camadas). `context/` não é contrariado — não descreve organização de pastas do front.
