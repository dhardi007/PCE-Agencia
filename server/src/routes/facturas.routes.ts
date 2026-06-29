import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { createFacturaSchema, updateFacturaSchema, paginationSchema, filterSchema } from '../validation/schemas.js';
import { generalLimiter } from '../middleware/security.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createSuccessResponse, createPaginationMeta } from '../utils/apiResponse.js';

const router = Router();

router.get('/', generalLimiter, validateQuery(paginationSchema.merge(filterSchema)), async (req, res, next) => {
  try {
    const { page, limit, sort, order, search, estado, clienteId, reservaId } = req.query;
    const where: any = {};
    if (estado) where.estado = estado;
    if (clienteId) where.clienteId = clienteId;
    if (reservaId) where.reservaId = reservaId;
    if (search) where.numero = { contains: search as string, mode: 'insensitive' };

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: sort ? { [sort as string]: order } : { createdAt: 'desc' },
        include: { cliente: { select: { nombre: true } }, reserva: { select: { id: true } } },
      }),
      prisma.factura.count({ where }),
    ]);

    res.json(createSuccessResponse(facturas, createPaginationMeta(Number(page), Number(limit), total)));
  } catch (error) { next(error); }
});

router.get('/:id', generalLimiter, async (req, res, next) => {
  try {
    const f = await prisma.factura.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, reserva: { include: { itinerario: true } } },
    });
    if (!f) throw new NotFoundError('Factura');
    res.json(createSuccessResponse(f));
  } catch (error) { next(error); }
});

router.post('/', generalLimiter, validateBody(createFacturaSchema), async (req, res, next) => {
  try {
    const f = await prisma.factura.create({ data: req.body });
    res.status(201).json(createSuccessResponse(f, undefined, 'Factura creada'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2002')) return next(new ValidationError('Número de factura duplicado'));
    next(error);
  }
});

router.put('/:id', generalLimiter, validateBody(updateFacturaSchema), async (req, res, next) => {
  try {
    const f = await prisma.factura.update({ where: { id: req.params.id }, data: req.body });
    res.json(createSuccessResponse(f, undefined, 'Factura actualizada'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Factura'));
    next(error);
  }
});

router.delete('/:id', generalLimiter, async (req, res, next) => {
  try {
    await prisma.factura.delete({ where: { id: req.params.id } });
    res.json(createSuccessResponse(null, undefined, 'Factura eliminada'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Factura'));
    next(error);
  }
});

export default router;