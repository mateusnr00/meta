/**
 * Helpers para cálculo de fatura de cartão de crédito.
 *
 * A fatura "em aberto" é aquela cujo fechamento ainda não passou.
 * Compras entre (último fechamento + 1 dia) e (próximo fechamento)
 * caem nessa fatura.
 */

export interface InvoiceWindow {
  /** Início da janela (inclusive) */
  periodStart: Date;
  /** Fim da janela = próximo fechamento (inclusive) */
  closingDate: Date;
  /** Data de vencimento dessa fatura */
  dueDate: Date;
  /** Label humano, ex: "Fatura de Dezembro/2025" */
  label: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function clampDay(year: number, monthZeroBased: number, day: number): Date {
  const lastDay = new Date(year, monthZeroBased + 1, 0).getDate();
  return new Date(year, monthZeroBased, Math.min(day, lastDay), 0, 0, 0, 0);
}

/**
 * Retorna a fatura em aberto hoje.
 */
export function currentOpenInvoice(
  closingDay: number,
  dueDay: number,
  reference: Date = new Date(),
): InvoiceWindow {
  const today = new Date(reference);
  today.setHours(0, 0, 0, 0);
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();

  // Próximo fechamento (closing date)
  let closingMonth = month;
  let closingYear = year;
  if (day > closingDay) {
    // Já passou do fechamento deste mês → fatura fecha mês que vem
    closingMonth += 1;
  }
  if (closingMonth > 11) {
    closingMonth -= 12;
    closingYear += 1;
  }
  const closingDate = clampDay(closingYear, closingMonth, closingDay);

  // Janela: dia após fechamento anterior até closingDate
  let prevClosingMonth = closingMonth - 1;
  let prevClosingYear = closingYear;
  if (prevClosingMonth < 0) {
    prevClosingMonth += 12;
    prevClosingYear -= 1;
  }
  const prevClosing = clampDay(prevClosingYear, prevClosingMonth, closingDay);
  const periodStart = new Date(prevClosing);
  periodStart.setDate(periodStart.getDate() + 1);
  periodStart.setHours(0, 0, 0, 0);

  // Vencimento: mesmo mês do fechamento se due_day > closing_day, senão mês seguinte
  let dueMonth = closingMonth;
  let dueYear = closingYear;
  if (dueDay <= closingDay) {
    dueMonth += 1;
  }
  if (dueMonth > 11) {
    dueMonth -= 12;
    dueYear += 1;
  }
  const dueDate = clampDay(dueYear, dueMonth, dueDay);

  return {
    periodStart,
    closingDate,
    dueDate,
    label: `Fatura de ${MONTH_NAMES[dueMonth]}/${dueYear}`,
  };
}

/**
 * Retorna a fatura que VENCE em targetMonth/targetYear.
 * Ex: C6 closing=25 due=4, invoiceForDueMonth(4, 2026, 25, 4) →
 *   dueDate: 04/04/2026, closingDate: 25/03/2026, window: 26/02/2026 → 25/03/2026
 */
export function invoiceForDueMonth(
  targetMonth: number, // 1-12
  targetYear: number,
  closingDay: number,
  dueDay: number,
): InvoiceWindow {
  const dueDate = clampDay(targetYear, targetMonth - 1, dueDay);

  // Fechamento é no mês anterior se due_day > closing_day, senão mesmo mês
  let closingMonthIdx = targetMonth - 1;
  let closingYear = targetYear;
  if (dueDay > closingDay) {
    closingMonthIdx -= 1;
  }
  if (closingMonthIdx < 0) {
    closingMonthIdx += 12;
    closingYear -= 1;
  }
  const closingDate = clampDay(closingYear, closingMonthIdx, closingDay);

  // Janela começa no dia seguinte ao fechamento anterior
  let prevClosingMonthIdx = closingMonthIdx - 1;
  let prevClosingYear = closingYear;
  if (prevClosingMonthIdx < 0) {
    prevClosingMonthIdx += 12;
    prevClosingYear -= 1;
  }
  const prevClosing = clampDay(
    prevClosingYear,
    prevClosingMonthIdx,
    closingDay,
  );
  const periodStart = new Date(prevClosing);
  periodStart.setDate(periodStart.getDate() + 1);
  periodStart.setHours(0, 0, 0, 0);

  return {
    periodStart,
    closingDate,
    dueDate,
    label: `Fatura de ${MONTH_NAMES[targetMonth - 1]}/${targetYear}`,
  };
}

export function daysUntil(date: Date, reference: Date = new Date()): number {
  const a = new Date(date);
  a.setHours(0, 0, 0, 0);
  const b = new Date(reference);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
