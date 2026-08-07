import { projectStatusLabel, type ProjectStatus } from '@/types/project';

/**
 * Etiqueta de status do projeto. Cores portadas do `StatusBadge.tsx` do
 * protótipo (ADR-0003) — mesma leitura visual em qualquer tela que mostre
 * status.
 *
 * O rótulo vem de `projectStatusLabel`: o literal do contrato (`EM_ANDAMENTO`)
 * nunca aparece cru na interface — a menos que o status **não** seja um dos
 * cinco canônicos, e aí aparecer cru é o comportamento certo. A API devolve
 * valor fora da lista de propósito, para denunciar dado corrompido em vez de
 * escondê-lo; um mapa sem valor padrão quebraria a linha inteira da tabela.
 */

const statusClasses: Record<string, string> = {
  PLANEJAMENTO: 'bg-slate-100 text-slate-600 border-slate-200',
  EM_ANDAMENTO: 'bg-blue-50 text-blue-700 border-blue-200',
  EM_RISCO: 'bg-red-50 text-red-700 border-red-200',
  CONCLUIDO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-gray-100 text-gray-500 border-gray-200',
};

/** Status desconhecido fica visível, em tom neutro e sem cor de significado. */
const UNKNOWN_STATUS_CLASS = 'bg-amber-50 text-amber-700 border-amber-200';

interface StatusBadgeProps {
  /** Vem da API como `string`; `ProjectStatus` é aceito por ser um subtipo. */
  status: ProjectStatus | string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium ${sizeClass} ${
        statusClasses[status] ?? UNKNOWN_STATUS_CLASS
      }`}
    >
      {status === 'EM_RISCO' && (
        // `motion-safe:` respeita quem pediu menos animação no sistema.
        <span
          aria-hidden="true"
          className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse"
        />
      )}
      {projectStatusLabel(status)}
    </span>
  );
}
