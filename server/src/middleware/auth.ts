import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export interface AuthRequest extends Request {
  user?: { id: string; rol: string; email: string };
}

export const verifyToken = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Acceso denegado. Token no proporcionado.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; rol: string; email: string };

    // Verificar que el usuario existe y no está bloqueado
    const usuario = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, rol: true, email: true, lockedUntil: true },
    });

    if (!usuario) throw new UnauthorizedError('Usuario no encontrado');
    if (usuario.lockedUntil && new Date(usuario.lockedUntil) > new Date()) {
      throw new UnauthorizedError('Cuenta bloqueada temporalmente');
    }

    req.user = { id: usuario.id, rol: usuario.rol, email: usuario.email };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Token inválido o expirado');
    }
    throw error;
  }
};

export const verifyRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      throw new ForbiddenError('No tienes permisos para esta acción');
    }
    next();
  };
};