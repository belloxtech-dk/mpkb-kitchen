/** SSOT for value formatting (Indonesian locale). */

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("id-ID");

export function formatIdr(amount: number): string {
  return IDR.format(Math.round(amount));
}

export function formatNumber(value: number): string {
  return NUM.format(value);
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}
