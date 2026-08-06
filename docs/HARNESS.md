# Harness de Desenvolvimento

Como este projeto é construído com apoio de IA sem perder controle de escopo, qualidade e rastreabilidade. Este arquivo descreve o **processo**; `CLAUDE.md` descreve as **regras** que a IA carrega automaticamente.

## 1. Camadas do harness

| Camada | Onde | O que faz |
|---|---|---|
| Especificação | [context/](../context/) | Fonte da verdade (RFs, arquitetura, modelo de dados). Prescritiva. |
| Regras sempre ativas | [CLAUDE.md](../CLAUDE.md) | Carregado em toda sessão: stack, campos, regras de negócio, o que não construir. |
| Guardrails automáticos | [.claude/hooks/](../.claude/hooks/) | Bloqueiam/avisam antes do erro acontecer (ver §3). |
| Revisores | [.claude/agents/](../.claude/agents/) | Revisão independente de escopo e de qualidade de front. |
| Rituais | [.claude/commands/](../.claude/commands/) | `/tarefa`, `/fechar-tarefa`, `/licao` — sempre o mesmo caminho. |
| Memória do projeto | [docs/LESSONS.md](LESSONS.md), [docs/decisions/](decisions/) | Erros não se repetem; decisões não se perdem. |
| Plano | [docs/BACKLOG.md](BACKLOG.md) | Fatias pequenas, rastreadas até os RFs. |

## 2. Ciclo de uma tarefa

Uma tarefa = um item do backlog = um branch = uma entrega verificável.

```
/tarefa F1-2
  ↓  ler o item no BACKLOG + LESSONS relacionadas
  ↓  plan mode se toca mais de 2 arquivos → aprovar plano antes de codar
  ↓  implementar (hooks rodam typecheck/lint a cada edição)
  ↓  testes das regras de negócio quando a tarefa tem regra
/fechar-tarefa F1-2
  ↓  typecheck + lint + testes + revisor de escopo
  ↓  atualizar BACKLOG (status) e LESSONS (se algo surpreendeu)
  ↓  commit
```

Regras do ciclo:

- **Uma fatia por vez.** Se durante a tarefa aparecer outra necessidade, ela vira item novo no backlog — não entra no branch atual.
- **Plan mode para o que é estrutural.** Toda tarefa que cria uma camada nova, muda contrato de dados ou toca 3+ arquivos começa com plano aprovado.
- **Nada de "aproveitar que estou aqui".** Refactor oportunista fora do escopo da fatia é o principal vetor de regressão em projeto assistido por IA.

## 3. Guardrails automáticos ativos

Configurados em [.claude/settings.json](../.claude/settings.json), implementados em `.claude/hooks/`:

| Hook | Gatilho | Comportamento |
|---|---|---|
| `guard-context.mjs` | Write/Edit em `context/*.docx|pdf` | **Nega.** As fontes originais do PF2 são imutáveis; edite o `.md` equivalente. |
| `scope-guard.mjs` | `npm/yarn/pnpm install <pkg>` | **Nega** pacotes de fora do MVP (auth real, BI, backends-as-a-service). **Pergunta** em pacotes fora da stack aprovada. |
| `check-src.mjs` | Após editar `src/**/*.ts(x)` | Roda `tsc --noEmit` + `eslint` no arquivo e devolve os erros para correção imediata. Silencioso até existir `package.json` + `node_modules`. |

Para revisar, editar ou desativar: `/hooks`. Se um hook não disparar na primeira sessão, abra `/hooks` uma vez (recarrega a config) — o diretório `.claude/` não existia quando esta sessão começou.

## 4. Definition of Done

Uma tarefa só fecha quando **todos** os itens valem:

- [ ] `npm run typecheck` sem erros
- [ ] `npm run lint` sem erros
- [ ] `npm test` verde — obrigatório quando a tarefa envolve regra de negócio (RN01–RN06) ou indicador derivado
- [ ] Nenhum campo/tabela novo sem necessidade funcional comprovada
- [ ] Nada da lista "fora de escopo" foi introduzido (`/checar-escopo` ou revisor-escopo)
- [ ] Cálculo de indicador não foi duplicado — vive só em `src/domain/indicators.ts`
- [ ] Item marcado no [BACKLOG](BACKLOG.md); decisão estrutural virou ADR; surpresa virou lição em [LESSONS](LESSONS.md)

## 5. Como pedir bem (padrão de prompt)

O harness reduz erro, mas o prompt define o resultado. Formato que funciona aqui:

> Tarefa **F2-1** do backlog. Objetivo: lista de projetos com filtros por status e cliente (RF04).
> Restrições: seguir o layout de `prototype/**/src/pages/Projects.tsx`, usar `services/projects` já existente, indicadores só via `domain/indicators`.
> Pronto quando: filtros funcionam com dados mock, estado vazio tratado, typecheck/lint/test verdes.

Três elementos: **qual fatia**, **quais restrições**, **como sei que acabou**. Sem o terceiro, a IA decide sozinha onde parar.

## 6. Sinais de que o harness está sendo furado

Pare e corrija o processo, não só o código, quando:

- Um PR/commit toca mais de ~6 arquivos sem ser scaffold.
- Apareceu um cálculo de "% consumido" ou "está atrasado" fora de `domain/indicators.ts`.
- Uma tela passou a chamar `fetch`/`axios` direto, sem `services/`.
- Um item de "fora de escopo" ganhou justificativa criativa (auth "só simulada mas com token", BI "só um iframe").
- O backlog está desatualizado em relação ao que existe em `src/`.
