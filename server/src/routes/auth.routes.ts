import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { validateBody } from '../middleware/validation.js';
import { authRegisterSchema, authLoginSchema } from '../validation/schemas.js';
import { registerLimiter, authLimiter } from '../middleware/security.js';
import { AppError, ConflictError, UnauthorizedError } from '../utils/errors.js';
import { createSuccessResponse } from '../utils/apiResponse.js';

const router = Router();

/**
 * POST /api/auth/register
 * Registra un nuevo usuario.
 */
router.post('/register', registerLimiter, validateBody(authRegisterSchema), async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      throw new ConflictError('El email ya está registrado');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol || 'empleado',
      },
      select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
    });

    const accessToken = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: usuario.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // TODO: Guardar refreshToken hash en BD para rotación y revocación

    res.status(201).json(createSuccessResponse({
      accessToken,
      refreshToken,
      usuario,
    }, undefined, 'Usuario registrado exitosamente'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Inicia sesión y devuelve access + refresh tokens.
 */
router.post('/login', authLimiter, validateBody(authLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar account lockout
    if (usuario.lockedUntil && new Date(usuario.lockedUntil) > new Date()) {
      throw new UnauthorizedError('Cuenta bloqueada temporalmente. Intenta más tarde.');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      // Incrementar intentos fallidos
      const attempts = usuario.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      }
      
      await prisma.user.update({ where: { id: usuario.id }, data: updateData });
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Reset intentos fallidos en login exitoso
    if (usuario.failedLoginAttempts > 0) {
      await prisma.user.update({ where: { id: usuario.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    const accessToken = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: usuario.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // TODO: Guardar refreshToken hash en BD

    res.json(createSuccessResponse({
      accessToken,
      refreshToken,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    }, undefined, 'Inicio de sesión exitoso'));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Renueva access token usando refresh token.
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token requerido');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string; type: string };
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Token inválido');
    }

    const usuario = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!usuario) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    // TODO: Verificar refresh token en BD (rotación, revocación)

    const newAccessToken = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: usuario.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // TODO: Rotar refresh token en BD

    res.json(createSuccessResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, undefined, 'Tokens renovados'));
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Refresh token inválido o expirado'));
    }
    next(error);
  }
});

export default router;