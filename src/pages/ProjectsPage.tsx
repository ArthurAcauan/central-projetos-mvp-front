/**
 * Consulta de projetos (RF04) — layout portado de `Projects.tsx` do protótipo.
 *
 * A página só apresenta: os dados vêm de `useProjectsList`, o recorte de
 * `domain/projectFilters` e todo indicador de `domain/indicators`. Nenhum
 * cálculo de "atrasado" ou "% consumido" nasce aqui (armadilha A-005).
 *
 * O destaque de atraso e de estouro atende também ao RF09 nesta tela.
 */

import { useMemo, useState } from 'react';
import StatusBadge from '@/components/projects/StatusBadge';
import { budgetConsumptionPercent, isLate, isOverBudget } from '@/domain/indicators';
import {
  emptyProjectFilters,
  filterProjects,
  hasActiveFilters,
  type ProjectFilters,
} from '@/domain/projectFilters';
import { useProjectsList } from '@/hooks/useProjectsList';
import { EMPTY_VALUE, formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { isProjectStatus, projectStatuses, projectStatusLabels } from '@/types/project';

const COLUMN_COUNT = 7;

const inputClass =
  'rounded border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500';

export default function ProjectsPage() {
  const { projects, clients, users, isLoading, error, reload } = useProjectsList();
  const [filters, setFilters] = useState<ProjectFilters>(emptyProjectFilters);

  const filtered = useMemo(
    () => filterProjects(projects, filters, { clients, users }),
    [projects, filters, clients, users]
  );

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );
  const managerNameById = useMemo(
    () => new Map(users.map((user) => [user.id, user.name])),
    [users]
  );

  const filtersActive = hasActiveFilters(filters);

  return (
    <div className="flex-1 overflow-auto p-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Projetos</h1>
        <p aria-live="polite" className="mt-0.5 font-mono text-sm text-slate-500">
          {isLoading || error
            ? 'Consulta dos projetos cadastrados'
            : `${filtered.length} de ${projects.length} projetos`}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-52 flex-1">
          <label className="sr-only" htmlFor="project-search">
            Buscar projeto
          </label>
          <input
            className={`${inputClass} w-full`}
            disabled={isLoading || error !== null}
            id="project-search"
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Buscar por nome, cliente ou gestor..."
            type="search"
            value={filters.search}
          />
        </div>

        <div>
          <label className="sr-only" htmlFor="project-status">
            Filtrar por status
          </label>
          <select
            className={inputClass}
            disabled={isLoading || error !== null}
            id="project-status"
            onChange={(event) => {
              const value = event.target.value;
              setFilters({ ...filters, status: isProjectStatus(value) ? value : '' });
            }}
            value={filters.status}
          >
            <option value="">Todos os status</option>
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="sr-only" htmlFor="project-client">
            Filtrar por cliente
          </label>
          <select
            className={inputClass}
            disabled={isLoading || error !== null}
            id="project-client"
            onChange={(event) => setFilters({ ...filters, clientId: event.target.value })}
            value={filters.clientId}
          >
            <option value="">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <p
          className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400"
          role="status"
        >
          Carregando projetos...
        </p>
      )}

      {!isLoading && error !== null && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center"
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

      {!isLoading && error === null && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">Projetos cadastrados</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-400 uppercase">
                <th className="px-4 py-3 text-left font-medium" scope="col">
                  Projeto
                </th>
                <th className="px-4 py-3 text-left font-medium" scope="col">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left font-medium" scope="col">
                  Gestor
                </th>
                <th className="px-4 py-3 text-left font-medium" scope="col">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium" scope="col">
                  Prazo
                </th>
                <th className="px-4 py-3 text-right font-medium" scope="col">
                  Orçamento
                </th>
                <th className="px-4 py-3 text-right font-medium" scope="col">
                  Consumo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-400"
                    colSpan={COLUMN_COUNT}
                  >
                    {filtersActive ? (
                      <>
                        Nenhum projeto encontrado com os filtros aplicados.
                        <button
                          className="ml-2 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
                          onClick={() => setFilters(emptyProjectFilters)}
                          type="button"
                        >
                          Limpar filtros
                        </button>
                      </>
                    ) : (
                      'Nenhum projeto cadastrado.'
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((project) => {
                  const late = isLate(project);
                  const overBudget = isOverBudget(project);
                  const percent = budgetConsumptionPercent(project);
                  // Sem orçamento previsto não há consumo a comparar (RN07).
                  const nearLimit = percent !== null && percent > 80;

                  return (
                    <tr className="transition-colors hover:bg-slate-50" key={project.id}>
                      <td className="px-4 py-3">
                        <div className="max-w-52 truncate font-medium text-slate-900">
                          {project.name}
                        </div>
                        {(late || overBudget) && (
                          <div className="mt-0.5 flex gap-1 font-mono text-[10px]">
                            {late && <span className="text-red-500">Atrasado</span>}
                            {late && overBudget && (
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                            )}
                            {overBudget && <span className="text-orange-500">Orç. excedido</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {clientNameById.get(project.clientId) ?? EMPTY_VALUE}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {managerNameById.get(project.managerId) ?? EMPTY_VALUE}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge size="sm" status={project.status} />
                      </td>
                      <td
                        className={`px-4 py-3 font-mono text-xs ${
                          late ? 'font-medium text-red-600' : 'text-slate-600'
                        }`}
                      >
                        {formatDate(project.deadline)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                        {formatCurrency(project.budget)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className={`font-mono text-xs font-medium ${
                            overBudget
                              ? 'text-red-600'
                              : nearLimit
                                ? 'text-orange-600'
                                : 'text-slate-600'
                          }`}
                        >
                          {formatPercent(percent)}
                        </div>
                        {percent !== null && (
                          <div className="mt-1 ml-auto h-1 w-16 rounded-full bg-slate-100">
                            <div
                              className={`h-1 rounded-full ${
                                overBudget
                                  ? 'bg-red-500'
                                  : nearLimit
                                    ? 'bg-orange-400'
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
