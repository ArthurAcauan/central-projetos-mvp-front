# Lições Aprendidas e Armadilhas Conhecidas

Memória de erros do projeto. Objetivo: **o mesmo erro não custa duas vezes.**

Como usar:
- Antes de começar uma tarefa, leia as lições marcadas com a área que vai tocar.
- Ao terminar uma tarefa em que algo surpreendeu, registre com `/licao`.
- Uma lição vale a entrada aqui se: **ia acontecer de novo** e **não é óbvia lendo o código**.

Formato: `L-nnn — título` · área · o que aconteceu · como evitar.

---

## Armadilhas antecipadas (pré-carregadas, não aconteceram ainda)

Riscos previsíveis deste domínio e desta stack. Estão aqui porque são erros de alta probabilidade e baixa visibilidade — todos já viraram checagem no [Definition of Done](HARNESS.md#4-definition-of-done) ou teste obrigatório em F1-2.

**A-001 — `budget = 0` gera `Infinity`/`NaN` no percentual de consumo** · indicadores
`budget_spent / budget * 100` com `budget = 0` produz `Infinity` (ou `NaN` se ambos são 0), que vaza para a tela como "∞%" e quebra o eixo do gráfico Recharts.
→ `budgetConsumptionPercent` deve retornar `null` quando `budget <= 0`, e a UI decide como exibir ("—"). Formalizado como **RN07**. Teste obrigatório em F1-2, e um projeto com `budget = 0` no seed de F1-4.
**Confirmado:** o protótipo contém o defeito em `prototype/**/src/pages/Dashboard.tsx` — `(totalSpent / totalBudget) * 100` e `(p.budget_spent / p.budget) * 100`, ambos sem guarda.

**A-002 — "Projeto atrasado" erra por um dia (fuso horário)** · indicadores, datas
`deadline` é `DATE` (sem hora). Comparar `new Date(deadline) < new Date()` interpreta a string ISO como UTC e, em UTC-3, um projeto que vence hoje aparece como atrasado.
→ Comparar sempre em data de calendário local normalizada (zerar hora dos dois lados). Formalizado como **RN08**. Testar com um `deadline` igual a hoje.
**Confirmado:** o protótipo contém o defeito — `new Date(p.deadline) < today`, onde `today` carrega a hora atual.

**A-003 — Bloquear `budget_spent > budget` na validação** · formulários, RN03
O reflexo natural é validar "consumido não pode passar do previsto". A regra RN03 diz o oposto: o estouro **deve** ser possível para o dashboard evidenciar.
→ Estouro é aviso visual, nunca erro de formulário que impede salvar.

**A-004 — Casing do contrato divergente** · serviços, tipos
A modelagem usa `snake_case` (`budget_spent`), mas um trecho dos requisitos escreve `budgetSpent`. Se cada tela adivinhar, a troca do mock pela API real (F5-1) quebra em vários pontos.
→ Um único ponto de mapeamento em `services/`. Componentes e páginas usam apenas o tipo de domínio. Ver [ADR-0002](decisions/ADR-0002-contrato-de-dados-e-mapeamento.md).

**A-005 — Cálculo de indicador duplicado em cada tela** · arquitetura
Dashboard, lista e detalhes precisam dos mesmos indicadores. Reimplementar em cada um faz as telas discordarem entre si — e o bug aparece só na demonstração.
→ `src/domain/indicators.ts` é a única fonte. Duplicação é item de rejeição no DoD.

**A-006 — Gráfico Recharts com dados vazios** · dashboard
Sem projetos cadastrados (ou com filtro que zera o resultado), os gráficos renderizam eixos vazios ou quebram ao calcular domínio.
→ Estado vazio explícito antes de renderizar o gráfico.

**A-007 — Escopo crescendo por conta própria** · processo
O pedido "cadastro de usuário com perfil de acesso" (RF01) puxa naturalmente para login, sessão e RBAC — todos fora do MVP. `role` aqui é campo cadastral.
→ Usuário logado é simulado. `scope-guard.mjs` nega pacotes de auth; o revisor de escopo confere o diff.

**A-008 — Encoding em arquivos gerados via PowerShell** · ferramental, Windows
`Set-Content`/`Add-Content` usam a codepage ANSI por padrão; textos em português saem corrompidos (`Ã§`).
→ Escrever arquivos com as ferramentas de edição (UTF-8) ou passar `-Encoding utf8` explicitamente.

---

## Lições do projeto

<!-- Novas entradas entram aqui, mais recente no topo. Use /licao. -->

**L-004 — o hook de carga não pode chamar `setState` no corpo do efeito** · hooks, ferramental
Em F2-1, `useProjectsList` seguiu o padrão comum — `setIsLoading(true)` e `setError(null)` no início do `useEffect`, antes de disparar as chamadas. O lint reprovou com `react-hooks/set-state-in-effect` (regra do React Compiler, ativa neste projeto): `setState` síncrono dentro do efeito causa renderização em cascata. O sintoma engana porque o código funciona e os testes passam — quebra só no `npm run lint`, ou seja, no portão de fechamento, depois da tela pronta.
→ Guarde os três estados em **um** valor discriminado (`{ status: 'loading' } | { status: 'ready', ... } | { status: 'error', message }`), com `loading` como estado inicial. O efeito só chama `setState` dentro do `.then`/`.catch` (já é microtask, a regra não se aplica), e voltar para `loading` no recarregar acontece no *handler* do botão, não no efeito. Ganho de brinde: fica impossível a tela exibir tabela e erro ao mesmo tempo. O modelo está em `src/hooks/useProjectsList.ts` — copie a forma nos hooks de carga de F2-2 em diante. Mantenha também a flag `active` no cleanup: o `AbortController` sozinho não basta, porque a camada mock ignora `options.signal`.

**L-003 — `format:check` reprova o repositório inteiro por causa de CRLF** · ferramental, Windows
Em F0-2, `npm run format:check` acusou 15 arquivos fora do padrão — inclusive `package.json` e `tsconfig.json`, que ninguém havia tocado. O sintoma engana: parece dívida de formatação acumulada, e o reflexo é rodar `npm run format` e commitar um diff gigante. A causa é única e de configuração: o Git for Windows vem com `core.autocrlf=true` e converte LF→CRLF no checkout, enquanto o Prettier usa `endOfLine: "lf"` por padrão. O conteúdo estava correto o tempo todo — `prettier --check --end-of-line auto .` passava limpo.
→ Corrigido com `.gitattributes` (`* text=auto eol=lf`, mais `binary` para os `.docx`/`.pdf`/`.png` imutáveis de `context/`), mantendo o Prettier estrito em vez de afrouxar para `endOfLine: "auto"`. Antes de tratar falha em massa de `format:check` como dívida real, rode `prettier --check --end-of-line auto .`: se passar, é fim de linha, não formatação. Aparentado com **A-008** — a mesma classe de armadilha de ferramental no Windows.

**L-001 — `typescript@latest` quebra o `typescript-eslint`** · ferramental
No scaffold (F0-1), instalar `typescript@latest` trouxe a versão 7, e o `npm install` falhou com `ERESOLVE`: o `typescript-eslint` 8 declara peer `typescript >=4.8.4 <6.1.0`. O sintoma é um erro de árvore de dependências que tenta empurrar `--force`/`--legacy-peer-deps` como solução.
→ O TypeScript está fixado em `~5.9` no `package.json`. **Não** resolva conflito de peer com `--force` ou `--legacy-peer-deps`: isso instala uma combinação que o lint não suporta e o erro reaparece depois, disfarçado. Só suba para TS 7 quando o `typescript-eslint` declarar suporte.

**L-002 — o protótipo é referência visual, não fonte de lógica** · processo, arquitetura
O protótipo do Figma Make resolve o visual muito bem, mas calcula indicadores dentro dos componentes, navega por `useState` em vez de rotas, usa `snake_case` no tipo de domínio e contém os defeitos A-001 e A-002.
→ Portar layout, cores, textos e formatação. **Não** portar lógica: indicadores vão para `domain/`, navegação para React Router, contrato para `services/`. Antes de copiar um trecho do protótipo, confira contra as armadilhas conhecidas.
