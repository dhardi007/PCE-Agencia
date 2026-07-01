import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export const validate = (schema: ZodObject<any, any>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError('Datos de entrada inválidos', details));
      }
      return next(error);
    }
  };

export const validateBody = (schema: ZodObject<any, any>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError('Datos de entrada inválidos', details));
      }
      next(error);
    }
  };

export const validateQuery = (schema: ZodObject<any, any>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError('Parámetros de consulta inválidos', details));
      }
      next(error);
    }
  };