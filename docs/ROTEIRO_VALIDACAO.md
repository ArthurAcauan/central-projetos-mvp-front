# Roteiro de validação com profissionais de gestão de projetos

Fatia **F5-3** do [BACKLOG](BACKLOG.md). Instrumento para a avaliação do MVP com profissionais de gestão de projetos de consultoria de tecnologia — a parte empírica que responde à questão de pesquisa do PF2:

> Como a centralização e a análise de informações de projetos em uma plataforma única podem contribuir para melhorar a gestão de projetos em empresas de consultoria de tecnologia?

O que se avalia é **se a informação centralizada apoia a decisão**, não se a tela é bonita. As tarefas abaixo são todas perguntas que hoje se responde abrindo planilha, e-mail e ferramenta de apontamento em sequência.

> **Sobre o questionário do fim.** É um instrumento da pesquisa, aplicado **fora do sistema** (papel ou formulário). Não é NPS e não vira funcionalidade: pesquisa de satisfação embarcada está na lista de fora de escopo do MVP.

---

## 1. Participantes

De 4 a 6 pessoas, nenhuma delas envolvida na construção do sistema. Com 5 participantes já se observa a maior parte dos problemas de usabilidade recorrentes, e o objetivo aqui é qualitativo.

| Perfil | Quantidade sugerida | Por que importa |
|---|---|---|
| Gerente | 1 a 2 | É quem consome a visão consolidada da carteira (RF07, RF08) |
| Coordenador | 1 a 2 | Faz a ponte entre carteira e execução; usa o painel de atenção (RF09) |
| Gestor de projeto | 2 | Alimenta e consulta o projeto individual (RF03 a RF06) |

Registrar de cada participante: perfil, tempo de experiência com gestão de projetos e quais ferramentas usa hoje para o mesmo fim. Sem esse registro não dá para interpretar uma reclamação como "problema do sistema" ou "hábito da ferramenta anterior".

## 2. Preparação do ambiente

