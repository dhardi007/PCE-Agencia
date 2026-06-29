import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { createReservaSchema, updateReservaSchema, paginationSchema, filterSchema } from '../validation/schemas.js';
import { generalLimiter } from '../middleware/security.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createSuccessResponse, createPaginationMeta } from '../utils/apiResponse.js';

const router = Router();

router.get('/', generalLimiter, validateQuery(paginationSchema.merge(filterSchema)), async (req, res, next) => {
  try {
    const { page, limit, sort, order, search, estadoGeneral, clienteId, empleadoId, itinerarioId } = req.query;
    const where: any = {};
    if (estadoGeneral) where.estadoGeneral = estadoGeneral;
    if (clienteId) where.clienteId = clienteId;
    if (empleadoId) where.empleadoId = empleadoId;
    if (itinerarioId) where.itinerarioId = itinerarioId;
    if (search) {
      where.OR = [
        { cliente: { nombre: { contains: search as string, mode: 'insensitive' } } },
        { itinerario: { titulo: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [reservas, total] = await Promise.all([
      prisma.reserva.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: sort ? { [sort as string]: order } : { createdAt: 'desc' },
        include: {
          cliente: { select: { nombre: true, telefono: true } },
          empleado: { select: { nombre: true } },
          itinerario: { select: { titulo: true } },
        },
      }),
      prisma.reserva.count({ where }),
    ]);

    res.json(createSuccessResponse(reservas, createPaginationMeta(Number(page), Number(limit), total)));
  } catch (error) { next(error); }
});

router.get('/:id', generalLimiter, async (req, res, next) => {
  try {
    const reserva = await prisma.reserva.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, empleado: true, itinerario: true, transacciones: true, facturas: true },
    });
    if (!reserva) throw new NotFoundError('Reserva');
    res.json(createSuccessResponse(reserva));
  } catch (error) { next(error); }
});

router.post('/', generalLimiter, validateBody(createReservaSchema), async (req, res, next) => {
  try {
    const reserva = await prisma.reserva.create({
      data: req.body,
      include: { cliente: true, empleado: true, itinerario: true },
    });
    res.status(201).json(createSuccessResponse(reserva, undefined, 'Reserva creada'));
  } catch (error) { next(error); }
});

router.put('/:id', generalLimiter, validateBody(updateReservaSchema), async (req, res, next) => {
  try {
    const reserva = await prisma.reserva.update({ where: { id: req.params.id }, data: req.body });
    res.json(createSuccessResponse(reserva, undefined, 'Reserva actualizada'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Reserva'));
    next(error);
  }
});

router.delete('/:id', generalLimiter, async (req, res, next) => {
  try {
    await prisma.reserva.delete({ where: { id: req.params.id } });
    res.json(createSuccessResponse(null, undefined, 'Reserva eliminada'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Reserva'));
    next(error);
  }
});

export default router;