import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { clientesApi } from '../services/api';
import { formatDate, getStatusConfig } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clienteSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  preferenciasViaje: z.array(z.string()).optional(),
});

type ClienteForm = z.infer<typeof clienteSchema>;

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'preferenciasViaje', label: 'Preferencias' },
  { key: 'historialViajes', label: 'Viajes' },
];

export function ClientesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn: () => clientesApi.list({ search, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: ClienteForm) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClienteForm> }) => clientesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowModal(false);
      setEditingCliente(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nombre: '', telefono: '', direccion: '', preferenciasViaje: [] },
  });

  const onSubmit = (data: ClienteForm) => {
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data });
    } else {
      createMutation.mutate(data);
    }
    reset();
  };

  const openCreate = () => {
    setEditingCliente(null);
    reset();
    setShowModal(true);
  };

  const openEdit = (cliente: any) => {
    setEditingCliente(cliente);
    reset({
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      preferenciasViaje: cliente.preferenciasViaje || [],
    });
    setShowModal(true);
  };

  const filteredData = data?.data?.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.toLowerCase().includes(search.toLowerCase()) ||
    c.direccion?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Clientes</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Gestión de clientes y preferencias</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nuevo Cliente</Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[rgb(var(--input))] border border-border rounded-btn text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map(col => (
                  <th key={col.key} className="p-4 text-left text-sm font-medium text-[rgb(var(--muted-foreground))]">
                    {col.label}
                  </th>
                ))}
                <th className="p-4 text-right text-sm font-medium text-[rgb(var(--muted-foreground))]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-[rgb(var(--muted-foreground))]">Cargando...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[rgb(var(--muted-foreground))]">No hay clientes</td></tr>
              ) : (
                filteredData.map((cliente: any) => (
                  <tr key={cliente.id} className="border-b border-border hover:bg-[rgb(var(--accent))]/50">
                    <td className="p-4 font-medium text-[rgb(var(--foreground))]">{cliente.nombre}</td>
                    <td className="p-4 text-[rgb(var(--muted-foreground))]">{cliente.telefono || '—'}</td>
                    <td className="p-4 text-[rgb(var(--muted-foreground))]">{cliente.direccion || '—'}</td>
                    <td className="p-4">
                      {(cliente.preferenciasViaje || []).map((p: string, i: number) => (
                        <span key={i} className="inline-block mr-1 mb-1 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">{p}</span>
                      ))}
                    </td>
                    <td className="p-4 text-[rgb(var(--muted-foreground))]">{cliente._count?.historialViajes || 0}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(cliente)} className="p-2 rounded-lg hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('¿Eliminar este cliente?')) deleteMutation.mutate(cliente.id); }}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg hover:bg-[rgb(var(--accent))] text-red-400 hover:text-red-300"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowModal(false); setEditingCliente(null); reset(); }}>
          <div className="bg-[rgb(var(--card))] rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => { setShowModal(false); setEditingCliente(null); reset(); }} className="p-1 rounded hover:bg-[rgb(var(--accent))]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <Input label="Nombre" {...register('nombre')} error={errors.nombre?.message} required />
              <Input label="Teléfono" {...register('telefono')} error={errors.telefono?.message} />
              <Input label="Dirección" {...register('direccion')} error={errors.direccion?.message} />
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Preferencias</label>
                <div className="flex flex-wrap gap-2">
                  {['playa', 'aventura', 'gastronomía', 'montaña', 'cultura', 'relax', 'spa', 'turismo urbano', 'compras'].map(pref => (
                    <label key={pref} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('preferenciasViaje')}
                        value={pref}
                        className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm capitalize">{pref}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditingCliente(null); reset(); }} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending} className="flex-1">
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingCliente ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}