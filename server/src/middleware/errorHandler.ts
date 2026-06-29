import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { createErrorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.message, err.constructor.name, err.details)
    );
  }

  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return res.status(400).json(createErrorResponse('JSON inválido', 'JsonParseError'));
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json(createErrorResponse('Registro duplicado', 'DuplicateEntry'));
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json(createErrorResponse('Registro no encontrado', 'NotFound'));
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json(createErrorResponse('Datos inválidos', 'ValidationError'));
  }

  res.status(500).json(createErrorResponse('Error interno del servidor', 'InternalError'));
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json(createErrorResponse('Ruta no encontrada', 'NotFound'));
};