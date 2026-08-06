---
description: Inicia uma tarefa do backlog com contexto, plano e branch
argument-hint: [id-da-tarefa, ex. F1-2]
---

Iniciar a tarefa **$ARGUMENTS** do backlog do frontend PF2.

Siga exatamente esta sequência:

1. **Localize a tarefa** em [docs/BACKLOG.md](../../docs/BACKLOG.md). Se o ID não existir, liste os IDs disponíveis da fase atual e pare.

2. **Carregue o contexto mínimo:**
   - O item do backlog: objetivo, requisito funcional (RF) associado e critério de "pronto quando".
   - [docs/LESSONS.md](../../docs/LESSONS.md): as armadilhas que tocam a área desta tarefa.
   - Os ADRs em [docs/decisions/](../../docs/decisions/) que afetam as camadas envolvidas.
   - Só então leia o código existente que a tarefa vai tocar. Não leia o projeto inteiro.

3. **Confirme as dependências.** Se a tarefa depende de item anterior não concluído, diga qual e pare — não improvise a dependência.

4. **Branch.** Se estiver em `main`, crie `feat/<id-em-minusculo>-<slug-curto>`. Se já estiver em um branch de feature diferente desta tarefa, avise antes de continuar.

5. **Plano.** Se a tarefa toca 3+ arquivos, cria camada nova ou muda contrato de dados: entre em plan mode e só implemente após aprovação. Caso contrário, apresente em 3–5 linhas o que vai fazer e siga.

6. **Implemente** respeitando as camadas (`services/` fala HTTP, `domain/` calcula regra pura sem React, `hooks/` orquestra, `pages/`+`components/` apresentam). Escreva o teste junto quando a tarefa envolve regra de negócio ou indicador.

Ao terminar, não feche por conta própria: peça para rodar `/fechar-tarefa $ARGUMENTS`.
