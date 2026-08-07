/**
 * Clientes (RF02) — lista e cadastro. Layout portado de `Clients.tsx` do
 * protótipo.
 *
 * A validação vem de `domain/registryRules.ts` e o HTTP de `services/clients`.
 * A contagem de projetos por cliente é derivada dos projetos já carregados —
 * não existe campo `projectCount` na modelagem e não deve existir.
 */

import { useMemo, useState } from 'react';
import TableScroll from '@/components/TableScroll';
import NameFieldForm from '@/components/registry/NameFieldForm';
import RegistryLayout from '@/components/registry/RegistryLayout';
import { validateClientName } from '@/domain/registryRules';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRegistry } from '@/hooks/useRegistry';
import { formatTimestamp } from '@/lib/format';
import { isHttpError } from '@/services/http';
import { createClient, listClients } from '@/services/clients';
import type { Client } from '@/types/client';

const FALLBACK_ERROR = 'Não foi possível cadastrar o cliente. Tente novamente.';

export default function ClientsPage() {
  useDocumentTitle('Clientes');
  const { items: clients, projects, isLoading, error, reload, addItem } = useRegistry(listClients);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const projectCountByClient = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      counts.set(project.client.id, (counts.get(project.client.id) ?? 0) + 1);
    }
    return counts;
  }, [projects]);

  function toggleForm() {
    setIsFormOpen((open) => !open);
    setFieldError(null);
    setSubmitError(null);
  }

  function handleSubmit() {
    const invalid = validateClientName(name, clients);
    if (invalid !== null) {
      setFieldError(invalid);
      return;
    }

    setFieldError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    createClient({ name: name.trim() })
      .then((client) => {
        addItem(client);
        setName('');
        setIsFormOpen(false);
        setIsSubmitting(false);
        setSuccessMessage(`Cliente "${client.name}" cadastrado.`);
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
          label="Nome do cliente"
          legend="Novo cliente"
          onChange={(value) => {
            setName(value);
            setFieldError(null);
          }}
          onSubmit={handleSubmit}
          placeholder="Ex.: Grupo Bancário Meridional"
          submitError={submitError}
          value={name}
        />
      }
      isFormOpen={isFormOpen}
      isLoading={isLoading}
      newLabel="Novo cliente"
      onRetry={reload}
      onToggleForm={toggleForm}
      subtitle={
        isLoading || error !== null
          ? 'Clientes atendidos pela organização'
          : `${clients.length} ${clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`
      }
      successMessage={successMessage}
      title="Clientes"
    >
      <TableScroll
        className="rounded-lg border border-slate-200 bg-white"
        label="Clientes cadastrados"
      >
        <table className="w-full min-w-lg text-sm">
          <caption className="sr-only">Clientes cadastrados</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-500 uppercase">
              <th className="px-4 py-3 text-left font-medium" scope="col">
                Cliente
              </th>
              <th className="px-4 py-3 text-left font-medium" scope="col">
                Projetos
              </th>
              <th className="px-4 py-3 text-left font-medium" scope="col">
                Cadastrado em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={3}>
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <ClientRow
                  client={client}
                  key={client.id}
                  projectCount={projectCountByClient.get(client.id) ?? 0}
                />
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
    </RegistryLayout>
  );
}

function ClientRow({ client, projectCount }: { client: Client; projectCount: number }) {
  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 font-mono text-[10px] font-bold text-blue-500"
          >
            {client.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-medium text-slate-800">{client.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
          {projectCount} {projectCount === 1 ? 'projeto' : 'projetos'}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">
        {formatTimestamp(client.createdAt)}
      </td>
    </tr>
  );
}
