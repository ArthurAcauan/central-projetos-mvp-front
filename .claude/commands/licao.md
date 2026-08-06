---
description: Registra uma lição aprendida em docs/LESSONS.md
argument-hint: [o que aconteceu, em uma frase]
---

Registrar a lição: **$ARGUMENTS**

Antes de escrever, aplique o filtro. Uma lição entra em [docs/LESSONS.md](../../docs/LESSONS.md) apenas se as duas condições valem:

1. **Ia acontecer de novo** — é um padrão, não um acidente único.
2. **Não é óbvia lendo o código** — quem chegar depois não descobriria sozinho.

Se não passar no filtro, diga isso e não escreva nada. Arquivo de lições inflado deixa de ser lido.

Se já existe entrada cobrindo o mesmo assunto (inclusive nas armadilhas `A-nnn`), **atualize aquela** em vez de criar duplicata.

Formato da entrada, no topo da seção "Lições do projeto":

```markdown
**L-nnn — título curto** · área (indicadores, serviços, formulários, dashboard, processo, ferramental)
O que aconteceu, em uma ou duas frases concretas. Inclua o sintoma observado.
→ Como evitar da próxima vez. Se virou regra permanente, diga onde ela foi registrada.
```

Se a lição merece se tornar guardrail automático, diga qual: regra em `CLAUDE.md`, item no Definition of Done, teste obrigatório, ou hook em `.claude/hooks/`. Proponha — não implemente sem o usuário confirmar.
