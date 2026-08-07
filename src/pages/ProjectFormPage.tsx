/**
 * Cadastro (RF03) e atualização (RF06) de projeto — uma página só.
 *
 * As duas telas têm os mesmos campos, as mesmas regras e os mesmos estados; o
 * que muda é o valor inicial, o serviço chamado e três rótulos. Separá-las
 * criaria duas cópias das regras de exibição que precisam concordar — o modo é
 * decidido pela presença do `:id` na rota.
 *
 * A página orquestra e não decide: quem diz o que é válido é
 * `domain/projectRules.ts`, quem fala HTTP é `services/projects.ts`. O estouro
 * de orçamento aparece como aviso e **não** bloqueia o salvamento (RN03,
 * armadilha A-003).
 */

import { Link, useNavigate, useParams } from 'react-router-dom';
import ProjectForm from '@/components/projects/ProjectForm';
import type { ProjectFormValues } from '@/domain/projectRules';
import { useProjectFormData } from '@/hooks/useProjectFormData';
import { toFormValues, useProjectFormState } from '@/hooks/useProjectFormState';
import { paths, projectDetailPath } from '@/routes/paths';
import { createProject, updateProject } from '@/services/projects';
import type { Client } from '@/types/client';
import type { Project } from '@/types/project';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

const CREATE_ERROR = 'Não foi possível cadastrar o projeto. Tente novamente.';
const UPDATE_ERROR = 'Não foi possível salvar as alterações. Tente novamente.';

/**
 * Projeto novo começa em planejamento, sem consumo. `budgetSpent` e
 * `hoursWorked` começam em `0` em vez de vazio porque o RF03 os exige no
 * cadastro e zero é o caso comum — deixar vazio só produziria erro de campo
 * obrigatório na primeira tentativa de todo mundo.
 */
const BLANK_VALUES: ProjectFormValues = {
  name: '',
  clientId: '',
  objective: '',
  managerId: '',
  teamId: '',
  startDate: '',
  deadline: '',
  budget: null,
  budgetSpent: 0,
  hoursWorked: 0,
  status: 'PLANEJAMENTO',
  observations: '',
};

export default function ProjectFormPage() {
  // Sem `:id` na rota é cadastro; com `:id` é edição do projeto correspondente.
  const { id } = useParams<{ id: string }>();
  const { project, clients, users, teams, isLoading, error, reload } = useProjectFormData(id);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5 flex items-center gap-3">
        <Link
          className="text-sm text-slate-400 transition-colors hover:text-slate-700"
          to={id === undefined ? paths.projects : projectDetailPath(id)}
        >
          <span aria-hidden="true">←</span> Voltar
        </Link>
        <div aria-hidden="true" className="h-5 w-px bg-slate-200" />
        <h1 className="text-xl font-semibold text-slate-900">
          {id === undefined ? 'Novo projeto' : 'Editar projeto'}
        </h1>
      </div>

      {isLoading && (
        <p
          className="max-w-3xl rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400"
          role="status"
        >
          Carregando formulário...
        </p>
      )}

      {!isLoading && error !== null && (
        <div
          className="max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center"
          role="alert"
        >
          <p className="text-sm text-red-700">{error}</p>
          <button
            className="mt-3 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={reload}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* O editor só monta com os dados em mãos: assim o preenchimento inicial
          da edição é o estado inicial do `useState`, e não um `setState` dentro
          de efeito (lição L-004). A `key` refaz o estado se o projeto trocar. */}
      {!isLoading && error === null && (
        <ProjectEditor
          clients={clients}
          key={project?.id ?? 'new'}
          project={project}
          teams={teams}
          users={users}
        />
      )}
    </div>
  );
}

interface ProjectEditorProps {
  /** `null` no cadastro; o projeto carregado na edição. */
  project: Project | null;
  clients: Client[];
  users: User[];
  teams: Team[];
}

function ProjectEditor({ project, clients, users, teams }: ProjectEditorProps) {
  const navigate = useNavigate();
  const isEdit = project !== null;

  const { values, errors, warnings, isSubmitting, submitError, change, submit } =
    useProjectFormState({
      initialValues: project === null ? BLANK_VALUES : toFormValues(project),
      save: (input) => (project === null ? createProject(input) : updateProject(project.id, input)),
      // Detalhes do projeto salvo: confirma a operação com o dado que voltou.
      onSaved: (saved) => navigate(projectDetailPath(saved.id), { replace: true }),
      fallbackError: project === null ? CREATE_ERROR : UPDATE_ERROR,
      currentStatus: project?.status,
    });

  return (
    <>
      {submitError !== null && (
        <div
          className="mb-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <ProjectForm
        clients={clients}
        errors={errors}
        isSubmitting={isSubmitting}
        onCancel={() => navigate(project === null ? paths.projects : projectDetailPath(project.id))}
        onChange={change}
        onSubmit={submit}
        currentStatus={project?.status}
        submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar projeto'}
        teams={teams}
        users={users}
        values={values}
        warnings={warnings}
      />
    </>
  );
}
