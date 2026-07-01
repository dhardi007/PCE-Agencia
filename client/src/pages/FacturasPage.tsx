import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { facturasApi } from '../services/api';
import { formatDate, formatCurrency, getStatusConfig } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { Plus, Search, Edit, Trash2, Loader2, FileText, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const facturaSchema = z.object({
  reservaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  numero: z.string().min(1),
  items: z.array(z.object({
    descripcion: z.string(),
    cantidad: z.number().int().positive(),
    precioUnitario: z.number().positive(),
    subtotal: z.number().positive(),
  })).min(1),
  total: z.number().positive(),
  estado: z.enum(['pendiente', 'pagada', 'anulada']).default('pendiente'),
});

type FacturaForm = z.infer<typeof facturaSchema>;

export function FacturasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['facturas', search],
    queryFn: () => facturasApi.list({ search, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: FacturaForm) => facturasApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['facturas'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FacturaForm> }) => facturasApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['facturas'] }); setShowModal(false); setEditingFactura(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facturasApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facturas'] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FacturaForm>({
    resolver: zodResolver(facturaSchema),
    defaultValues: { reservaId: '', clienteId: '', numero: '', items: [], total: 0, estado: 'pendiente' },
  });

  const onSubmit = (data: FacturaForm) => {
    if (editingFactura) updateMutation.mutate({ id: editingFactura.id, data });
    else createMutation.mutate(data);
    reset();
  };

  const openCreate = () => { setEditingFactura(null); reset(); setShowModal(true); };
  const openEdit = (f: any) => { setEditingFactura(f); reset({ ...f, items: f.items || [] }); setShowModal(true); };

  const filteredData = data?.data?.filter(f =>
    f.numero?.toLowerCase().includes(search.toLowerCase()) || f.estado?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Facturas</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Facturación y cobros</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nueva Factura</Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input type="search" placeholder="Buscar facturas..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-[rgb(var(--input))] border border-border rounded-btn text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-[rgb(var(--muted-foreground))]">Cargando...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[rgb(var(--muted-foreground))]">No hay facturas</td></tr>
              ) : (
                filteredData.map((factura: any) => (
                  <tr key={factura.id} className="border-b border-border hover:bg-[rgb(var(--accent))]/50">
                    <td className="font-mono font-medium">{factura.numero}</td>
                    <td>{factura.cliente?.nombre || '—'}</td>
                    <td>{factura.items?.length || 0} items</td>
                    <td className="font-semibold">{formatCurrency(factura.total)}</td>
                    <td>
                      <span className={cn('badge', getStatusConfig(factura.estado).className)}>
                        {getStatusConfig(factura.estado).label}
                      </span>
                    </td>
                    <td>{formatDate(factura.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(factura)} title="Editar"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" title="Ver PDF"><FileText className="w-4 h-4" /></Button>
                        <Button variant="danger" size="icon" onClick={() => { if (confirm('¿Eliminar esta factura?')) deleteMutation.mutate(factura.id); }} disabled={deleteMutation.isPending} title="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}