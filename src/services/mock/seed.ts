/**
 * Seed fictício do MVP (F1-4, ADR-0001).
 *
 * Os dados são inventados e inseridos manualmente, como o spec prevê. Este
 * arquivo é também **ativo de teste**: o seed precisa exercitar as bordas que o
 * dashboard tem de mostrar corretamente. Garantido por `store.test.ts`:
 *
 * - os cinco status ocupados;
 * - projeto atrasado (prazo vencido e status ativo);
 * - projeto com prazo **igual a hoje**, que não pode aparecer como atrasado (RN08);
 * - projeto com orçamento excedido (RN03);
 * - projeto com `budget = 0`, cujo consumo é indisponível (RN07).
 *
 * Prazos são relativos à data de execução: o projeto atrasado continua atrasado
 * daqui a seis meses, sem manutenção do seed.
 */

import { formatCalendarDate } from '@/domain/indicators';
import type { Client } from '@/types/client';
import type { Project } from '@/types/project';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

/** Data de calendário deslocada de hoje. Negativo é passado. */
function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatCalendarDate(date);
}

/** Timestamp fixo: nenhuma tela do MVP depende de `createdAt`/`updatedAt`. */
const TIMESTAMP = '2026-01-05T09:00:00.000Z';

export const seedClients: readonly Client[] = [
  { id: 'cli-01', name: 'Alfa Logística', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-02', name: 'Beta Saúde', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-03', name: 'Cooperativa Central', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-04', name: 'Delta Varejo', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-05', name: 'Editora Horizonte', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
];

export const seedTeams: readonly Team[] = [
  { id: 'team-01', name: 'Squad Plataforma', createdAt: TIMESTAMP },
  { id: 'team-02', name: 'Squad Dados', createdAt: TIMESTAMP },
  { id: 'team-03', name: 'Squad Mobile', createdAt: TIMESTAMP },
  { id: 'team-04', name: 'Squad Integrações', createdAt: TIMESTAMP },
];

export const seedUsers: readonly User[] = [
  {
    id: 'usr-01',
    name: 'Rodrigo Almeida',
    email: 'rodrigo.almeida@exemplo.com.br',
    role: 'GERENTE',
    createdAt: TIMESTAMP,
  },
  {
    id: 'usr-02',
    name: 'Camila Ferreira',
    email: 'camila.ferreira@exemplo.com.br',
    role: 'COORDENADOR',
    createdAt: TIMESTAMP,
  },
  {
    id: 'usr-03',
    name: 'Bruno Tavares',
    email: 'bruno.tavares@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
  },
  {
    id: 'usr-04',
    name: 'Letícia Ramos',
    email: 'leticia.ramos@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
  },
  {
    id: 'usr-05',
    name: 'Marcos Pinheiro',
    email: 'marcos.pinheiro@exemplo.com.br',
    role: 'COORDENADOR',
    createdAt: TIMESTAMP,
  },
];

export const seedProjects: readonly Project[] = [
  {
    id: 'prj-01',
    name: 'Portal do Cliente',
    clientId: 'cli-01',
    objective: 'Centralizar o atendimento e o acompanhamento de entregas em um canal único.',
    managerId: 'usr-03',
    teamId: 'team-01',
    startDate: daysFromToday(-120),
    deadline: daysFromToday(45),
    budget: 480_000,
    budgetSpent: 214_500,
    hoursWorked: 1_240,
    status: 'EM_ANDAMENTO',
    observations: 'Integração com a transportadora depende de homologação do parceiro.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-02',
    name: 'Rastreamento de Frota',
    clientId: 'cli-01',
    objective: 'Acompanhar a frota em tempo real e reduzir atraso na entrega.',
    managerId: 'usr-04',
    teamId: 'team-03',
    // Atrasado: prazo vencido com o projeto ainda ativo (RN08).
    startDate: daysFromToday(-210),
    deadline: daysFromToday(-18),
    budget: 260_000,
    budgetSpent: 251_000,
    hoursWorked: 980,
    status: 'EM_ANDAMENTO',
    observations: 'Replanejamento em discussão com o cliente.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-03',
    name: 'Prontuário Eletrônico',
    clientId: 'cli-02',
    objective: 'Unificar o prontuário das cinco unidades de atendimento.',
    managerId: 'usr-03',
    teamId: 'team-01',
    // Orçamento excedido, mas dentro do prazo (RN03): estouro não bloqueia.
    startDate: daysFromToday(-300),
    deadline: daysFromToday(60),
    budget: 620_000,
    budgetSpent: 704_300,
    hoursWorked: 2_150,
    status: 'EM_RISCO',
    observations: 'Escopo cresceu após a auditoria regulatória.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-04',
    name: 'Agendamento Online',
    clientId: 'cli-02',
    objective: 'Permitir que o paciente marque consulta sem passar pela central.',
    managerId: 'usr-04',
    teamId: 'team-03',
    // Prazo é hoje: NÃO está atrasado (RN08, armadilha A-002).
    startDate: daysFromToday(-90),
    deadline: daysFromToday(0),
    budget: 145_000,
    budgetSpent: 138_900,
    hoursWorked: 620,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-05',
    name: 'Painel de Indicadores Assistenciais',
    clientId: 'cli-02',
    objective: 'Consolidar indicadores clínicos para a diretoria.',
    managerId: 'usr-05',
    teamId: 'team-02',
    // Orçamento ainda não aprovado: consumo indisponível (RN07, armadilha A-001).
    startDate: daysFromToday(20),
    deadline: daysFromToday(200),
    budget: 0,
    budgetSpent: 0,
    hoursWorked: 0,
    status: 'PLANEJAMENTO',
    observations: 'Orçamento em aprovação no comitê.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-06',
    name: 'Modernização do ERP',
    clientId: 'cli-03',
    objective: 'Substituir os módulos legados de estoque e faturamento.',
    managerId: 'usr-03',
    teamId: 'team-01',
    startDate: daysFromToday(-420),
    deadline: daysFromToday(-60),
    budget: 1_250_000,
    budgetSpent: 1_180_000,
    hoursWorked: 5_400,
    status: 'CONCLUIDO',
    observations: 'Entregue com duas semanas de antecedência.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-07',
    name: 'Integração com Cooperativas Regionais',
    clientId: 'cli-03',
    objective: 'Trocar dados de produção com as sete cooperativas filiadas.',
    managerId: 'usr-04',
    teamId: 'team-04',
    // Atrasado e estourado ao mesmo tempo: conta uma única vez em atenção (RN09).
    startDate: daysFromToday(-260),
    deadline: daysFromToday(-35),
    budget: 380_000,
    budgetSpent: 425_600,
    hoursWorked: 1_760,
    status: 'EM_RISCO',
    observations: 'Duas cooperativas ainda não disponibilizaram o ambiente de teste.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-08',
    name: 'App de Vendas Externas',
    clientId: 'cli-04',
    objective: 'Dar autonomia ao representante em campo, inclusive offline.',
    managerId: 'usr-04',
    teamId: 'team-03',
    startDate: daysFromToday(-150),
    deadline: daysFromToday(30),
    budget: 340_000,
    budgetSpent: 189_700,
    hoursWorked: 1_080,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-09',
    name: 'Reformulação do E-commerce',
    clientId: 'cli-04',
    objective: 'Reduzir o abandono de carrinho na etapa de pagamento.',
    managerId: 'usr-03',
    teamId: 'team-01',
    startDate: daysFromToday(-75),
    deadline: daysFromToday(120),
    budget: 560_000,
    budgetSpent: 172_300,
    hoursWorked: 890,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-10',
    name: 'Programa de Fidelidade',
    clientId: 'cli-04',
    objective: 'Criar pontuação e resgate integrados às lojas físicas.',
    managerId: 'usr-05',
    teamId: 'team-04',
    startDate: daysFromToday(-200),
    deadline: daysFromToday(-90),
    budget: 210_000,
    budgetSpent: 96_400,
    hoursWorked: 430,
    status: 'CANCELADO',
    observations: 'Cancelado após revisão da estratégia comercial do cliente.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-11',
    name: 'Plataforma de Assinaturas',
    clientId: 'cli-05',
    objective: 'Gerir assinaturas digitais e impressas em um só cadastro.',
    managerId: 'usr-03',
    teamId: 'team-01',
    startDate: daysFromToday(-330),
    deadline: daysFromToday(-120),
    budget: 430_000,
    budgetSpent: 428_000,
    hoursWorked: 2_010,
    status: 'CONCLUIDO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-12',
    name: 'Catálogo Digital',
    clientId: 'cli-05',
    objective: 'Publicar o acervo com busca por autor, tema e coleção.',
    managerId: 'usr-04',
    teamId: 'team-02',
    startDate: daysFromToday(15),
    deadline: daysFromToday(180),
    budget: 175_000,
    budgetSpent: 0,
    hoursWorked: 0,
    status: 'PLANEJAMENTO',
    observations: 'Início condicionado à entrega da Plataforma de Assinaturas.',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-13',
    name: 'Data Lake Corporativo',
    clientId: 'cli-01',
    objective: 'Centralizar os dados operacionais para análise gerencial.',
    managerId: 'usr-05',
    teamId: 'team-02',
    startDate: daysFromToday(-180),
    deadline: daysFromToday(90),
    budget: 720_000,
    budgetSpent: 355_800,
    hoursWorked: 1_930,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-14',
    name: 'Automação Fiscal',
    clientId: 'cli-03',
    objective: 'Automatizar a apuração fiscal mensal das filiais.',
    managerId: 'usr-03',
    teamId: 'team-04',
    startDate: daysFromToday(-60),
    deadline: daysFromToday(150),
    budget: 295_000,
    budgetSpent: 61_200,
    hoursWorked: 340,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  {
    id: 'prj-15',
    name: 'Portal do Colaborador',
    clientId: 'cli-02',
    objective: 'Reunir holerite, férias e benefícios em um acesso único.',
    managerId: 'usr-05',
    teamId: 'team-03',
    startDate: daysFromToday(-45),
    deadline: daysFromToday(75),
    budget: 168_000,
    budgetSpent: 54_900,
    hoursWorked: 410,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
];
