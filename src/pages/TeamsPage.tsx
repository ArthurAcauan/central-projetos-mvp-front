/**
 * Equipes — lista e cadastro. Layout portado de `Teams.tsx` do protótipo:
 * cards com a carga de trabalho de cada equipe, não tabela.
 *
 * A equipe é associada ao projeto como um todo. Gestão individual de membros
 * está **fora do escopo** do MVP — o cadastro é só o nome, como na modelagem.
 */

import { useMemo, useState } from 'react';
import NameFieldForm from '@/components/registry/NameFieldForm';
import RegistryLayout from '@/components/registry/RegistryLayout';
import { validateTeamName } from '@/domain/registryRules';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRegistry } from '@/hooks/useRegistry';
import { formatTimestamp } from '@/lib/format';
import { isHttpError } from '@/services/http';
import { createTeam, listTeams } from '@/services/teams';
import type { ProjectSummary } from '@/types/project';
import type { Team } from '@/types/team';

const FALLBACK_ERROR = 'Não foi possível cadastrar a equipe. Tente novamente.';

/** Carga de uma equipe. Derivado dos projetos — nada disso é persistido. */
interface TeamWorkload {
  total: number;
  /** Ainda em andamento: planejamento, execução ou risco. */
  active: number;
  finished: number;
}

export default function TeamsPage() {
  useDocumentTitle('Equipes');
  const { items: teams, projects, isLoading, error, reload, addItem } = useRegistry(listTeams);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const workloadByTeam = useMemo(() => summarizeWorkload(projects), [projects]);

  function toggleForm() {
    setIsFormOpen((open) => !open);
    setFieldError(null);
    setSubmitError(null);
  }

  function handleSubmit() {
    const invalid = validateTeamName(name, teams);
    if (invalid !== null) {
      setFieldError(invalid);
      return;
    }

    setFieldError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    createTeam({ name: name.trim() })
      .then((team) => {
        addItem(team);
        setName('');
        setIsFormOpen(false);
        setIsSubmitting(false);
        setSuccessMessage(`Equipe "${team.name}" cadastrada.`);
      })
      .catch((cause: unknown) => {
        setIsSubmitting(false);
        setSubmitError(isHttpError(cause) ? cause.message : FALLBACK_ERROR);
      });
  }

  return (
    <RegistryLayout
      error={error}
      form={
        <NameFieldForm
          error={fieldError}
          isSubmitting={isSubmitting}
          label="Nome da equipe"
          legend="Nova equipe"
          onChange={(value) => {
            setName(value);
            setFieldError(null);
          }}
          onSubmit={handleSubmit}
          placeholder="Ex.: Squad Alpha"
          submitError={submitError}
          value={name}
        />
      }
      isFormOpen={isFormOpen}
      isLoading={isLoading}
      newLabel="Nova equipe"
      onRetry={reload}
      onToggleForm={toggleForm}
      subtitle={
        isLoading || error !== null
          ? 'Equipes responsáveis pelos projetos'
          : `${teams.length} ${teams.length === 1 ? 'equipe cadastrada' : 'equipes cadastradas'}`
      }
      successMessage={successMessage}
      title="Equipes"
    >
      {teams.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Nenhuma equipe cadastrada.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              workload={workloadByTeam.get(team.id) ?? EMPTY_WORKLOAD}
            />
          ))}
        </ul>
      )}
    </RegistryLayout>
  );
}

const EMPTY_WORKLOAD: TeamWorkload = { total: 0, active: 0, finished: 0 };

/**
 * Cancelado não entra em "ativos" nem em "concluídos": o projeto existe, mas
 * não representa carga nem entrega. A soma das colunas pode ser menor que o
 * total, e é isso mesmo.
 */
function summarizeWorkload(projects: ProjectSummary[]): Map<string, TeamWorkload> {
  const byTeam = new Map<string, TeamWorkload>();
  for (const project of projects) {
    const current = byTeam.get(project.team.id) ?? { ...EMPTY_WORKLOAD };
    current.total += 1;
    if (project.status === 'CONCLUIDO') {
      current.finished += 1;
    } else if (project.status !== 'CANCELADO') {
      current.active += 1;
    }
    byTeam.set(project.team.id, current);
  }
  return byTeam;
}

function TeamCard({ team, workload }: { team: Team; workload: TeamWorkload }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white"
        >
          {initialsOf(team.name)}
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{team.name}</h2>
          <p className="font-mono text-[10px] text-slate-500">
            desde {formatTimestamp(team.createdAt)}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
        <Metric label="total" tone="text-slate-800" value={workload.total} />
        <Metric label="ativos" tone="text-blue-600" value={workload.active} />
        <Metric label="concluídos" tone="text-emerald-600" value={workload.finished} />
      </dl>
    </li>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <dd className={`font-mono text-lg font-bold ${tone}`}>{value}</dd>
      <dt className="text-[10px] text-slate-500">{label}</dt>
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
