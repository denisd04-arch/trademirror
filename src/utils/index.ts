import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatLot(value: number): string {
  return value.toFixed(2);
}

export function formatCurrency(value: number, currency: 'USD' | 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : '$';
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = value < 0 ? '-' : '+';
  return `${prefix}${symbol}${formatted}`;
}

export function formatRiskPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatCrv(value: number): string {
  return `${value.toFixed(2)} : 1`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function generateTradeId(): string {
  return crypto.randomUUID();
}
