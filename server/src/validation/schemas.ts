import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const filterSchema = z.object({
  search: z.string().optional(),
  estado: z.string().optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  proveedorId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  empleadoId: z.string().uuid().optional(),
  itinerarioId: z.string().uuid().optional(),
});

export const authRegisterSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  rol: z.enum(['admin', 'empleado']).optional(),
});

export const authLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const createClienteSchema = z.object({
  userId: z.string().uuid().optional(),
  nombre: z.string().min(2).max(100),
  telefono: z.string().max(20).optional(),
  direccion: z.string().max(200).optional(),
  preferenciasViaje: z.array(z.string()).optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

export const createProveedorSchema = z.object({
  nombre: z.string().min(2).max(100),
  tipo: z.enum(['aerolinea', 'hotel', 'turismo', 'otro']),
  contacto: z.object({
    nombre: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
  contrato: z.string().optional(),
  catalogo: z.array(z.object({
    servicio: z.string(),
    tarifa: z.number().positive(),
    moneda: z.string().default('USD'),
  })).optional(),
});

export const updateProveedorSchema = createProveedorSchema.partial();

export const createItinerarioSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().optional(),
  creadoPorId: z.string().uuid(),
  duracionDias: z.number().int().positive(),
  actividades: z.array(z.object({
    nombre: z.string(),
    lugar: z.string().optional(),
    coordenadas: z.object({ lat: z.number(), lng: z.number() }).optional(),
    hora: z.string().optional(),
    notas: z.string().optional(),
  })),
});

export const updateItinerarioSchema = createItinerarioSchema.partial();

export const createReservaSchema = z.object({
  clienteId: z.string().uuid(),
  empleadoId: z.string().uuid(),
  itinerarioId: z.string().uuid(),
  servicios: z.array(z.object({
    proveedorId: z.string().uuid(),
    tipo: z.enum(['vuelo', 'hotel', 'actividad', 'transporte', 'otro']),
    fechaInicio: z.string().datetime(),
    fechaFin: z.string().datetime().optional(),
    precio: z.number().positive(),
    estado: z.enum(['pendiente', 'confirmado', 'cancelado']).default('pendiente'),
  })),
  estadoGeneral: z.enum(['activa', 'completada', 'cancelada']).default('activa'),
});

export const updateReservaSchema = createReservaSchema.partial();

export const createTransaccionSchema = z.object({
  reservaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  monto: z.number().positive(),
  tipo: z.enum(['pago', 'reembolso', 'pago_proveedor']),
  metodo: z.string().min(1),
  descripcion: z.string().optional(),
});

export const createFacturaSchema = z.object({
  reservaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  numero: z.string().min(1),
  items: z.array(z.object({
    descripcion: z.string(),
    cantidad: z.number().int().positive(),
    precioUnitario: z.number().positive(),
    subtotal: z.number().positive(),
  })),
  total: z.number().positive(),
  estado: z.enum(['pendiente', 'pagada', 'anulada']).default('pendiente'),
});

export const updateFacturaSchema = createFacturaSchema.partial().omit({ numero: true });