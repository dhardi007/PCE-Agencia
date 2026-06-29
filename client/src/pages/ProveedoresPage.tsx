import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { proveedoresApi } from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const proveedorSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  tipo: z.enum(["aerolinea", "hotel", "turismo", "otro"]),
  contacto: z
    .object({
      nombre: z.string().optional(),
      telefono: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  contrato: z.string().optional(),
  catalogo: z
    .array(
      z.object({
        servicio: z.string(),
        tarifa: z.number().positive(),
        moneda: z.string().default("USD"),
      }),
    )
    .optional(),
});

type ProveedorForm = z.infer<typeof proveedorSchema>;

export function ProveedoresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["proveedores", search],
    queryFn: () => proveedoresApi.list({ search, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: ProveedorForm) => proveedoresApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProveedorForm> }) =>
      proveedoresApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      setShowModal(false);
      setEditingProveedor(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => proveedoresApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["proveedores"] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProveedorForm>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: "",
      tipo: "otro",
      contacto: {},
      contrato: "",
      catalogo: [],
    },
  });

  const onSubmit = (data: ProveedorForm) => {
    if (editingProveedor)
      updateMutation.mutate({ id: editingProveedor.id, data });
    else createMutation.mutate(data);
    reset();
  };

  const openCreate = () => {
    setEditingProveedor(null);
    reset();
    setShowModal(true);
  };
  const openEdit = (p: any) => {
    setEditingProveedor(p);
    reset({
      nombre: p.nombre,
      tipo: p.tipo,
      contacto: p.contacto || {},
      contrato: p.contrato || "",
      catalogo: p.catalogo || [],
    });
    setShowModal(true);
  };

  const filteredData =
    data?.data?.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        p.tipo?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">
            Proveedores
          </h1>
          <p className="text-[rgb(var(--muted-foreground))]">
            Catálogo de proveedores y servicios
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProveedor(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
        </button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Buscar proveedores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[rgb(var(--input))] border border-border rounded-btn text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {(data?.data || [])
            .filter(
              (p) =>
                p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
                p.tipo?.toLowerCase().includes(search.toLowerCase()),
            )
            .map((proveedor: any) => (
              <Card
                key={proveedor.id}
                className="p-4 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      proveedor.tipo === "aerolinea" && "bg-blue-500/20",
                      proveedor.tipo === "hotel" && "bg-green-500/20",
                      proveedor.tipo === "turismo" && "bg-yellow-500/20",
                      proveedor.tipo === "otro" && "bg-purple-500/20",
                    )}
                  >
                    {proveedor.tipo === "aerolinea" && (
                      <span className="text-2xl">✈️</span>
                    )}
                    {proveedor.tipo === "hotel" && (
                      <span className="text-2xl">🏨</span>
                    )}
                    {proveedor.tipo === "turismo" && (
                      <span className="text-2xl">🌴</span>
                    )}
                    {proveedor.tipo === "otro" && (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[rgb(var(--foreground))] truncate">
                      {proveedor.nombre}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] capitalize">
                      {proveedor.tipo}
                    </span>
                    {proveedor.contacto?.nombre && (
                      <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                        {proveedor.contacto.nombre}
                      </p>
                    )}
                    {proveedor.contacto?.telefono && (
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">
                        {proveedor.contacto.telefono}
                      </p>
                    )}
                    {proveedor.contacto?.email && (
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">
                        {proveedor.contacto.email}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {proveedor.catalogo
                        ?.slice(0, 3)
                        .map((c: any, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] rounded"
                          >
                            {c.servicio} - {c.tarifa} {c.moneda}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    onClick={() => {}}
                    className="p-1.5 rounded hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar?")) {
                      }
                    }}
                    className="p-1.5 rounded hover:bg-[rgb(var(--accent))] text-red-400 hover:text-red-300"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </Card>
            ))}
        </div>
      </Card>
    </div>
  );
}

