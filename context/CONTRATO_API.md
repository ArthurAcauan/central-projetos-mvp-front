# Contrato da API — Central de Projetos (PF2)

Documento de integração para o **frontend**. É autocontido: copie este arquivo para o repositório do front e trate-o como a fonte da verdade do contrato. Todos os exemplos foram capturados de respostas reais da API rodando contra o banco, não escritos de memória.

**Versão do contrato:** 1.0 · **Backend:** MVP completo (RF01–RF09) · **Atualizado em:** 2026-08-07

---

## Sumário

- [1. Como subir o backend](#1-como-subir-o-backend)
- [2. Convenções que valem para tudo](#2-convenções-que-valem-para-tudo)
- [3. Tipos TypeScript](#3-tipos-typescript-prontos-para-colar)
- [4. Endpoints](#4-endpoints)
- [5. Erros](#5-erros)
- [6. Regras de negócio que o front precisa respeitar](#6-regras-de-negócio-que-o-front-precisa-respeitar)
- [7. Armadilhas](#7-armadilhas-leia-antes-de-codar)
- [8. O que a API não faz](#8-o-que-a-api-não-faz)
- [9. Cliente HTTP sugerido](#9-cliente-http-sugerido)
- [10. Roteiro de teste da integração](#10-roteiro-de-teste-da-integração)

---

## 1. Como subir o backend

```bash
git clone https://github.com/ArthurAcauan/central-projetos-mvp-back.git
cd central-projetos-mvp-back
npm install
cp .env.example .env        # preencher DATABASE_URL
npx prisma migrate dev      # cria as tabelas
npm run db:seed             # popula dados de demonstração
npm run dev                 # API em http://localhost:3333
```

**Base URL de desenvolvimento:** `http://localhost:3333`

A porta é **3333**, não 3000 — a 3000 está ocupada por outro serviço na máquina de desenvolvimento.

```bash
curl http://localhost:3333/health
# {"status":"ok","servico":"central-projetos-mvp-back"}
```

### CORS

Já configurado. Por padrão o backend autoriza `http://localhost:5173` (Vite) e `http://localhost:3000` (CRA). Se o front subir em outra porta, ajuste no `.env` do **backend**:

```env
CORS_ORIGIN="http://localhost:5173,http://localhost:4200"
```

Headers liberados: `Content-Type` e `x-user-id`. Métodos: `GET`, `POST`, `PUT`, `OPTIONS`.

> Se aparecer erro de CORS no console, verifique **primeiro** se a porta do front está na lista. A mensagem do navegador não diz qual configuração falta.

### Dados de demonstração

`npm run db:seed` cria 5 usuários, 4 clientes, 4 equipes e 10 projetos, cobrindo todos os casos visuais que o front precisa renderizar: projeto atrasado, orçamento estourado, consumo elevado, orçamento zero, prazo vencendo hoje, concluído e cancelado.

É idempotente — rodar de novo não duplica nada. Os prazos são calculados a partir do dia da execução, então os casos continuam válidos independentemente de quando você rodar.

---

## 2. Convenções que valem para tudo

| Assunto | Regra |
|---|---|
| Formato | JSON em requisição e resposta. `Content-Type: application/json` obrigatório no `POST`/`PUT` |
| Idioma | **Campo em inglês espelha coluna do banco; campo em português é valor derivado.** `deadline` vem do banco, `projeto_atrasado` é calculado a cada resposta |
| Datas de negócio | `start_date` e `deadline` são **`"AAAA-MM-DD"`**, string pura, sem hora nem fuso |
| Datas de auditoria | `created_at` e `updated_at` são ISO completo (`"2026-08-07T16:29:14.978Z"`) |
| Dinheiro e horas | **`number`**, nunca string. `budget`, `budget_spent`, `hours_worked` |
| Identificadores | UUID v4 em string |
| Listas | Array JSON **puro**, sem envelope. Não existe `{ data: [...] }` nem paginação |

### Identidade do usuário (simulada)

O MVP **não tem autenticação**. A identidade vai em um header opcional:

```http
x-user-id: d3cc9562-984a-4174-a20b-1f3af7c2324c
```

- Sem o header, a requisição segue como anônima e **funciona normalmente** — nenhum endpoint exige identidade hoje.
- Com o header malformado (não-UUID), a resposta é `400`.
- Não há verificação: qualquer cliente pode se declarar qualquer usuário.

**Implicação para o front:** não construa tela de login nem fluxo de sessão. Se precisar simular "usuário logado", escolha um `id` da lista de `GET /users` e envie no header. Nenhuma resposta muda em função de quem chama.

---

## 3. Tipos TypeScript (prontos para colar)

```ts
// ---------- Domínio ----------

export type StatusProjeto =
  | 'PLANEJAMENTO'
  | 'EM_ANDAMENTO'
  | 'EM_RISCO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type RoleUsuario = 'GERENTE' | 'COORDENADOR' | 'GESTOR_PROJETO';

export type MotivoDeAtencao = 'ATRASADO' | 'ORCAMENTO_EXCEDIDO' | 'CONSUMO_ELEVADO';

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: RoleUsuario;
  created_at: string;          // ISO
}

export interface Cliente {
  id: string;
  name: string;
  created_at: string;          // ISO
  updated_at: string;          // ISO
}

export interface Equipe {
  id: string;
  name: string;
  created_at: string;          // ISO
}

/** Relação resolvida dentro do projeto. */
export interface Relacionado {
  id: string;
  name: string;
}

// ---------- Indicadores (sempre calculados, nunca persistidos) ----------

export interface Indicadores {
  /** null quando budget = 0 — "não calculável", não zero. */
  consumo_orcamento_percentual: number | null;
  projeto_atrasado: boolean;
  orcamento_excedido: boolean;
  /** consumo >= 90% */
  consumo_elevado: boolean;
  /** true se qualquer um dos três acima, exceto em projeto encerrado. */
  em_atencao: boolean;
  motivos_de_atencao: MotivoDeAtencao[];
}

// ---------- Projeto ----------

export interface ProjetoResumo {
  id: string;
  name: string;
  /** Tipado como string, não StatusProjeto — ver "Armadilhas", item 5. */
  status: string;
  start_date: string;          // "AAAA-MM-DD"
  deadline: string;            // "AAAA-MM-DD"
  budget: number;
  budget_spent: number;
  hours_worked: number;
  client: Relacionado;
  manager: Relacionado;
  team: Relacionado;
  indicadores: Indicadores;
}

export interface ProjetoDetalhado extends ProjetoResumo {
  objective: string;
  observations: string | null;
  created_at: string;          // ISO
  updated_at: string;          // ISO
}

// ---------- Dashboard ----------

export interface ContagemPorStatus {
  status: string;
  total: number;
}

export interface ContagemPorCliente {
  client_id: string;
  client_name: string;
  total: number;
}

export interface Dashboard {
  /** Dia usado como referência do cálculo de atraso, "AAAA-MM-DD". */
  gerado_em: string;
  total_projetos: number;
  /** Sempre os 5 status canônicos, inclusive zerados. */
  projetos_por_status: ContagemPorStatus[];
  /** Só clientes com ao menos um projeto, do mais carregado ao menos. */
  projetos_por_cliente: ContagemPorCliente[];
  orcamento: {
    total: number;
    consumido: number;
    /** Pode ser negativo — é a evidência do estouro, não um bug. */
    saldo: number;
    consumo_percentual: number | null;
  };
  horas_realizadas: number;
  /** Contagem do STATUS 'EM_RISCO' — julgamento manual do gestor. */
  projetos_status_em_risco: number;
  projetos_atrasados: number;
  projetos_com_orcamento_excedido: number;
  /** Derivado. NUNCA some com projetos_status_em_risco — ver "Armadilhas", item 1. */
  projetos_em_atencao: number;
}

// ---------- Payloads ----------

export interface CriarUsuario {
  name: string;                // 1–100 caracteres
  email: string;               // ≤150, único, normalizado para minúsculas
  role: RoleUsuario;
}

export interface CriarCliente {
  name: string;                // 1–150, único ignorando caixa
}

export interface CriarEquipe {
  name: string;                // 1–100, único ignorando caixa
}

export interface CriarProjeto {
  name: string;                // 1–150
  client_id: string;           // UUID existente
  objective: string;           // obrigatório, sem limite prático
  manager_id: string;          // UUID existente
  team_id: string;             // UUID existente
  start_date: string;          // "AAAA-MM-DD"
  deadline: string;            // "AAAA-MM-DD", >= start_date
  budget: number;              // >= 0, máx. 2 casas
  status: StatusProjeto;
  budget_spent?: number;       // opcional na criação, padrão 0
  hours_worked?: number;       // opcional na criação, padrão 0
  observations?: string | null;
}

/** No PUT, budget_spent e hours_worked são OBRIGATÓRIOS. */
export interface AtualizarProjeto extends Omit<CriarProjeto, 'budget_spent' | 'hours_worked'> {
  budget_spent: number;
  hours_worked: number;
}

// ---------- Erro ----------

export interface ErroDaApi {
  erro: string;
  /** Presente apenas em erro de validação (400). */
  detalhes?: string[];
}
```

---

## 4. Endpoints

| Método | Rota | Sucesso | Descrição |
|---|---|---|---|
| `GET` | `/health` | 200 | Verifica se a API está de pé |
| `POST` | `/users` | 201 | Cadastra usuário |
| `GET` | `/users` | 200 | Lista usuários, ordenados por nome |
| `POST` | `/clients` | 201 | Cadastra cliente |
| `GET` | `/clients` | 200 | Lista clientes, ordenados por nome |
| `POST` | `/teams` | 201 | Cadastra equipe |
| `GET` | `/teams` | 200 | Lista equipes, ordenadas por nome |
| `POST` | `/projects` | 201 | Cadastra projeto |
| `GET` | `/projects` | 200 | Lista projetos por prazo crescente |
| `GET` | `/projects/attention` | 200 | Projetos que pedem atenção |
| `GET` | `/projects/:id` | 200 | Detalhe do projeto |
| `PUT` | `/projects/:id` | 200 | Atualiza o projeto |
| `GET` | `/dashboard` | 200 | Painel consolidado |

---

### `POST /users`

```json
{ "name": "Ana Souza", "email": "ana.souza@exemplo.com", "role": "GERENTE" }
```

**201** — devolve o registro criado:

```json
{
  "id": "d3cc9562-984a-4174-a20b-1f3af7c2324c",
  "name": "Ana Souza",
  "email": "ana.souza@exemplo.com",
  "role": "GERENTE",
  "created_at": "2026-08-06T18:33:45.537Z"
}
```

E-mail duplicado responde **409**. O e-mail é aparado e normalizado para minúsculas antes da checagem: `Ana@X.com` e `ana@x.com` são o mesmo usuário.

### `GET /users`

**200** — array de `Usuario`, ordenado por nome.

---

### `POST /clients` · `GET /clients`

```json
{ "name": "Acme Industria" }
```

**201**:

```json
{
  "id": "d38b1bc3-6788-4809-be42-4c6f251427af",
  "name": "Acme Industria",
  "created_at": "2026-08-06T18:33:45.827Z",
  "updated_at": "2026-08-06T18:33:45.827Z"
}
```

Nome duplicado **ignorando caixa** responde **409** — `"ACME INDUSTRIA"` colide com `"Acme Industria"`. A regra existe porque duplicata fragmentaria a contagem "projetos por cliente" do dashboard em duas linhas parciais.

### `POST /teams` · `GET /teams`

Idêntico a clientes, sem `updated_at`:

```json
{ "id": "b5812071-...", "name": "Squad Alpha", "created_at": "2026-08-06T18:33:46.114Z" }
```

---

### `POST /projects`

```json
{
  "name": "Portal do Cliente",
  "client_id": "d38b1bc3-6788-4809-be42-4c6f251427af",
  "manager_id": "d3cc9562-984a-4174-a20b-1f3af7c2324c",
  "team_id": "b5812071-213f-482f-9be5-87e737afeabe",
  "objective": "Centralizar o atendimento em um único canal",
  "start_date": "2026-01-15",
  "deadline": "2026-06-30",
  "budget": 250000,
  "budget_spent": 120000.5,
  "hours_worked": 340.25,
  "status": "EM_ANDAMENTO",
  "observations": null
}
```

**201** — devolve `ProjetoDetalhado`, já com `indicadores`.

Limites que o front deve validar antes de enviar, para não depender do 400:

| Campo | Limite |
|---|---|
| `name` | 1–150 caracteres |
| `budget`, `budget_spent` | 0 a 9.999.999.999.999,99 · máx. 2 casas decimais |
| `hours_worked` | 0 a 99.999.999,99 · máx. 2 casas decimais |
| `deadline` | igual ou posterior a `start_date` |
| `objective` | não pode ser vazio nem só espaços |

### `GET /projects`

Filtros opcionais, combináveis:

```
GET /projects?status=EM_RISCO
GET /projects?client_id=d38b1bc3-6788-4809-be42-4c6f251427af
GET /projects?status=EM_RISCO&client_id=d38b1bc3-...
```

**200** — array de `ProjetoResumo`, **ordenado por prazo crescente** (o que vence antes vem primeiro):

```json
[
  {
    "id": "b236a726-59da-4b55-9bf5-ec2b4dae32a1",
    "name": "Portal do Cliente",
    "status": "EM_RISCO",
    "start_date": "2026-01-15",
    "deadline": "2026-06-30",
    "budget": 250000,
    "budget_spent": 180000,
    "hours_worked": 500,
    "client": { "id": "d38b1bc3-...", "name": "Acme Industria" },
    "manager": { "id": "d3cc9562-...", "name": "Ana Souza" },
    "team": { "id": "b5812071-...", "name": "Squad Alpha" },
    "indicadores": {
      "consumo_orcamento_percentual": 72,
      "projeto_atrasado": true,
      "orcamento_excedido": false,
      "consumo_elevado": false,
      "em_atencao": true,
      "motivos_de_atencao": ["ATRASADO"]
    }
  }
]
```

> **Filtro digitado errado é 400, não silêncio.** `?statis=EM_RISCO` responde `400 Chave desconhecida: "statis"`. É proposital: filtro descartado em silêncio devolveria a carteira inteira com aparência de lista filtrada.

### `GET /projects/attention`

Sem parâmetros. **200** — array de `ProjetoResumo` em que `indicadores.em_atencao` é `true`, na mesma ordem de prazo. É o recorte pronto para a tela de alertas; `motivos_de_atencao` diz por que cada um entrou.

### `GET /projects/:id`

**200** — `ProjetoDetalhado` (tudo do resumo, mais `objective`, `observations`, `created_at`, `updated_at`):

```json
{
  "id": "8a099bc4-30bc-4f26-bb88-be78ce6d531b",
  "name": "Migracao do Data Lake",
  "status": "EM_RISCO",
  "start_date": "2026-06-23",
  "deadline": "2026-10-06",
  "budget": 750000,
  "budget_spent": 690000,
  "hours_worked": 1560,
  "client": { "id": "1db44143-...", "name": "Banco Cordilheira" },
  "manager": { "id": "c2cc1dd6-...", "name": "Rafael Nunes" },
  "team": { "id": "5b2b7bff-...", "name": "Squad Dados" },
  "indicadores": {
    "consumo_orcamento_percentual": 92,
    "projeto_atrasado": false,
    "orcamento_excedido": false,
    "consumo_elevado": true,
    "em_atencao": true,
    "motivos_de_atencao": ["CONSUMO_ELEVADO"]
  },
  "objective": "Migrar o repositório analítico para nuvem, encerrando o contrato de datacenter que vence no fim do ano.",
  "observations": "Volume de dados 30% acima do levantado na proposta.",
  "created_at": "2026-08-07T16:29:14.978Z",
  "updated_at": "2026-08-07T16:29:14.978Z"
}
```

Id inexistente → **404**. Id malformado → **400**.

### `PUT /projects/:id`

**Recebe a representação completa do projeto**, não um patch. Todos os campos de `CriarProjeto` são obrigatórios, **mais** `budget_spent` e `hours_worked`, que aqui não têm padrão.

**Por que isso importa para o front:** os dois valores são **acumulados**, não incrementos. O `PUT` substitui o recurso. Se o formulário omitir `budget_spent`, o backend responde 400 — de propósito. Se ele tivesse padrão zero, a omissão zeraria o consumo do projeto e a perda só apareceria no dashboard semanas depois.

**Padrão correto no front:** carregue o projeto com `GET /projects/:id`, deixe o usuário editar, envie o objeto inteiro de volta.

```ts
const atual = await api.buscarProjeto(id);

await api.atualizarProjeto(id, {
  ...atual,                       // ATENÇÃO: remova os campos que não pertencem ao payload
  status: 'CONCLUIDO',
});
```

> **O objeto devolvido pelo `GET` não é aceito diretamente pelo `PUT`.** Ele traz `id`, `client`, `manager`, `team`, `indicadores`, `created_at` e `updated_at`, que não fazem parte do payload. A resposta real é:
>
> ```json
> {
>   "erro": "Dados inválidos",
>   "detalhes": [
>     "client_id: é obrigatório e deve ser texto",
>     "manager_id: é obrigatório e deve ser texto",
>     "team_id: é obrigatório e deve ser texto",
>     "Chaves desconhecidas: \"id\", \"client\", \"manager\", \"team\", \"indicadores\", \"created_at\", \"updated_at\""
>   ]
> }
> ```
>
> Converta as relações em ids (`client.id` → `client_id`) e descarte os extras. Há um helper pronto na [seção 9](#9-cliente-http-sugerido) — `paraPayloadDeAtualizacao`, verificado contra a API com resposta 200.

**200** — `ProjetoDetalhado` atualizado.

Tentar reabrir projeto `CONCLUIDO` ou `CANCELADO` responde **400**.

### `GET /dashboard`

Sem parâmetros — `?client_id=x` responde 400, não um recorte.

**200**:

```json
{
  "gerado_em": "2026-08-07",
  "total_projetos": 14,
  "projetos_por_status": [
    { "status": "PLANEJAMENTO", "total": 1 },
    { "status": "EM_ANDAMENTO", "total": 7 },
    { "status": "EM_RISCO", "total": 3 },
    { "status": "CONCLUIDO", "total": 2 },
    { "status": "CANCELADO", "total": 1 }
  ],
  "projetos_por_cliente": [
    { "client_id": "d38b1bc3-...", "client_name": "Acme Industria", "total": 4 },
    { "client_id": "1db44143-...", "client_name": "Banco Cordilheira", "total": 3 }
  ],
  "orcamento": {
    "total": 4162000,
    "consumido": 2421250,
    "saldo": 1740750,
    "consumo_percentual": 58.18
  },
  "horas_realizadas": 12050,
  "projetos_status_em_risco": 3,
  "projetos_atrasados": 4,
  "projetos_com_orcamento_excedido": 3,
  "projetos_em_atencao": 8
}
```

Notas de renderização:

- `projetos_por_status` traz **sempre os 5 status**, inclusive os zerados. Categoria vazia omitida sugeriria que ela não existe, quando o fato relevante é estar em zero. Renderize todas.
- `projetos_por_cliente` traz **só quem tem projeto**, ordenado por total decrescente, desempatado por nome.
- `gerado_em` é o dia usado na comparação de atraso. Exiba-o em algum canto: "atrasado" só significa algo se a data de referência estiver dita.

---

## 5. Erros

Formato único, em todos os endpoints:

```json
{ "erro": "mensagem legível", "detalhes": ["campo: problema"] }
```

`detalhes` aparece **apenas** em erro de validação — é um array de strings prontas para exibição, no formato `campo: problema`.

| Status | Quando |
|---|---|
| `400` | Entrada inválida, filtro desconhecido, regra de negócio violada, FK inexistente, JSON malformado |
| `404` | Recurso inexistente ou rota que não existe |
| `409` | Conflito: e-mail duplicado, nome de cliente/equipe duplicado |
| `500` | Erro inesperado — sem detalhe, e nada útil a mostrar ao usuário |
| `503` | Banco temporariamente indisponível — **vale repetir a requisição** |

### Exemplos reais

**400 — campos faltando**

```json
{
  "erro": "Dados inválidos",
  "detalhes": [
    "client_id: é obrigatório e deve ser texto",
    "start_date: é obrigatória e deve ser texto no formato AAAA-MM-DD",
    "budget: é obrigatório e deve ser numérico",
    "status: deve ser um de: PLANEJAMENTO, EM_ANDAMENTO, EM_RISCO, CONCLUIDO, CANCELADO"
  ]
}
```

**400 — campo desconhecido** (enviou `nome` em vez de `name`)

```json
{ "erro": "Dados inválidos", "detalhes": ["Chave desconhecida: \"nome\""] }
```

Com mais de um campo extra a mensagem vem no plural, em uma única entrada: `Chaves desconhecidas: "id", "client", "manager"`.

**400 — referência inexistente**

```json
{
  "erro": "Referências inválidas",
  "detalhes": [
    "client_id: cliente 00000000-0000-4000-8000-000000000001 não existe",
    "manager_id: gestor 00000000-0000-4000-8000-000000000002 não existe"
  ]
}
```

**400 — RN05**

```json
{ "erro": "Dados inválidos", "detalhes": ["deadline: deadline deve ser igual ou posterior a start_date"] }
```

**400 — id malformado na URL**

```json
{ "erro": "Dados inválidos", "detalhes": ["id da URL deve ser um UUID válido"] }
```

**404 — projeto inexistente**

```json
{ "erro": "Projeto não encontrado: 00000000-0000-4000-8000-000000000000" }
```

**409 — duplicidade**

```json
{ "erro": "Já existe cliente cadastrado com o nome \"Banco Cordilheira\"" }
{ "erro": "Já existe usuário cadastrado com o e-mail rafael.nunes@exemplo.com.br" }
```

**503 — banco indisponível**

```json
{ "erro": "Banco de dados indisponível no momento. Tente novamente." }
```

> O banco é Neon free tier, que **suspende a instância por inatividade**. A primeira requisição depois de um tempo parado pode demorar ~1,5 s, e ocasionalmente responder 503. Não é bug. Vale um retry automático em cima do 503 e um estado de carregamento que tolere ~2 s na primeira chamada.

### Tratamento sugerido

```ts
function mensagemDeErro(status: number, corpo: ErroDaApi): string {
  if (corpo.detalhes?.length) {
    return corpo.detalhes.join('\n');   // já vem legível, campo a campo
  }
  return corpo.erro;
}
```

Não tente mapear código de erro: não existe campo `code`. A distinção que importa é `status` + presença de `detalhes`.

---

## 6. Regras de negócio que o front precisa respeitar

| Regra | O que significa para a interface |
|---|---|
| **RN03** | `budget_spent > budget` **é permitido**. Não bloqueie no formulário, não avise "valor inválido". O estouro deve ser registrado e evidenciado como indicador, nunca impedido |
| **RN01/RN02/RN04** | `budget`, `budget_spent` e `hours_worked` não podem ser negativos |
| **RN05** | `deadline >= start_date`. Trave no seletor de datas |
| **RN06** | Projeto exige cliente, gestor, equipe, objetivo, prazo, orçamento e status. Nada opcional além de `observations` |
| **RN07** | `CONCLUIDO` e `CANCELADO` são **terminais**. No seletor de status de um projeto encerrado, ofereça apenas o status atual — as demais opções retornam 400 |
| **RN08** | Nome de cliente e de equipe é único ignorando caixa. Trate o 409 com mensagem no campo, não com erro genérico |
| **RN09** | Texto obrigatório não pode ser só espaços |
| **RN11** | **Não existe exclusão.** Não construa botão de excluir — não há endpoint. Correção se faz por atualização |
| **RN12** | `budget_spent` e `hours_worked` são acumulados, não incrementos. O formulário informa o total gasto até agora, não o gasto do período |
| **RN13** | `start_date` pode ser futura. Não valide contra hoje |

### Estados de status

Os três ativos (`PLANEJAMENTO`, `EM_ANDAMENTO`, `EM_RISCO`) são livremente intercambiáveis. Os terminais não voltam:

```
PLANEJAMENTO ⇄ EM_ANDAMENTO ⇄ EM_RISCO  ──→  CONCLUIDO
                                         └─→  CANCELADO
```

---

## 7. Armadilhas (leia antes de codar)

### 1. `projetos_status_em_risco` e `projetos_em_atencao` são coisas diferentes — nunca some

- `projetos_status_em_risco` conta projetos com `status = 'EM_RISCO'`: **julgamento manual** do gestor.
- `projetos_em_atencao` é **derivado** dos números: atrasado, orçamento estourado ou consumo ≥ 90%.

Um projeto pode estar nos dois. Somar produz número maior que o total da carteira. Se a tela precisa de "projetos com problema", use `projetos_em_atencao` — ele já deduplica.

### 2. `consumo_orcamento_percentual` pode ser `null`

Acontece quando `budget = 0`, que é permitido. `null` significa **não calculável**, não zero.

```tsx
{p.indicadores.consumo_orcamento_percentual === null
  ? '—'
  : `${p.indicadores.consumo_orcamento_percentual}%`}
```

Renderizar `null` direto em uma barra de progresso produz `NaN%` ou barra vazia sugerindo "0% consumido" — que é o oposto da verdade: pode haver gasto sem orçamento. Nesse caso `orcamento_excedido` vem `true` mesmo com percentual `null`.

### 3. Projeto encerrado não é "atrasado", por vencido que esteja

`projeto_atrasado` e `em_atencao` excluem `CONCLUIDO` e `CANCELADO`. Um projeto concluído com prazo vencido e 97% de consumo aparece com `consumo_elevado: true` e `em_atencao: false`.

Não recalcule atraso no front comparando `deadline` com `new Date()` — você vai obter resultado diferente do backend. **Use sempre `indicadores.projeto_atrasado`.**

### 4. `deadline` igual a hoje **não** é atraso

O atraso começa no dia seguinte. E, como as datas são `"AAAA-MM-DD"` puras:

```ts
new Date('2026-08-07')            // ❌ interpretado como UTC → 06/08 em UTC-3
new Date('2026-08-07T00:00:00')   // ✅ interpretado como local
```

Esse é o bug mais provável do front: o card mostra um dia a menos que a API. Formate a string diretamente, sem passar por `Date`, sempre que possível:

```ts
const [ano, mes, dia] = deadline.split('-');
const exibicao = `${dia}/${mes}/${ano}`;
```

### 5. `status` chega como `string`, não como união fechada

A coluna é `VARCHAR` sem ENUM no banco. Em 99% dos casos o valor é um dos cinco canônicos, mas o dashboard **anexa** ao fim de `projetos_por_status` qualquer valor fora da lista que exista no banco — de propósito, para denunciar dado corrompido em vez de escondê-lo.

Não use `switch` exaustivo sem `default`, e não deixe um mapa de cores quebrar com chave desconhecida:

```ts
const COR: Record<string, string> = { PLANEJAMENTO: '…', /* … */ };
const cor = COR[p.status] ?? COR_PADRAO;
```

### 6. Valores monetários chegam como `number` — e devem continuar assim

O backend converte explicitamente antes de responder, justamente para o front não receber `"250000.00"` como texto. Se algum valor chegar como string no seu código, o problema está no front (provavelmente um `JSON.parse` duplicado ou um form não convertido), não na API.

Ao enviar, garanta `number`: `budget: Number(campo.value)`. String no payload responde 400.

### 7. `PUT` não aceita o objeto que o `GET` devolve

Ver a seção do `PUT`. O corpo é estrito: campo a mais é 400.

---

## 8. O que a API não faz

Não implemente tela nem fluxo que dependa disto — não existe, e não está planejado para o MVP:

- **Autenticação e autorização reais.** Sem login, sem token, sem permissão por perfil. Nenhuma resposta muda em função de quem chama
- **`DELETE`** em qualquer recurso (RN11)
- **`PATCH`** — atualização parcial. Só `PUT` completo
- **Paginação, ordenação configurável ou busca textual.** As listas voltam inteiras, com ordem fixa
- **Atualização de usuário, cliente ou equipe.** Esses três só têm `POST` e `GET`
- **Filtros além de `status` e `client_id`** em `/projects`. Filtrar por gestor, equipe ou período é filtro do lado do front
- **Timesheet individual, membros de equipe, NPS, upload de arquivo, notificações, integrações**

Se a tela precisar de algo daqui, é conversa de escopo com o backend — não improvise chamando outro endpoint.

---

## 9. Cliente HTTP sugerido

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly corpo: ErroDaApi,
  ) {
    super(corpo.detalhes?.join('\n') ?? corpo.erro);
    this.name = 'ApiError';
  }
}

async function requisitar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // Identidade simulada — opcional, nenhum endpoint exige hoje.
      // ...(usuarioAtual && { 'x-user-id': usuarioAtual.id }),
      ...init.headers,
    },
  });

  if (!resposta.ok) {
    // Todo erro da API vem em JSON no formato { erro, detalhes? }.
    const corpo = (await resposta.json().catch(() => ({ erro: 'Falha de comunicação' }))) as ErroDaApi;
    throw new ApiError(resposta.status, corpo);
  }

  return resposta.json() as Promise<T>;
}

export const api = {
  // Cadastros
  listarUsuarios: () => requisitar<Usuario[]>('/users'),
  criarUsuario: (dados: CriarUsuario) =>
    requisitar<Usuario>('/users', { method: 'POST', body: JSON.stringify(dados) }),

  listarClientes: () => requisitar<Cliente[]>('/clients'),
  criarCliente: (dados: CriarCliente) =>
    requisitar<Cliente>('/clients', { method: 'POST', body: JSON.stringify(dados) }),

  listarEquipes: () => requisitar<Equipe[]>('/teams'),
  criarEquipe: (dados: CriarEquipe) =>
    requisitar<Equipe>('/teams', { method: 'POST', body: JSON.stringify(dados) }),

  // Projetos
  listarProjetos: (filtros?: { status?: StatusProjeto; client_id?: string }) => {
    const query = new URLSearchParams(
      Object.entries(filtros ?? {}).filter(([, v]) => v) as [string, string][],
    ).toString();

    return requisitar<ProjetoResumo[]>(`/projects${query ? `?${query}` : ''}`);
  },

  // Só envie parâmetro que exista: query desconhecida é 400, não é ignorada.
  listarEmAtencao: () => requisitar<ProjetoResumo[]>('/projects/attention'),

  buscarProjeto: (id: string) => requisitar<ProjetoDetalhado>(`/projects/${id}`),

  criarProjeto: (dados: CriarProjeto) =>
    requisitar<ProjetoDetalhado>('/projects', { method: 'POST', body: JSON.stringify(dados) }),

  atualizarProjeto: (id: string, dados: AtualizarProjeto) =>
    requisitar<ProjetoDetalhado>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),

  // Painel
  obterDashboard: () => requisitar<Dashboard>('/dashboard'),
};
```

Helper para o `PUT`, que é onde o contrato mais pega:

```ts
/** Converte o projeto devolvido pelo GET no payload aceito pelo PUT. */
export function paraPayloadDeAtualizacao(p: ProjetoDetalhado): AtualizarProjeto {
  return {
    name: p.name,
    client_id: p.client.id,
    manager_id: p.manager.id,
    team_id: p.team.id,
    objective: p.objective,
    start_date: p.start_date,
    deadline: p.deadline,
    budget: p.budget,
    budget_spent: p.budget_spent,
    hours_worked: p.hours_worked,
    status: p.status as StatusProjeto,
    observations: p.observations,
  };
}
```

---

## 10. Roteiro de teste da integração

Ordem que isola o problema quando algo falha — cada passo só faz sentido se o anterior passou.

### Passo 1 — backend sozinho, sem o front

```bash
npm run dev
curl http://localhost:3333/health          # 200
curl http://localhost:3333/dashboard       # painel com números
```

Se falhar aqui, o problema não tem nada a ver com o front. Consulte a tabela de solução de problemas do README do backend.

### Passo 2 — CORS, antes de escrever tela

Simula o preflight que o navegador dispara. Ajuste a origem para a porta real do front:

```bash
curl -i -X OPTIONS http://localhost:3333/projects \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: PUT' \
  -H 'Access-Control-Request-Headers: content-type,x-user-id'
```

Esperado — se algum destes faltar, o navegador vai barrar:

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PUT,OPTIONS
Access-Control-Allow-Headers: Content-Type,x-user-id
Access-Control-Max-Age: 86400
```

Sem `Access-Control-Allow-Origin`, adicione a porta do front em `CORS_ORIGIN` no `.env` do backend e **reinicie a API** — a variável é lida na subida.

### Passo 3 — leitura no front

Primeira tela deve ser somente leitura: `GET /dashboard` e `GET /projects`. Ainda sem formulário. O que isso valida, em ordem: CORS de verdade no navegador, base URL correta, parse do JSON, e os três formatos que mais quebram — data como `"AAAA-MM-DD"`, dinheiro como `number`, percentual `null`.

Confira lado a lado: o número que a tela mostra tem de bater com o `curl http://localhost:3333/dashboard`. Divergiu, o problema está na formatação do front, não na API.

### Passo 4 — escrita

Na ordem, porque cada uma depende da anterior: cliente → equipe → usuário → projeto. Um projeto exige os três ids existentes.

Casos que valem exercitar porque expõem contrato mal entendido:

| Teste | Esperado |
|---|---|
| Criar projeto com `budget_spent > budget` | **201** — RN03, não bloqueie |
| Criar com `deadline` antes de `start_date` | 400 com `detalhes` no campo certo |
| Criar com cliente inexistente | 400 nomeando qual referência falhou |
| Nome de cliente repetido, caixa diferente | 409 |
| `PUT` reenviando o objeto do `GET` sem converter | 400 — use `paraPayloadDeAtualizacao` |
| Mudar status de um `CONCLUIDO` para `EM_ANDAMENTO` | 400 — RN07 |

### Passo 5 — casos visuais, com o seed

O seed foi montado para cobrir cada estado que a interface precisa renderizar. Rode `npm run db:seed` no backend e confira na tela:

| Projeto | O que a tela deve mostrar |
|---|---|
| Integracao com Transportadoras Parceiras | Atrasado **e** consumo elevado — dois motivos no mesmo card |
| App de Fidelidade | Orçamento excedido, 112% — barra passando de 100%, sem erro |
| Migracao do Data Lake | 92% sem estouro — alerta amarelo, não vermelho |
| Diagnostico de Acessibilidade | `budget = 0`: percentual `—`, ainda assim marcado como excedido. **É aqui que a tela quebra com `NaN%`** |
| Reforma do E-commerce | Concluído, prazo vencido, 97% — **não** pode aparecer como atrasado nem em atenção |
| Motor Antifraude | Planejamento, início no futuro, 0% consumido |

### Quando algo falhar

| Sintoma | Causa provável |
|---|---|
| Erro de CORS no console | Porta do front fora de `CORS_ORIGIN`; ou a API não foi reiniciada após editar o `.env` |
| Data aparece um dia antes | `new Date("2026-08-07")` no front — ver Armadilhas, item 4 |
| `NaN%` ou barra vazia em um card | `consumo_orcamento_percentual` é `null` — ver Armadilhas, item 2 |
| Soma de "projetos com problema" maior que o total | Somou risco declarado com risco derivado — ver Armadilhas, item 1 |
| 400 em `PUT` que parece correto | Reenviou o objeto do `GET` sem converter |
| 400 em `GET` de lista | Parâmetro de query desconhecido — a API não ignora, recusa |
| Primeira chamada do dia demora ~2 s, ou 503 | Cold start do Neon. Normal — vale retry |
| Valor monetário aparece como texto | Problema no front: a API sempre envia `number` |

---

## Referência rápida

```
Base URL            http://localhost:3333
Header opcional     x-user-id: <uuid>
Datas de negócio    "AAAA-MM-DD"
Dinheiro/horas      number
Listas              array puro, sem envelope
Erro                { erro: string, detalhes?: string[] }
Nunca some          projetos_status_em_risco + projetos_em_atencao
Sempre trate        consumo_orcamento_percentual === null
Nunca recalcule     projeto_atrasado — use o do backend
```
