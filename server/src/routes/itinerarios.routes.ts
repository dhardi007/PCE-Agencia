import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { createItinerarioSchema, updateItinerarioSchema, paginationSchema, filterSchema } from '../validation/schemas.js';
import { generalLimiter } from '../middleware/security.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createSuccessResponse, createPaginationMeta } from '../utils/apiResponse.js';

const router = Router();

router.get('/', generalLimiter, validateQuery(paginationSchema.merge(filterSchema)), async (req, res, next) => {
  try {
    const { page, limit, sort, order, search } = req.query;
    const where: any = {};
    if (search) where.titulo = { contains: search as string, mode: 'insensitive' };

    const [itinerarios, total] = await Promise.all([
      prisma.itinerario.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: sort ? { [sort as string]: order } : { createdAt: 'desc' },
        include: { creadoPor: { select: { nombre: true } } },
      }),
      prisma.itinerario.count({ where }),
    ]);

    res.json(createSuccessResponse(itinerarios, createPaginationMeta(Number(page), Number(limit), total)));
  } catch (error) { next(error); }
});

router.get('/:id', generalLimiter, async (req, res, next) => {
  try {
    const it = await prisma.itinerario.findUnique({
      where: { id: req.params.id },
      include: { creadoPor: { select: { nombre: true } }, reservas: true },
    });
    if (!it) throw new NotFoundError('Itinerario');
    res.json(createSuccessResponse(it));
  } catch (error) { next(error); }
});

router.post('/', generalLimiter, validateBody(createItinerarioSchema), async (req, res, next) => {
  try {
    const it = await prisma.itinerario.create({ data: req.body });
    res.status(201).json(createSuccessResponse(it, undefined, 'Itinerario creado'));
  } catch (error) { next(error); }
});

router.put('/:id', generalLimiter, validateBody(updateItinerarioSchema), async (req, res, next) => {
  try {
    const it = await prisma.itinerario.update({ where: { id: req.params.id }, data: req.body });
    res.json(createSuccessResponse(it, undefined, 'Itinerario actualizado'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Itinerario'));
    next(error);
  }
});

router.delete('/:id', generalLimiter, async (req, res, next) => {
  try {
    await prisma.itinerario.delete({ where: { id: req.params.id } });
    res.json(createSuccessResponse(null, undefined, 'Itinerario eliminado'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Itinerario'));
    next(error);
  }
});

export default router;