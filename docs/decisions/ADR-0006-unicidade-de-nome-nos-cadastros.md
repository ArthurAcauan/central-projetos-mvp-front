# ADR-0006 — Nome único em clientes e equipes

- **Status:** Aceito
- **Data:** 2026-08-07
- **Afeta:** `domain/registryRules.ts`, telas de clientes e equipes, RF02, RF08, modelo de dados (`clients`, `teams`)

## Contexto

A modelagem (`context/04_modelagem_dados_e_banco.md`) declara **uma** restrição de
unicidade: `users.email` é `NOT NULL, UNIQUE`. Não há `UNIQUE` em `clients.name`
nem em `teams.name`.

Na Fase 3 as telas de cadastro passaram a recusar nome repetido nos três
cadastros. Para `users.email` isso apenas reflete a modelagem. Para cliente e
equipe é regra nova, e o revisor de escopo apontou corretamente que não tinha
respaldo em `context/` nem em RN01–RN09.

O fato que forçou a decisão vem do RF08. O dashboard agrega projetos por cliente
(`aggregateByClient` em `domain/indicators.ts`) usando o **nome** como rótulo do
eixo. Dois clientes distintos chamados "Alfa Logística" produzem duas barras com
o mesmo rótulo e valores diferentes — o gráfico fica não só feio, mas
*enganoso*: o gestor lê dois números onde deveria ler um, e não tem como saber
qual é qual. O mesmo vale para o `<select>` de cliente no cadastro de projeto
(RN06), em que a escolha é feita pelo nome e a diferença entre as duas opções é
invisível.

O nome é, nesses dois cadastros, a única propriedade que os distingue: a
modelagem restringe ambos a `id` + `name` + timestamps, e o próprio spec pede
para não acrescentar campo sem necessidade funcional comprovada.

## Decisão

Cliente e equipe **não** podem ser cadastrados com nome já existente. A
comparação ignora caixa, acento e espaço nas pontas — "alfa logistica" e "Alfa
Logística" são o mesmo cliente para quem lê o gráfico.

A verificação vive em `domain/registryRules.ts` e é feita contra a lista já
carregada na tela. Ela **não** substitui uma restrição de banco: se duas pessoas
cadastrarem ao mesmo tempo, os dois passam. O backend continua sendo a
autoridade, e o erro dele chega como `HttpError` na tela como qualquer outro.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Não verificar nada (seguir a modelagem ao pé da letra) | Deixa o RF08 produzir gráfico ambíguo, que é justamente o que o projeto existe para evitar. O defeito só apareceria na demonstração. |
| Avisar sem bloquear, como no estouro de orçamento (RN03) | O estouro é um **fato do negócio** que precisa ser registrado e evidenciado. Cliente duplicado não é fato do negócio, é erro de digitação — não há leitura útil de "dois clientes com o mesmo nome". |
| Desambiguar no gráfico (ex.: "Alfa Logística (2)") | Trata o sintoma e empurra o problema para todas as telas que exibem o nome: select de projeto, lista, detalhes. Mais código e nenhuma delas fica boa. |
| Adicionar CNPJ ou código ao cliente para distinguir | Campo novo sem necessidade funcional comprovada — proibido pelo spec, e o MVP não coleta esse dado. |

## Consequências

- O agregado por cliente do RF08 fica legível sem tratamento especial, e o
  `<select>` de cliente do cadastro de projeto passa a ter opções distinguíveis.
- Passa a existir uma regra de front sem espelho no banco. Fica registrado como
  pendência de backend: **`clients.name` e `teams.name` deveriam receber
  `UNIQUE`** no repositório da API. Enquanto não receberem, a verificação do
  front é conveniência, não garantia — e o código diz isso explicitamente.
- Renomear um cliente para um nome já usado não é tratado, porque **não há
  edição de cliente nem de equipe no escopo do MVP**. Se a edição entrar, a
  verificação precisa excluir o próprio registro da comparação.
- A comparação insensível a acento recusa cadastros que o banco aceitaria. É
  intencional: a diferença entre "Alfa Logistica" e "Alfa Logística" não é
  legível em um eixo de gráfico.
- Atualizar: `context/04_modelagem_dados_e_banco.md` (nota sobre a unicidade
  esperada) e `CLAUDE.md` (regras que afetam validação).
