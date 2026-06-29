import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { createProveedorSchema, updateProveedorSchema, paginationSchema, filterSchema } from '../validation/schemas.js';
import { generalLimiter } from '../middleware/security.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createSuccessResponse, createPaginationMeta } from '../utils/apiResponse.js';

const router = Router();

router.get('/', generalLimiter, validateQuery(paginationSchema.merge(filterSchema)), async (req, res, next) => {
  try {
    const { page, limit, sort, order, search, tipo } = req.query;
    const where: any = {};
    if (search) where.nombre = { contains: search as string, mode: 'insensitive' };
    if (tipo) where.tipo = tipo;

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: sort ? { [sort as string]: order } : { createdAt: 'desc' },
      }),
      prisma.proveedor.count({ where }),
    ]);

    res.json(createSuccessResponse(proveedores, createPaginationMeta(Number(page), Number(limit), total)));
  } catch (error) { next(error); }
});

router.get('/:id', generalLimiter, async (req, res, next) => {
  try {
    const proveedor = await prisma.proveedor.findUnique({ where: { id: req.params.id } });
    if (!proveedor) throw new NotFoundError('Proveedor');
    res.json(createSuccessResponse(proveedor));
  } catch (error) { next(error); }
});

router.post('/', generalLimiter, validateBody(createProveedorSchema), async (req, res, next) => {
  try {
    const proveedor = await prisma.proveedor.create({ data: req.body });
    res.status(201).json(createSuccessResponse(proveedor, undefined, 'Proveedor creado'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2002')) return next(new ValidationError('Identificador duplicado'));
    next(error);
  }
});

router.put('/:id', generalLimiter, validateBody(updateProveedorSchema), async (req, res, next) => {
  try {
    const proveedor = await prisma.proveedor.update({ where: { id: req.params.id }, data: req.body });
    res.json(createSuccessResponse(proveedor, undefined, 'Proveedor actualizado'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Proveedor'));
    next(error);
  }
});

router.delete('/:id', generalLimiter, async (req, res, next) => {
  try {
    await prisma.proveedor.delete({ where: { id: req.params.id } });
    res.json(createSuccessResponse(null, undefined, 'Proveedor eliminado'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('P2025')) return next(new NotFoundError('Proveedor'));
    next(error);
  }
});

export default router;