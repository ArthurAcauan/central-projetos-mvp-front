/**
 * Fixture de demonstração — respostas **reais** da API, capturadas contra o
 * backend com `npm run db:seed` rodado (ADR-0008).
 *
 * Por que respostas gravadas em vez de dados inventados: o bloco `indicadores`
 * é calculado pelo backend (ADR-0007). Um seed que os recalculasse aqui traria
 * de volta exatamente a divergência que o ADR-0007 eliminou — duas
 * implementações de "está atrasado", uma em cada repositório.
 *
 * Por isso **não edite valor de indicador à mão**. Para atualizar, capture de
 * novo com a API no ar (ver docs/HARNESS.md) e substitua o bloco inteiro.
 *
 * O formato é o DTO da API, em `snake_case`. Os mapeadores de `services/` — os
 * mesmos que traduzem a resposta real — convertem para o domínio, então a
 * fixture não tem caminho próprio de conversão e não pode divergir do contrato
 * sem quebrar o build.
 *
 * Casos visuais cobertos, todos vindos do seed do backend: projeto atrasado,
 * orçamento estourado (500%), consumo elevado sem estouro (92%), `budget = 0`
 * com percentual `null`, concluído após o prazo (que **não** é atraso) e
 * planejamento com início no futuro.
 *
 * As datas são absolutas, como a API devolveu. Diferente do seed anterior, elas
 * não acompanham o relógio — mas os indicadores vieram gravados junto, então o
 * projeto atrasado continua marcado como atrasado.
 */

import type { ClientDto } from '@/services/clients';
import type { ProjectDto } from '@/services/projects';
import type { TeamDto } from '@/services/teams';
import type { UserDto } from '@/services/users';

export const clientFixtures: readonly ClientDto[] = [
  {
    id: 'd38b1bc3-6788-4809-be42-4c6f251427af',
    name: 'Acme Industria',
    created_at: '2026-08-06T18:33:45.827Z',
    updated_at: '2026-08-06T18:33:45.827Z',
  },
  {
    id: '1db44143-8827-4e57-9351-2c683a2f1481',
    name: 'Banco Cordilheira',
    created_at: '2026-08-07T16:29:14.218Z',
    updated_at: '2026-08-07T16:29:14.218Z',
  },
  {
    id: '8562952c-7b04-4789-8bfc-9780f624d444',
    name: 'Beta Logistica',
    created_at: '2026-08-06T19:55:59.817Z',
    updated_at: '2026-08-06T19:55:59.817Z',
  },
  {
    id: 'eeea9442-727b-42fa-9ef2-eedf4068196e',
    name: 'Instituto Educar Mais',
    created_at: '2026-08-07T16:29:14.283Z',
    updated_at: '2026-08-07T16:29:14.283Z',
  },
  {
    id: '1596e7b9-6750-4c87-bf84-f3b5d97a98d1',
    name: 'Rede Farmacias Bem Estar',
    created_at: '2026-08-07T16:29:14.170Z',
    updated_at: '2026-08-07T16:29:14.170Z',
  },
  {
    id: '39b0573d-cab5-4b84-ab87-a0a7ad34be37',
    name: 'Transportes Vale Verde',
    created_at: '2026-08-07T16:29:14.100Z',
    updated_at: '2026-08-07T16:29:14.100Z',
  },
];

export const teamFixtures: readonly TeamDto[] = [
  {
    id: 'b5812071-213f-482f-9be5-87e737afeabe',
    name: 'Squad Alpha',
    created_at: '2026-08-06T18:33:46.114Z',
  },
  {
    id: '39f92834-4f55-4cc6-8af3-882d33573661',
    name: 'Squad Beta',
    created_at: '2026-08-06T19:56:00.400Z',
  },
  {
    id: '5b2b7bff-af59-4b43-bb12-e9a48574c6af',
    name: 'Squad Dados',
    created_at: '2026-08-07T16:29:14.432Z',
  },
  {
    id: 'ceef1686-d023-498e-a332-970c33032d27',
    name: 'Squad Integracoes',
    created_at: '2026-08-07T16:29:14.360Z',
  },
  {
    id: 'e1ee5096-dea2-4ac7-b43f-d8ab6e382fc6',
    name: 'Squad Mobile',
    created_at: '2026-08-07T16:29:14.481Z',
  },
  {
    id: '801ea8b0-ba4e-4538-8aa2-9d9b514b25ad',
    name: 'Squad Sustentacao',
    created_at: '2026-08-07T16:29:14.533Z',
  },
];

