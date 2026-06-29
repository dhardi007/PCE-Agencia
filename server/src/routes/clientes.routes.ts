import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { createClienteSchema, updateClienteSchema, paginationSchema, filterSchema } from '../validation/schemas.js';
import { generalLimiter } from '../middleware/security.js';
import { AppError, NotFoundError, ValidationError } from '../utils/errors.js';
import { createSuccessResponse, createPaginationMeta } from '../utils/apiResponse.js';

const router = Router();

/**
 * GET /api/clientes
 * Lista clientes con paginación, filtros y búsqueda.
 * Query params: page, limit, sort, order, search, estado
 */
router.get('/', generalLimiter, validateQuery(paginationSchema.merge(filterSchema)), async (req, res, next) => {
  try {
    const { page, limit, sort, order, search, estado } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: 'insensitive' } },
        { telefono: { contains: search as string, mode: 'insensitive' } },
        { direccion: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: sort ? { [sort as string]: order } : { createdAt: 'desc' },
        include: {
          user: { select: { nombre: true, email: true } },
          _count: { select: { historialViajes: true, transacciones: true, facturas: true } },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    const meta = createPaginationMeta(Number(page), Number(limit), total);
    res.json(createSuccessResponse(clientes, meta));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clientes/:id
 * Obtiene un cliente por ID.
 */
router.get('/:id', generalLimiter, async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { nombre: true, email: true } },
        historialViajes: { include: { itinerario: true } },
        transacciones: { orderBy: { createdAt: 'desc' }, take: 10 },
        facturas: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!cliente) throw new NotFoundError('Cliente');
    res.json(createSuccessResponse(cliente));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clientes
 * Crea un nuevo cliente.
 */
router.post('/', generalLimiter, validateBody(createClienteSchema), async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.create({
      data: req.body,
    });
    res.status(201).json(createSuccessResponse(cliente, undefined, 'Cliente creado exitosamente'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2002')) {
      return next(new ValidationError('Ya existe un cliente con ese identificador'));
    }
    next(error);
  }
});

/**
 * PUT /api/clientes/:id
 * Actualiza un cliente.
 */
router.put('/:id', generalLimiter, validateBody(updateClienteSchema), async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(createSuccessResponse(cliente, undefined, 'Cliente actualizado exitosamente'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) {
      return next(new NotFoundError('Cliente'));
    }
    next(error);
  }
});

/**
 * DELETE /api/clientes/:id
 * Elimina un cliente.
 */
router.delete('/:id', generalLimiter, async (req, res, next) => {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.json(createSuccessResponse(null, undefined, 'Cliente eliminado exitosamente'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) {
      return next(new NotFoundError('Cliente'));
    }
    next(error);
  }
});

export default router;