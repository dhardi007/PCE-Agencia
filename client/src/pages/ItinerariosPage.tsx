import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { itinerariosApi } from '../services/api';
import { formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { Plus, Search, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';

export function ItinerariosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['itinerarios', search],
    queryFn: () => itinerariosApi.list({ search, limit: 50 }),
  });

  const filteredData = data?.data?.filter(it =>
    it.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    it.descripcion?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Itinerarios</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Planes de viaje día a día</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Nuevo Itinerario</button>
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <input type="search" placeholder="Buscar itinerarios..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-md pl-10 pr-4 py-2 text-sm bg-[rgb(var(--input))] border border-border rounded-btn text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-[rgb(var(--muted-foreground))] py-8">Cargando...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center text-[rgb(var(--muted-foreground))] py-8">No hay itinerarios</div>
          ) : filteredData.map((it: any) => (
            <Card key={it.id} className="p-4 hover:shadow-card-hover transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">{it.titulo}</h3>
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">{it.duracionDias} días</span>
                  </div>
                  <p className="text-[rgb(var(--muted-foreground))] mb-3">{it.descripcion || 'Sin descripción'}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-[rgb(var(--muted-foreground))]">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Creado: {formatDate(it.createdAt)}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Duración: {it.duracionDias} días</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(it.actividades || []).slice(0, 3).map((act: any, i: number) => (
                    <div key={i} className="px-3 py-1.5 text-xs bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] rounded flex items-center gap-1">
                      {act.hora && <Clock className="w-3 h-3" />}
                      <span>{act.hora || ''} {act.nombre}</span>
                      {act.lugar && <MapPin className="w-3 h-3" />}
                      <span className="truncate max-w-[150px]">{act.lugar || ''}</span>
                    </div>
                  ))}
                  {it.actividades && it.actividades.length > 3 && (
                    <span className="px-2 py-1 text-xs text-[rgb(var(--muted-foreground))]">+{it.actividades.length - 3} más</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
