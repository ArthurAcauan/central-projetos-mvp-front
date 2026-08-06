---
description: Aplica o Definition of Done, revisa e fecha uma tarefa do backlog
argument-hint: [id-da-tarefa, ex. F1-2]
---

Fechar a tarefa **$ARGUMENTS**. Este é um portão de qualidade: não declare concluído nada que não passou.

## 1. Verificações automáticas

Rode, na ordem, e mostre a saída real:

- `npm run typecheck`
- `npm run lint`
- `npm test` (se a tarefa envolve regra de negócio ou indicador, teste ausente **é falha**, não "não aplicável")

Se algum script ainda não existir no `package.json`, diga isso explicitamente — não substitua por um comando equivalente sem avisar.

Falhou algo? Corrija e rode de novo. Não siga para o passo 2 com verificação vermelha.

## 2. Revisão de escopo

Invoque o subagente `revisor-escopo` sobre o diff da tarefa. Trate cada achado marcado como `BLOQUEIA O FECHAMENTO`: corrija ou justifique com uma razão concreta.

## 3. Checklist manual

Confirme item por item, respondendo com evidência (arquivo/linha), não com "sim":

- [ ] Nenhum campo ou entidade novo além do modelo definido em `CLAUDE.md`
- [ ] Nenhum cálculo de indicador fora de `src/domain/indicators.ts`
- [ ] Nenhum `snake_case` fora de `src/services/`
- [ ] Literais de status/role exatos
- [ ] Nada da lista "fora de escopo" foi introduzido
- [ ] Telas com dados têm estado de carregando, vazio e erro

## 4. Atualizar a memória do projeto

- Marque o item como `[x]` em [docs/BACKLOG.md](../../docs/BACKLOG.md) e atualize a data do topo.
- Algo surpreendeu, quebrou de forma não óbvia ou custou retrabalho? Registre em [docs/LESSONS.md](../../docs/LESSONS.md) (formato `L-nnn`). Se foi só trabalho normal, não invente lição.
- Decisão estrutural tomada? Abra o ADR em [docs/decisions/](../../docs/decisions/) e atualize o índice.
- A decisão contradiz `context/`? Atualize o `.md` correspondente e o `CLAUDE.md` no mesmo commit.

## 5. Commit

Um commit com mensagem no formato:

```
<tipo>(<id>): <descrição curta>

<o que foi feito e por quê, se não for óbvio>
Requisito: RFnn
```

Não faça push nem abra PR sem o usuário pedir.

## 6. Relatório final

Feche com: o que ficou pronto, resultado real das verificações, o que **não** foi feito e por quê, e qual é o próximo item do backlog.