export const userFixtures: readonly UserDto[] = [
  {
    id: 'd3cc9562-984a-4174-a20b-1f3af7c2324c',
    name: 'Ana Souza',
    email: 'ana.souza@exemplo.com',
    role: 'GERENTE',
    created_at: '2026-08-06T18:33:45.537Z',
  },
  {
    id: '07c7aae5-c3e3-443e-82e1-82608ba97b5a',
    name: 'Bruno Lima',
    email: 'bruno.lima@exemplo.com',
    role: 'GESTOR_PROJETO',
    created_at: '2026-08-06T19:55:58.630Z',
  },
  {
    id: '4600b56b-96b4-41ec-8e51-6ce393083192',
    name: 'Camila Ferraz',
    email: 'camila.ferraz@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    created_at: '2026-08-07T16:29:13.918Z',
  },
  {
    id: '3d556ba0-467f-4eae-a7c5-4ba24d7e3f3f',
    name: 'Diego Antunes',
    email: 'diego.antunes@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    created_at: '2026-08-07T16:29:13.968Z',
  },
  {
    id: '8c43de6d-a1da-426e-a1fc-18fb6ac1f0ea',
    name: 'Helena Barros',
    email: 'helena.barros@exemplo.com.br',
    role: 'GERENTE',
    created_at: '2026-08-07T16:29:13.769Z',
  },
  {
    id: '38a19735-075b-4024-8743-01a497394623',
    name: 'Marina Okuda',
    email: 'marina.okuda@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    created_at: '2026-08-07T16:29:14.019Z',
  },
  {
    id: 'c2cc1dd6-6e72-4b41-a548-f1f4f7a1b338',
    name: 'Rafael Nunes',
    email: 'rafael.nunes@exemplo.com.br',
    role: 'COORDENADOR',
    created_at: '2026-08-07T16:29:13.866Z',
  },
];

