import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { createTransaccionSchema, paginationSchema, filterSchema } from '../validation/schemas.js';
import { generalLimiter } from '../middleware/security.js';
import { NotFoundError } from '../utils/errors.js';
import { createSuccessResponse, createPaginationMeta } from '../utils/apiResponse.js';

const router = Router();

router.get('/', generalLimiter, validateQuery(paginationSchema.merge(filterSchema)), async (req, res, next) => {
  try {
    const { page, limit, sort, order, search, tipo, clienteId, reservaId } = req.query;
    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (clienteId) where.clienteId = clienteId;
    if (reservaId) where.reservaId = reservaId;
    if (search) where.descripcion = { contains: search as string, mode: 'insensitive' };

    const [transacciones, total] = await Promise.all([
      prisma.transaccion.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: sort ? { [sort as string]: order } : { createdAt: 'desc' },
        include: { cliente: { select: { nombre: true } }, reserva: { select: { id: true } } },
      }),
      prisma.transaccion.count({ where }),
    ]);

    res.json(createSuccessResponse(transacciones, createPaginationMeta(Number(page), Number(limit), total)));
  } catch (error) { next(error); }
});

router.get('/:id', generalLimiter, async (req, res, next) => {
  try {
    const t = await prisma.transaccion.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, reserva: true },
    });
    if (!t) throw new NotFoundError('Transacción');
    res.json(createSuccessResponse(t));
  } catch (error) { next(error); }
});

router.post('/', generalLimiter, validateBody(createTransaccionSchema), async (req, res, next) => {
  try {
    const t = await prisma.transaccion.create({ data: req.body });
    res.status(201).json(createSuccessResponse(t, undefined, 'Transacción creada'));
  } catch (error) { next(error); }
});

router.delete('/:id', generalLimiter, async (req, res, next) => {
  try {
    await prisma.transaccion.delete({ where: { id: req.params.id } });
    res.json(createSuccessResponse(null, undefined, 'Transacción eliminada'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Transacción'));
    next(error);
  }
});

export default router;