Antes de cada sessão, com o backend e o frontend no ar (ver [README](../README.md#como-rodar)):

- [ ] `GET /projects` responde (o banco do Neon hiberna; a primeira chamada pode demorar ~1,5 s)
- [ ] A porta em que o Vite subiu está em `CORS_ORIGIN` no `.env` do **backend**. Se a 5173 estiver ocupada o Vite cai na 5174 e o navegador barra tudo com erro de CORS — é a falha mais provável da sessão e não tem nada a ver com o roteiro
- [ ] A carteira de demonstração está carregada (seção 3), incluindo os quatro casos-limite
- [ ] Navegador em janela maximizada para as tarefas 1 a 6; uma tarefa é feita em largura de celular (tarefa 7)
- [ ] Gravação de tela combinada e autorizada por escrito

**Não** conduza a sessão explicando as telas antes. A primeira tarefa mede justamente quanto tempo leva para achar sozinho.

## 3. Dados de demonstração

Os dados são fictícios e inseridos manualmente. O que a carteira precisa conter não é volume, e sim os casos que fazem o indicador mentir quando não está tratado — se todos os projetos forem "normais", a demonstração não prova nada.

**Mínimo obrigatório:** 5 clientes, 5 usuários (com os três perfis representados), 4 equipes e 12 a 16 projetos cobrindo os cinco status.

**Os quatro casos-limite que precisam existir:**

| Caso | Como montar | O que precisa aparecer na tela |
|---|---|---|
| Orçamento previsto zero, com consumo | `budget = 0`, `budget_spent > 0` | Consumo como "—", nunca "0%" nem "∞%" (RN07) |
| Prazo vencendo **hoje** | `deadline` = data da sessão, status ativo | **Não** aparece como atrasado (RN08) |
| Prazo vencido **ontem** | `deadline` = véspera, status ativo | Aparece como atrasado, no painel de atenção e na lista |
| Encerrado depois do prazo | `deadline` no passado, status `CONCLUIDO` | **Não** aparece como atrasado nem em atenção |

Vale também ter um projeto com `budget_spent > budget` (o estouro é permitido por RN03) e um projeto sem horas apontadas (não vira barra de altura zero no gráfico).

**Carteira usada na verificação de 07/08/2026** — 16 projetos, 8 clientes, 9 usuários, 7 equipes. Os casos-limite estavam cobertos assim:

| Projeto | Situação | O que demonstra |
|---|---|---|
| Diagnóstico de Acessibilidade | `budget = 0`, consumido R$ 12.000, prazo **hoje** | Consumo "—" e ausência de atraso, os dois na mesma linha |
| Projeto Fronteira | prazo **ontem**, em andamento | Atraso de um dia é atraso |
| Verificação F5-1 | consumido acima do previsto, `CONCLUIDO` | Estouro em projeto encerrado **não** entra em atenção |
| App de Fidelidade | R$ 168.500 consumidos de R$ 150.000 | Estouro salvo e evidenciado, não bloqueado |
| Migração do Data Lake | `EM_RISCO` e 92% consumidos | Risco declarado e consumo elevado são sinais diferentes |

Naquela carteira: 8 projetos em atenção, 4 atrasados, 4 com orçamento excedido e 3 em risco — e a soma **não** é a conta de "8", de propósito (RN09: cada projeto conta uma vez, e `EM_RISCO` é indicador à parte).

## 4. Tarefas

Uma por vez, sem ajuda. Anotar: **tempo**, **concluiu sim/não**, **quantos caminhos errados**, **o que a pessoa falou em voz alta**.

O tempo esperado é referência de conversa, não meta — estourar o tempo é um dado, não um erro do participante.

| # | Tarefa | Requisito | Tempo esperado | O que observar |
|---|---|---|---|---|
| 1 | "Sem eu explicar nada: quantos projetos estão em situação de atenção agora, e por quê?" | RF07, RF09 | 1 min | Se olha o card ou a tabela; se entende que "em risco" e "em atenção" são coisas diferentes |
| 2 | "Qual cliente concentra mais orçamento consumido?" | RF08 | 1 min | Se usa o gráfico ou procura na lista; se a legenda basta |
| 3 | "Encontre os projetos do cliente *X* que estão atrasados." | RF04 | 2 min | Se combina os filtros ou rola a lista inteira |
| 4 | "Abra o projeto *Y* e me diga se ele vai estourar o orçamento." | RF05 | 2 min | Se a rosca de consumo e o saldo bastam, ou se procura o número em outro lugar |
| 5 | "Cadastre um projeto novo para o cliente *Z*, com orçamento de R$ 100.000 e prazo para daqui a três meses." | RF03 | 4 min | Onde hesita; se entende quais campos são obrigatórios antes de tentar salvar |
| 6 | "Esse projeto consumiu R$ 130.000. Atualize." | RF06, RN03 | 2 min | **Ponto-chave:** o aviso de estouro aparece e o salvamento acontece. Perguntar se esperava ser bloqueado |
| 7 | Repetir a tarefa 1 com a janela em 375 px de largura (celular) | RNF01 | 2 min | Se acha o menu; se a tabela rola sem esconder coluna |
| 8 | "Cadastre um cliente com um nome que já existe." | RF02 | 1 min | Se a mensagem de duplicidade é clara sem parecer erro do sistema |

Ao fim das oito, então sim, mostrar o que não foi encontrado e ouvir o comentário.

## 5. Perguntas abertas (10 a 15 min)

1. O que essa tela responde que hoje você só descobre abrindo mais de uma ferramenta?
2. Que informação você procurou e não achou?
3. Algum número que você viu aqui você não acreditaria sem conferir na origem? Qual, e por quê?
4. Como você identifica hoje que um projeto está em risco? O que o sistema mostrou a mais, ou a menos, que isso?
5. Se essa tela fosse a primeira coisa que você abre na segunda-feira, o que precisaria estar nela e não está?
6. Faltou alguma informação de projeto que você usa e o cadastro não pede?

A pergunta 3 é a mais importante do roteiro: confiança no número é o que decide se um painel gerencial passa a ser usado ou vira mais uma aba aberta.

## 6. Questionário de fechamento

Escala de 1 (discordo totalmente) a 5 (concordo totalmente). Aplicado fora do sistema.

| # | Afirmação | Liga-se a |
|---|---|---|
| 1 | Encontrei as informações que procurei sem precisar de ajuda | RNF01 |
| 2 | Os indicadores do dashboard são claros e não deixam dúvida sobre o que significam | RF07 |
| 3 | Os gráficos ajudam a entender a situação da carteira | RF08 |
| 4 | Confio nos números apresentados o suficiente para usá-los em uma reunião | RF07, RF09 |
| 5 | O cadastro e a atualização de projeto pedem o que eu já registro hoje, nem mais nem menos | RF03, RF06 |
| 6 | A identificação de projetos em risco corresponde ao que eu consideraria risco | RF09 |
| 7 | A plataforma reduziria o tempo que gasto hoje reunindo essas informações | Questão de pesquisa |
| 8 | Eu usaria esta plataforma no meu dia a dia | Aceitação geral |

Fechar com duas perguntas livres: **o que mais ajudou** e **o que mais atrapalhou**.

## 7. Registro e consolidação

Uma planilha por sessão, uma linha por tarefa: participante, perfil, tarefa, tempo, concluiu, número de caminhos errados, observações.

Na consolidação:

- **Tarefa que mais de um participante não concluiu** é problema do sistema, não do participante — vira item de backlog com o requisito afetado.
- **Divergência entre perfis** (gerente acha claro, gestor não) é achado de pesquisa e entra na discussão do trabalho, não vira correção automática.
- **Pedido de funcionalidade** que caia na lista de fora de escopo (autenticação real, controle de acesso por perfil, timesheet individual, integração automática) é registrado como **trabalho futuro**, não implementado. O caminho para reverter isso, se algum dia for o caso, está em [HARNESS.md](HARNESS.md): ADR → `context/` → código.
- As médias do questionário da seção 6 entram no capítulo de resultados junto com **quantos** responderam, nunca só a média.

## 8. Limitações a declarar no trabalho

Ditas antes que a banca pergunte:

- Amostra pequena e por conveniência: os resultados são indícios qualitativos, não generalização estatística.
- Dados fictícios: os participantes avaliam o instrumento, não a própria carteira — o que muda o quanto se importam com os números.
- Sessão única, sem uso continuado: mede a primeira impressão e a descoberta, não a adoção.
- Usuário logado simulado e sem controle de acesso por perfil (RNF03): a percepção de "o que eu deveria poder ver" não é avaliada aqui.
