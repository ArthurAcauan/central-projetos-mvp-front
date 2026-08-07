# ADR-0008 — A camada mock passa a servir respostas reais gravadas

- **Status:** Aceito · revisa a premissa do [ADR-0001](ADR-0001-mock-primeiro.md)
- **Data:** 2026-08-07
- **Afeta:** `services/mock/`, `.env.example`, demonstração sem backend

## Contexto

O ADR-0001 criou a camada mock com uma premissa explícita: **"enquanto o backend
não existe"**. O backend agora existe, e a premissa caiu.

Manter o mock como estava seria pior do que não ter: com o ADR-0007, os
indicadores passaram a ser do backend, e um seed que os calculasse aqui traria de
volta exatamente a divergência que o ADR-0007 eliminou — duas implementações de
"está atrasado", uma delas escondida em `services/mock/`, onde ninguém procura
quando o número da tela não bate.

Por outro lado, o que o ADR-0001 comprou continua valendo: rodar o front sem
subir a API, e exercitar os estados de lista vazia e de erro sem derrubar nada.
O banco é Neon free tier e hiberna; uma demonstração acadêmica que dependa da
instância acordar é uma aposta desnecessária.

## Decisão

O mock deixa de gerar dados e passa a servir **respostas capturadas da API real**
(`services/mock/fixtures.ts`), com o backend rodando sobre `npm run db:seed`.
Os indicadores vêm gravados na captura, então não há regra reimplementada.

A camada devolve **DTO**, não domínio: os mesmos mapeadores de `services/` que
traduzem a resposta real traduzem a fixture. Isso fecha o caminho para a fixture
divergir do contrato em silêncio — se o DTO mudar, o build quebra nos dois.

`VITE_USE_MOCK` inverte o padrão: agora só `="true"` liga a fixture. Integrar com
a API é o estado normal do projeto desde F5-1.

Sobra uma exceção, contida e rotulada: **cadastrar e editar dentro da fixture**
precisa devolver indicadores para o formulário não exibir campos vazios depois de
salvar. Esses indicadores são uma aproximação declarada em `store.ts`, nunca
importada por `domain/` nem por uma tela, e deixa de fora justamente a regra mais
sujeita a divergir — `projeto_atrasado` é sempre `false` ali.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Aposentar o mock de vez | Perde a demonstração sem backend bem antes da defesa acadêmica, e os cenários `vazio` e `erro` junto. Custo alto para um ganho de arrumação. |
| Manter o seed gerando dados e calculando indicadores | Reintroduz a divergência que o ADR-0007 eliminou, no lugar onde ela seria mais difícil de encontrar. |
| Mock devolvendo domínio, como antes | A fixture teria caminho de conversão próprio, livre para divergir do contrato sem quebrar nada. |

## Consequências

- As datas da fixture são **absolutas**, não relativas a hoje. Diferente do seed
  anterior, elas não acompanham o relógio — mas os indicadores vieram gravados
  junto, então o projeto atrasado continua marcado como atrasado. Só a data
  exibida envelhece.
- Atualizar a fixture é recapturar, não editar. Editar um valor de indicador à
  mão recria o problema que este ADR resolve; o cabeçalho de `fixtures.ts` diz
  isso.
- Um clone novo **precisa** de `.env` apontando para a API. Sem ele, a chamada
  falha com o erro de configuração explícito de `services/http.ts`, que já
  existia para esse caso.
- Os testes não dependem da fixture: eles mockam `services/*` diretamente.
  `store.test.ts` verifica outra coisa — que a fixture cobre os casos visuais que
  a demonstração precisa mostrar.
