# Registro de Decisões de Arquitetura (ADR)

Decisões que mudam **estrutura** do frontend: camadas, contrato de dados, dependências novas, entrada ou saída de escopo.

Não vale ADR para escolha de nome de variável, layout de tela ou detalhe de implementação.

## Quando abrir um ADR

- Uma dependência nova entra na stack.
- O contrato com a API muda de forma.
- Uma camada nova aparece (ou uma existente muda de responsabilidade).
- Algo da lista "fora de escopo" precisa entrar — **este é obrigatório**, e o ADR vem antes do código.

## Como

1. Copie [`TEMPLATE.md`](TEMPLATE.md) para `ADR-nnnn-titulo-curto.md`.
2. Preencha contexto, decisão, alternativas e consequências.
3. Se a decisão contradiz `context/`, atualize `context/*.md` e `CLAUDE.md` no mesmo commit — senão a IA volta a seguir a regra antiga na próxima sessão.

## Índice

| ADR | Título | Status |
|---|---|---|
| [0001](ADR-0001-mock-primeiro.md) | Front desenvolvido sobre dados mock antes da API real | Aceito |
| [0002](ADR-0002-contrato-de-dados-e-mapeamento.md) | Contrato de dados isolado em `services/` com mapeamento explícito | Aceito |
| [0003](ADR-0003-ui-tailwind-em-vez-de-mui.md) | Tailwind CSS v4 como camada de UI, em vez de MUI | Aceito |
| [0004](ADR-0004-refinamento-das-regras-de-negocio.md) | Refinamento das regras de negócio e requisitos (RN07–RN09, RF03, RNF03) | Aceito |
