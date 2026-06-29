import { Users, Briefcase, Plane, Calendar, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { clientesApi, reservasApi, proveedoresApi, transaccionesApi, facturasApi } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';

const statCards = [
  { key: 'clientes', label: 'Clientes', icon: Users, color: 'bg-blue-500/20 text-blue-400', api: clientesApi },
  { key: 'reservas', label: 'Reservas Activas', icon: Calendar, color: 'bg-green-500/20 text-green-400', api: reservasApi },
  { key: 'proveedores', label: 'Proveedores', icon: Briefcase, color: 'bg-purple-500/20 text-purple-400', api: proveedoresApi },
  { key: 'ingresos', label: 'Ingresos Totales', icon: DollarSign, color: 'bg-yellow-500/20 text-yellow-400', api: transaccionesApi },
];

export function OverviewPage() {
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => clientesApi.list({ limit: 1 }) });
  const { data: reservas } = useQuery({ queryKey: ['reservas'], queryFn: () => reservasApi.list({ estadoGeneral: 'activa', limit: 1 }) });
  const { data: proveedores } = useQuery({ queryKey: ['proveedores'], queryFn: () => proveedoresApi.list({ limit: 1 }) });
  const { data: transacciones } = useQuery({ queryKey: ['transacciones'], queryFn: () => transaccionesApi.list({ tipo: 'pago', limit: 100 }) });

  const totalClientes = clientes?.meta?.total || 0;
  const totalReservas = reservas?.meta?.total || 0;
  const totalProveedores = proveedores?.meta?.total || 0;
  const totalIngresos = transacciones?.data?.reduce((sum: number, t: any) => sum + (t.monto || 0), 0) || 0;

  const stats = [
    { label: 'Clientes', value: totalClientes, icon: Users, color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Reservas Activas', value: totalReservas, icon: Calendar, color: 'bg-green-500/20 text-green-400' },
    { label: 'Proveedores', value: totalProveedores, icon: Briefcase, color: 'bg-purple-500/20 text-purple-400' },
    { label: 'Ingresos Totales', value: formatCurrency(totalIngresos), icon: DollarSign, color: 'bg-yellow-500/20 text-yellow-400' },
  ];

  const { data: recentReservas } = useQuery({ queryKey: ['reservas', 'recent'], queryFn: () => reservasApi.list({ limit: 5, sort: 'createdAt', order: 'desc' }) });
  const { data: recentTransacciones } = useQuery({ queryKey: ['transacciones', 'recent'], queryFn: () => transaccionesApi.list({ limit: 5, sort: 'createdAt', order: 'desc' }) });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Resumen General</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Visión general de tu agencia de viajes</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">{stat.label}</p>
                <p className="text-3xl font-bold text-[rgb(var(--foreground))] mt-1">{stat.value}</p>
              </div>
              <div className={cn('p-3 rounded-xl', stat.color)}>
                <stat.icon className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Reservas Recientes</h2>
            <a href="/reservas" className="text-sm text-blue-400 hover:underline">Ver todas</a>
          </div>
          <div className="divide-y divide-border">
            {(recentReservas?.data || []).length === 0 ? (
              <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">
                No hay reservas recientes
              </div>
            ) : (
              recentReservas?.data?.map((reserva: any) => (
                <div key={reserva.id} className="p-4 flex items-center justify-between hover:bg-[rgb(var(--accent))]/50">
                  <div>
                    <p className="font-medium text-[rgb(var(--foreground))]">{reserva.cliente?.nombre || 'Cliente'}</p>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">{reserva.itinerario?.titulo || 'Sin itinerario'} — {reserva.servicios?.length || 0} servicios</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">{reserva.estadoGeneral}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Transacciones Recientes</h2>
            <a href="/transacciones" className="text-sm text-blue-400 hover:underline">Ver todas</a>
          </div>
          <div className="divide-y divide-border">
            {(recentTransacciones?.data?.data || []).length === 0 ? (
              <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">
                No hay transacciones recientes
              </div>
            ) : (
              recentTransacciones?.data?.data?.map((t: any) => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-[rgb(var(--accent))]/50">
                  <div>
                    <p className="font-medium text-[rgb(var(--foreground))]">{t.descripcion || t.tipo}</p>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">{t.cliente?.nombre || 'Cliente'}</p>
                  </div>
                  <span className={cn('font-medium', t.tipo === 'reembolso' ? 'text-red-400' : 'text-green-400')}>
                    {t.tipo === 'reembolso' ? '-' : '+'}{t.monto.toLocaleString('es-VE', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}