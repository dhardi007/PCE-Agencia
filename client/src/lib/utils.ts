import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export const statusConfig = {
  activa: { label: 'Activa', className: 'badge-primary', icon: '🔵' },
  completada: { label: 'Completada', className: 'badge-success', icon: '🟢' },
  cancelada: { label: 'Cancelada', className: 'badge-danger', icon: '🔴' },
  pendiente: { label: 'Pendiente', className: 'badge-warning', icon: '🟡' },
  confirmado: { label: 'Confirmado', className: 'badge-success', icon: '✅' },
  pagada: { label: 'Pagada', className: 'badge-success', icon: '💰' },
  anulada: { label: 'Anulada', className: 'badge-muted', icon: '❌' },
} as const;

export type StatusKey = keyof typeof statusConfig;

export function getStatusConfig(status: string) {
  return statusConfig[status as StatusKey] || { label: status, className: 'badge-muted', icon: '⚪' };
}

export const tipoTransaccionConfig = {
  pago: { label: 'Pago', className: 'text-green-400', prefix: '+' },
  reembolso: { label: 'Reembolso', className: 'text-red-400', prefix: '-' },
  pago_proveedor: { label: 'Pago Proveedor', className: 'text-blue-400', prefix: '-' },
} as const;

export function getTipoTransaccionConfig(tipo: string) {
  return tipoTransaccionConfig[tipo as keyof typeof tipoTransaccionConfig] || { label: tipo, className: '', prefix: '' };
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}