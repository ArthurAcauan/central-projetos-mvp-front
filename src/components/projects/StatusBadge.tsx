import { projectStatusLabels, type ProjectStatus } from '@/types/project';

/**
 * Etiqueta de status do projeto. Cores portadas do `StatusBadge.tsx` do
 * protótipo (ADR-0003) — mesma leitura visual em qualquer tela que mostre
 * status.
 *
 * O rótulo vem de `projectStatusLabels`: o literal do contrato (`EM_ANDAMENTO`)
 * nunca aparece cru na interface.
 */

const statusClasses: Record<ProjectStatus, string> = {
  PLANEJAMENTO: 'bg-slate-100 text-slate-600 border-slate-200',
  EM_ANDAMENTO: 'bg-blue-50 text-blue-700 border-blue-200',
  EM_RISCO: 'bg-red-50 text-red-700 border-red-200',
  CONCLUIDO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-gray-100 text-gray-500 border-gray-200',
};

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium ${sizeClass} ${statusClasses[status]}`}
    >
      {status === 'EM_RISCO' && (
        // `motion-safe:` respeita quem pediu menos animação no sistema.
        <span
          aria-hidden="true"
          className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse"
        />
      )}
      {projectStatusLabels[status]}
    </span>
  );
}
