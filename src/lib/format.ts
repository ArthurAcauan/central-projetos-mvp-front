/**
 * Formatação pt-BR para exibição (RNF02).
 *
 * Camada de apresentação, não de domínio: aqui não há regra de negócio, só a
 * tradução de um valor já calculado para o texto que aparece na tela. O cálculo
 * continua vindo de `domain/indicators.ts` — esta camada nunca decide, por
 * exemplo, se um projeto está atrasado.
 *
 * Existe para que moeda, data e percentual saiam iguais em todas as telas: a
 * lista, os detalhes e o dashboard mostram o mesmo número do mesmo jeito.
 */

import { parseCalendarDate } from '@/domain/indicators';

/** Texto exibido quando o valor não existe ou não é calculável (ex.: RN07). */
export const EMPTY_VALUE = '—';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/**
 * Reais sem centavos, como no protótipo: nas listas e nos cards o que importa é
 * a ordem de grandeza, e a coluna fica legível. Onde o centavo importar, use um
 * formatador próprio em vez de mudar este.
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/**
 * Data de calendário `YYYY-MM-DD` → `dd/mm/aaaa`.
 *
 * Passa por {@link parseCalendarDate} de propósito: `new Date('2026-08-06')` é
 * meia-noite UTC e, em UTC-3, imprimiria 05/08 (armadilha A-002). Valor ausente
 * ou inválido vira {@link EMPTY_VALUE} em vez de "Invalid Date".
 */
export function formatDate(value: string | null | undefined): string {
  const date = parseCalendarDate(value);
  return date === null ? EMPTY_VALUE : dateFormatter.format(date);
}

/**
 * Percentual com uma casa decimal. `null` — o consumo de um projeto sem
 * orçamento previsto (RN07) — vira {@link EMPTY_VALUE}, nunca `0%`: são
 * situações diferentes e o gestor precisa distingui-las.
 */
export function formatPercent(value: number | null): string {
  if (value === null) {
    return EMPTY_VALUE;
  }
  return `${value.toFixed(1).replace('.', ',')}%`;
}

/** Quantidades inteiras com separador de milhar (horas, contagens). */
export function formatNumber(value: number): string {
  return integerFormatter.format(value);
}
