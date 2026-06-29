import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { transaccionesApi } from '../services/api';
import { formatCurrency, formatDate, getTipoTransaccionConfig } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { Search, Plus, Loader2, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

export function TransaccionesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['transacciones', search],
    queryFn: () => transaccionesApi.list({ search, limit: 50 }),
  });

  const filteredData = data?.data?.filter(t =>
    t.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    t.tipo?.toLowerCase().includes(search.toLowerCase()) ||
    t.cliente?.nombre?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalIngresos = filteredData.filter(t => t.tipo === 'pago').reduce((sum, t) => sum + t.monto, 0);
  const totalEgresos = filteredData.filter(t => t.tipo !== 'pago').reduce((sum, t) => sum + t.monto, 0);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Transacciones</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Registro financiero de pagos y movimientos</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Nueva Transacción</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Ingresos Totales</p>
              <p className="text-3xl font-bold text-green-400">{totalIngresos.toLocaleString('es-VE', { style: 'currency', currency: 'USD' })}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Egresos Totales</p>
              <p className="text-3xl font-bold text-red-400">{totalEgresos.toLocaleString('es-VE', { style: 'currency', currency: 'USD' })}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Balance Neto</p>
              <p className={cn('text-3xl font-bold', totalIngresos - totalEgresos >= 0 ? 'text-green-400' : 'text-red-400')}>
                {(totalIngresos - totalEgresos).toLocaleString('es-VE', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <ArrowRightLeft className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <input type="search" placeholder="Buscar transacciones..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-md pl-10 pr-4 py-2 text-sm bg-[rgb(var(--input))] border border-border rounded-btn text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
        </div>

        <div className="p-4 table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Descripción</th>
                <th>Cliente</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((t: any) => {
                const config = getTipoTransaccionConfig(t.tipo);
                return (
                  <tr key={t.id}>
                    <td>{formatDate(t.fecha || t.createdAt)}</td>
                    <td><span className={cn('badge', config.className || 'badge-muted')}>{config.prefix} {config.label}</span></td>
                    <td className={cn('font-medium', t.tipo === 'reembolso' ? 'text-red-400' : t.tipo === 'pago' ? 'text-green-400' : 'text-blue-400')}>
                      {t.tipo === 'reembolso' ? '-' : '+'}{t.monto.toLocaleString('es-VE', { style: 'currency', currency: 'USD' })}
                    </td>
                    <td>{t.metodo}</td>
                    <td>{t.descripcion || '—'}</td>
                    <td>{t.cliente?.nombre || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
