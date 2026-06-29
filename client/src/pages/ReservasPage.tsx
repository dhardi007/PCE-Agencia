import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { reservasApi } from "../services/api";
import { formatDate, getStatusConfig } from "../lib/utils";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import {
  Plus,
  Search,
  Calendar,
  User,
  Trash2,
  Edit,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function ReservasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reservas", search],
    queryFn: () => reservasApi.list({ search, limit: 50 }),
  });

  const filteredData =
    data?.data?.filter(
      (r) =>
        r.cliente?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        r.itinerario?.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        r.estadoGeneral?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reservasApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservas"] }),
  });

  const statusIcons = { activa: "🔵", completada: "🟢", cancelada: "🔴" };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">
            Reservas
          </h1>
          <p className="text-[rgb(var(--muted-foreground))]">
            Gestión de reservas de viajes
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nueva Reserva
        </button>
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <input
            type="search"
            placeholder="Buscar reservas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md pl-10 pr-4 py-2 text-sm bg-[rgb(var(--input))] border border-border rounded-btn text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
          />
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-center text-[rgb(var(--muted-foreground))] py-8">
              Cargando...
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center text-[rgb(var(--muted-foreground))] py-8">
              No hay reservas
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Empleado</th>
                    <th>Itinerario</th>
                    <th>Servicios</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data || []).map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.cliente?.nombre || "—"}</strong>
                      </td>
                      <td>{r.empleado?.nombre || "—"}</td>
                      <td>{r.itinerario?.titulo || "—"}</td>
                      <td>{r.servicios?.length || 0} servicio(s)</td>
                      <td>
                        <span
                          className={cn(
                            "badge",
                            getStatusConfig(r.estadoGeneral).className,
                          )}
                        >
                          {statusIcons[
                            r.estadoGeneral as keyof typeof statusIcons
                          ] || "⚪"}{" "}
                          {getStatusConfig(r.estadoGeneral).label}
                        </span>
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 rounded hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                            title="Ver"
                          >
                            👁️
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("¿Eliminar?"))
                                deleteMutation.mutate(r.id);
                            }}
                            className="p-1.5 rounded hover:bg-[rgb(var(--accent))] text-red-400 hover:text-red-300"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