export const projectFixtures: readonly ProjectDto[] = [
  {
    id: 'b7b5ef84-aa66-4902-98ef-e4b18158211b',
    name: 'Projeto Encerrado',
    status: 'CONCLUIDO',
    start_date: '2026-02-01',
    deadline: '2026-03-31',
    budget: 50000,
    budget_spent: 48000,
    hours_worked: 0,
    client: {
      id: 'd38b1bc3-6788-4809-be42-4c6f251427af',
      name: 'Acme Industria',
    },
    manager: {
      id: 'd3cc9562-984a-4174-a20b-1f3af7c2324c',
      name: 'Ana Souza',
    },
    team: {
      id: 'b5812071-213f-482f-9be5-87e737afeabe',
      name: 'Squad Alpha',
    },
    indicadores: {
      consumo_orcamento_percentual: 96,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: true,
      em_atencao: false,
      motivos_de_atencao: [],
    },
    objective: 'Objetivo do projeto',
    observations: null,
    created_at: '2026-08-06T20:44:13.901Z',
    updated_at: '2026-08-06T20:44:13.901Z',
  },
  {
    id: '3c6ec888-adb3-48d2-a036-8b8d7e0937ff',
    name: 'Plataforma de Cursos Livres',
    status: 'CANCELADO',
    start_date: '2026-01-19',
    deadline: '2026-05-19',
    budget: 180000,
    budget_spent: 96000,
    hours_worked: 620,
    client: {
      id: 'eeea9442-727b-42fa-9ef2-eedf4068196e',
      name: 'Instituto Educar Mais',
    },
    manager: {
      id: '3d556ba0-467f-4eae-a7c5-4ba24d7e3f3f',
      name: 'Diego Antunes',
    },
    team: {
      id: '801ea8b0-ba4e-4538-8aa2-9d9b514b25ad',
      name: 'Squad Sustentacao',
    },
    indicadores: {
      consumo_orcamento_percentual: 53.33,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: false,
      em_atencao: false,
      motivos_de_atencao: [],
    },
    objective:
      'Oferecer trilhas de cursos abertos ao público externo como nova fonte de receita do instituto.',
    observations: 'Cancelado por redirecionamento de verba; entregas parciais arquivadas.',
    created_at: '2026-08-07T16:29:15.029Z',
    updated_at: '2026-08-07T16:29:15.029Z',
  },
  {
    id: '9d0f062c-0e66-4e37-8c6e-e81d03702cab',
    name: 'Reforma do E-commerce',
    status: 'CONCLUIDO',
    start_date: '2025-10-11',
    deadline: '2026-06-28',
    budget: 320000,
    budget_spent: 311000,
    hours_worked: 2450,
    client: {
      id: '1596e7b9-6750-4c87-bf84-f3b5d97a98d1',
      name: 'Rede Farmacias Bem Estar',
    },
    manager: {
      id: '3d556ba0-467f-4eae-a7c5-4ba24d7e3f3f',
      name: 'Diego Antunes',
    },
    team: {
      id: '801ea8b0-ba4e-4538-8aa2-9d9b514b25ad',
      name: 'Squad Sustentacao',
    },
    indicadores: {
      consumo_orcamento_percentual: 97.19,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: true,
      em_atencao: false,
      motivos_de_atencao: [],
    },
    objective:
      'Reconstruir a vitrine e o checkout da loja online para sustentar o crescimento do canal digital.',
    observations: null,
    created_at: '2026-08-07T16:29:14.816Z',
    updated_at: '2026-08-07T16:29:14.816Z',
  },
  {
    id: 'b236a726-59da-4b55-9bf5-ec2b4dae32a1',
    name: 'Portal do Cliente',
    status: 'EM_RISCO',
    start_date: '2026-01-15',
    deadline: '2026-06-30',
    budget: 250000,
    budget_spent: 180000,
    hours_worked: 500,
    client: {
      id: 'd38b1bc3-6788-4809-be42-4c6f251427af',
      name: 'Acme Industria',
    },
    manager: {
      id: 'd3cc9562-984a-4174-a20b-1f3af7c2324c',
      name: 'Ana Souza',
    },
    team: {
      id: 'b5812071-213f-482f-9be5-87e737afeabe',
      name: 'Squad Alpha',
    },
    indicadores: {
      consumo_orcamento_percentual: 72,
      projeto_atrasado: true,
      orcamento_excedido: false,
      consumo_elevado: false,
      em_atencao: true,
      motivos_de_atencao: ['ATRASADO'],
    },
    objective: 'Centralizar o atendimento em um unico canal',
    observations: 'Consumo acima do previsto',
    created_at: '2026-08-06T20:43:22.392Z',
    updated_at: '2026-08-06T20:44:41.787Z',
  },
  {
    id: '4268ff84-6d5a-43c6-8bb0-ef242afeb56a',
    name: 'Integracao com Transportadoras Parceiras',
    status: 'EM_RISCO',
    start_date: '2026-04-09',
    deadline: '2026-07-23',
    budget: 260000,
    budget_spent: 245000,
    hours_worked: 1810,
    client: {
      id: '39b0573d-cab5-4b84-ab87-a0a7ad34be37',
      name: 'Transportes Vale Verde',
    },
    manager: {
      id: '4600b56b-96b4-41ec-8e51-6ce393083192',
      name: 'Camila Ferraz',
    },
    team: {
      id: 'ceef1686-d023-498e-a332-970c33032d27',
      name: 'Squad Integracoes',
    },
    indicadores: {
      consumo_orcamento_percentual: 94.23,
      projeto_atrasado: true,
      orcamento_excedido: false,
      consumo_elevado: true,
      em_atencao: true,
      motivos_de_atencao: ['ATRASADO', 'CONSUMO_ELEVADO'],
    },
    objective:
      'Trocar dados de coleta e entrega com as cinco transportadoras parceiras por API, substituindo a planilha enviada por e-mail.',
    observations: 'Homologação de duas transportadoras travada por indisponibilidade do parceiro.',
    created_at: '2026-08-07T16:29:14.708Z',
    updated_at: '2026-08-07T16:29:14.708Z',
  },
  {
    id: 'b8105fd4-da7b-4239-b0d4-e41305fa7942',
    name: 'Onboarding Digital de Contas',
    status: 'EM_ANDAMENTO',
    start_date: '2026-05-24',
    deadline: '2026-08-04',
    budget: 600000,
    budget_spent: 402000,
    hours_worked: 2100,
    client: {
      id: '1db44143-8827-4e57-9351-2c683a2f1481',
      name: 'Banco Cordilheira',
    },
    manager: {
      id: '38a19735-075b-4024-8743-01a497394623',
      name: 'Marina Okuda',
    },
    team: {
      id: 'ceef1686-d023-498e-a332-970c33032d27',
      name: 'Squad Integracoes',
    },
    indicadores: {
      consumo_orcamento_percentual: 67,
      projeto_atrasado: true,
      orcamento_excedido: false,
      consumo_elevado: false,
      em_atencao: true,
      motivos_de_atencao: ['ATRASADO'],
    },
    objective:
      'Permitir a abertura de conta pelo celular, sem visita à agência, com validação documental automatizada.',
    observations: 'Prazo estourado à espera do parecer regulatório; execução técnica em dia.',
    created_at: '2026-08-07T16:29:14.870Z',
    updated_at: '2026-08-07T16:29:14.870Z',
  },
  {
    id: '42e16969-0201-4684-bcd5-f83ddc577c3c',
    name: 'Projeto Fronteira',
    status: 'EM_ANDAMENTO',
    start_date: '2026-01-01',
    deadline: '2026-08-06',
    budget: 1000,
    budget_spent: 950,
    hours_worked: 0,
    client: {
      id: 'd38b1bc3-6788-4809-be42-4c6f251427af',
      name: 'Acme Industria',
    },
    manager: {
      id: 'd3cc9562-984a-4174-a20b-1f3af7c2324c',
      name: 'Ana Souza',
    },
    team: {
      id: 'b5812071-213f-482f-9be5-87e737afeabe',
      name: 'Squad Alpha',
    },
    indicadores: {
      consumo_orcamento_percentual: 95,
      projeto_atrasado: true,
      orcamento_excedido: false,
      consumo_elevado: true,
      em_atencao: true,
      motivos_de_atencao: ['ATRASADO', 'CONSUMO_ELEVADO'],
    },
    objective: 'Verificar a fronteira do prazo contra o banco real',
    observations: null,
    created_at: '2026-08-06T21:47:57.852Z',
    updated_at: '2026-08-06T21:47:57.852Z',
  },
  {
    id: '970b09e5-66be-43d8-b827-c06627e6b7ff',
    name: 'Diagnostico de Acessibilidade',
    status: 'EM_ANDAMENTO',
    start_date: '2026-07-18',
    deadline: '2026-08-07',
    budget: 0,
    budget_spent: 12000,
    hours_worked: 310,
    client: {
      id: 'eeea9442-727b-42fa-9ef2-eedf4068196e',
      name: 'Instituto Educar Mais',
    },
    manager: {
      id: '38a19735-075b-4024-8743-01a497394623',
      name: 'Marina Okuda',
    },
    team: {
      id: 'e1ee5096-dea2-4ac7-b43f-d8ab6e382fc6',
      name: 'Squad Mobile',
    },
    indicadores: {
      consumo_orcamento_percentual: null,
      projeto_atrasado: false,
      orcamento_excedido: true,
      consumo_elevado: false,
      em_atencao: true,
      motivos_de_atencao: ['ORCAMENTO_EXCEDIDO'],
    },
    objective:
      'Levantar as barreiras de acessibilidade dos portais do instituto e priorizar as correções necessárias.',
    observations: 'Trabalho iniciado antes da aprovação do orçamento, com custo já incorrido.',
    created_at: '2026-08-07T16:29:15.080Z',
    updated_at: '2026-08-07T16:29:15.080Z',
  },
  {
    id: '300bb40a-1f6a-4343-9090-7870b865b110',
    name: 'App de Fidelidade',
    status: 'EM_ANDAMENTO',
    start_date: '2026-05-09',
    deadline: '2026-08-27',
    budget: 150000,
    budget_spent: 168500,
    hours_worked: 980,
    client: {
      id: '1596e7b9-6750-4c87-bf84-f3b5d97a98d1',
      name: 'Rede Farmacias Bem Estar',
    },
    manager: {
      id: '3d556ba0-467f-4eae-a7c5-4ba24d7e3f3f',
      name: 'Diego Antunes',
    },
    team: {
      id: 'e1ee5096-dea2-4ac7-b43f-d8ab6e382fc6',
      name: 'Squad Mobile',
    },
    indicadores: {
      consumo_orcamento_percentual: 112.33,
      projeto_atrasado: false,
      orcamento_excedido: true,
      consumo_elevado: true,
      em_atencao: true,
      motivos_de_atencao: ['ORCAMENTO_EXCEDIDO'],
    },
    objective:
      'Substituir o cartão físico de pontos por aplicativo próprio, com resgate de benefícios no caixa das lojas.',
    observations: 'Escopo ampliado após a homologação: integração com o PDV das 40 lojas.',
    created_at: '2026-08-07T16:29:14.761Z',
    updated_at: '2026-08-07T16:29:14.761Z',
  },
  {
    id: '7ebf6f0d-49fa-418e-892c-3eb805ed734b',
    name: 'Portal de Rastreamento de Cargas',
    status: 'EM_ANDAMENTO',
    start_date: '2026-06-08',
    deadline: '2026-09-21',
    budget: 480000,
    budget_spent: 210000,
    hours_worked: 1240,
    client: {
      id: '39b0573d-cab5-4b84-ab87-a0a7ad34be37',
      name: 'Transportes Vale Verde',
    },
    manager: {
      id: '4600b56b-96b4-41ec-8e51-6ce393083192',
      name: 'Camila Ferraz',
    },
    team: {
      id: 'ceef1686-d023-498e-a332-970c33032d27',
      name: 'Squad Integracoes',
    },
    indicadores: {
      consumo_orcamento_percentual: 43.75,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: false,
      em_atencao: false,
      motivos_de_atencao: [],
    },
    objective:
      'Disponibilizar ao cliente final o acompanhamento das entregas em tempo real, reduzindo o volume de contatos na central de atendimento.',
    observations: null,
    created_at: '2026-08-07T16:29:14.623Z',
    updated_at: '2026-08-07T16:29:14.623Z',
  },
  {
    id: '8a099bc4-30bc-4f26-bb88-be78ce6d531b',
    name: 'Migracao do Data Lake',
    status: 'EM_RISCO',
    start_date: '2026-06-23',
    deadline: '2026-10-06',
    budget: 750000,
    budget_spent: 690000,
    hours_worked: 1560,
    client: {
      id: '1db44143-8827-4e57-9351-2c683a2f1481',
      name: 'Banco Cordilheira',
    },
    manager: {
      id: 'c2cc1dd6-6e72-4b41-a548-f1f4f7a1b338',
      name: 'Rafael Nunes',
    },
    team: {
      id: '5b2b7bff-af59-4b43-bb12-e9a48574c6af',
      name: 'Squad Dados',
    },
    indicadores: {
      consumo_orcamento_percentual: 92,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: true,
      em_atencao: true,
      motivos_de_atencao: ['CONSUMO_ELEVADO'],
    },
    objective:
      'Migrar o repositório analítico para nuvem, encerrando o contrato de datacenter que vence no fim do ano.',
    observations: 'Volume de dados 30% acima do levantado na proposta.',
    created_at: '2026-08-07T16:29:14.978Z',
    updated_at: '2026-08-07T16:29:14.978Z',
  },
  {
    id: 'e1158242-6cf8-4ead-9d93-cff133c0d884',
    name: 'Central de Indicadores Academicos',
    status: 'EM_ANDAMENTO',
    start_date: '2026-07-08',
    deadline: '2026-11-05',
    budget: 220000,
    budget_spent: 52800,
    hours_worked: 480,
    client: {
      id: 'eeea9442-727b-42fa-9ef2-eedf4068196e',
      name: 'Instituto Educar Mais',
    },
    manager: {
      id: '4600b56b-96b4-41ec-8e51-6ce393083192',
      name: 'Camila Ferraz',
    },
    team: {
      id: '5b2b7bff-af59-4b43-bb12-e9a48574c6af',
      name: 'Squad Dados',
    },
    indicadores: {
      consumo_orcamento_percentual: 24,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: false,
      em_atencao: false,
      motivos_de_atencao: [],
    },
    objective:
      'Consolidar matrículas, evasão e desempenho em um painel único para a coordenação pedagógica.',
    observations: null,
    created_at: '2026-08-07T16:29:15.141Z',
    updated_at: '2026-08-07T16:29:15.141Z',
  },
  {
    id: 'b96a7974-f773-4830-87fd-5a933b6fe00a',
    name: 'Projeto Estourado',
    status: 'EM_ANDAMENTO',
    start_date: '2026-02-01',
    deadline: '2026-11-30',
    budget: 1000,
    budget_spent: 5000,
    hours_worked: 0,
    client: {
      id: 'd38b1bc3-6788-4809-be42-4c6f251427af',
      name: 'Acme Industria',
    },
    manager: {
      id: 'd3cc9562-984a-4174-a20b-1f3af7c2324c',
      name: 'Ana Souza',
    },
    team: {
      id: 'b5812071-213f-482f-9be5-87e737afeabe',
      name: 'Squad Alpha',
    },
    indicadores: {
      consumo_orcamento_percentual: 500,
      projeto_atrasado: false,
      orcamento_excedido: true,
      consumo_elevado: true,
      em_atencao: true,
      motivos_de_atencao: ['ORCAMENTO_EXCEDIDO'],
    },
    objective: 'Objetivo do projeto',
    observations: null,
    created_at: '2026-08-06T20:44:13.434Z',
    updated_at: '2026-08-06T20:44:13.434Z',
  },
  {
    id: '1bb90bd9-9948-4b50-8e82-e75fcdb4d902',
    name: 'Motor Antifraude',
    status: 'PLANEJAMENTO',
    start_date: '2026-08-22',
    deadline: '2027-02-13',
    budget: 900000,
    budget_spent: 0,
    hours_worked: 0,
    client: {
      id: '1db44143-8827-4e57-9351-2c683a2f1481',
      name: 'Banco Cordilheira',
    },
    manager: {
      id: '8c43de6d-a1da-426e-a1fc-18fb6ac1f0ea',
      name: 'Helena Barros',
    },
    team: {
      id: '5b2b7bff-af59-4b43-bb12-e9a48574c6af',
      name: 'Squad Dados',
    },
    indicadores: {
      consumo_orcamento_percentual: 0,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: false,
      em_atencao: false,
      motivos_de_atencao: [],
    },
    objective:
      'Avaliar risco de transações em tempo real e bloquear operações suspeitas antes da liquidação.',
    observations: null,
    created_at: '2026-08-07T16:29:14.928Z',
    updated_at: '2026-08-07T17:18:54.186Z',
  },
];
