/**
 * Card de indicador do dashboard (RF07). Layout portado do `KPICard` do
 * protótipo.
 *
 * Recebe texto já formatado: quem calcula é `domain/indicators.ts` e quem
 * formata é `lib/format.ts` (ADR-0005). Este componente não faz conta.
 */

const toneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  slate: 'border-slate-200 bg-white text-slate-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
} as const;

export type KpiTone = keyof typeof toneClasses;

export interface KpiCardProps {
  label: string;
  /** Número principal, já formatado. */
  value: string;
  /** Leitura de apoio abaixo do número. */
  detail: string;
  tone: KpiTone;
}

/**
 * O rótulo e o detalhe usam a cor cheia do tom, e não uma versão esmaecida por
 * `opacity` como no protótipo: a 60% de opacidade sobre o fundo claro do card,
 * o detalhe de 11px cai para cerca de 4:1 de contraste e reprova no critério de
 * texto pequeno (F5-2). A hierarquia continua vindo do tamanho e do peso — o
 * valor é o dobro do tamanho e vem em negrito.
 */
export default function KpiCard({ label, value, detail, tone }: KpiCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <p className="mb-1 text-xs font-medium">{label}</p>
      <p className="font-mono text-2xl font-bold">{value}</p>
      <p className="mt-1 font-mono text-[11px]">{detail}</p>
    </div>
  );
}
