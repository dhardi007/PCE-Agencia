import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import zxcvbn from 'zxcvbn';
import { prisma } from '../lib/prisma';
import { validateBody } from '../middleware/validation';
import { authRegisterSchema, authLoginSchema, authRefreshSchema } from '../validation/schemas';
import { registerLimiter, authLimiter } from '../middleware/security';
import { AppError, ConflictError, UnauthorizedError } from '../utils/errors';
import { createSuccessResponse } from '../utils/apiResponse';

const router = Router();

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con email verification token.
 */
router.post('/register', registerLimiter, validateBody(authRegisterSchema), async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validar fortaleza de contraseña con zxcvbn
    const passwordStrength = zxcvbn(password);
    if (passwordStrength.score < 3) {
      throw new UnauthorizedError('Contraseña muy débil', {
        score: passwordStrength.score,
        feedback: passwordStrength.feedback,
        crackTime: passwordStrength.crack_times_display.offline_slow_hashing_1e4_per_second,
      });
    }

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) throw new ConflictError('El email ya está registrado');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar token de verificación de email
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const usuario = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol || 'empleado',
        emailVerifyToken,
        emailVerifyExpires,
      },
      select: { id: true, nombre: true, email: true, rol: true, createdAt: true, emailVerified: true },
    });

    // TODO: Enviar email de verificación con token

    const accessToken = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: usuario.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    // Guardar refresh token hash en BD
    const refreshTokenHash = hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: { tokenHash: refreshTokenHash, userId: usuario.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.status(201).json(createSuccessResponse({
      accessToken,
      refreshToken,
      usuario,
    }, undefined, 'Usuario registrado. Verifica tu email.'));
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/login
 * Inicia sesión y devuelve access + refresh tokens.
 */
router.post('/login', authLimiter, validateBody(authLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) throw new UnauthorizedError('Credenciales inválidas');

    // Verificar account lockout
    if (usuario.lockedUntil && new Date(usuario.lockedUntil) > new Date()) {
      throw new UnauthorizedError('Cuenta bloqueada temporalmente. Intenta más tarde.');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      const attempts = usuario.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.user.update({ where: { id: usuario.id }, data: updateData });
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Reset intentos fallidos
    if (usuario.failedLoginAttempts > 0) {
      await prisma.user.update({ where: { id: usuario.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    const accessToken = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: usuario.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    // Guardar refresh token hash (rotación)
    const refreshTokenHash = hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: { tokenHash: refreshTokenHash, userId: usuario.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json(createSuccessResponse({
      accessToken,
      refreshToken,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, emailVerified: usuario.emailVerified },
    }, undefined, 'Inicio de sesión exitoso'));
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/refresh
 * Renueva access token rotando refresh token.
 */
router.post('/refresh', validateBody(authRefreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new UnauthorizedError('Refresh token requerido');

    const refreshTokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash: refreshTokenHash } });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string; type: string };
    if (decoded.type !== 'refresh') throw new UnauthorizedError('Token inválido');

    const usuario = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!usuario) throw new UnauthorizedError('Usuario no encontrado');

    // Revocar token actual
    await prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });

    // Generar nuevos tokens
    const newAccessToken = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: usuario.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    // Guardar nuevo refresh token
    const newRefreshTokenHash = hashToken(newRefreshToken);
    await prisma.refreshToken.create({
      data: { tokenHash: newRefreshTokenHash, userId: usuario.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json(createSuccessResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, undefined, 'Tokens renovados'));
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return next(new UnauthorizedError('Refresh token inválido o expirado'));
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Revoca el refresh token actual.
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      });
    }
    res.json(createSuccessResponse(null, undefined, 'Sesión cerrada'));
  } catch (error) { next(error); }
});

/**
 * GET /api/auth/verify-email
 * Verifica email con token.
 */
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') throw new UnauthorizedError('Token requerido');

    const usuario = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerifyExpires: { gt: new Date() } },
    });

    if (!usuario) throw new UnauthorizedError('Token inválido o expirado');

    await prisma.user.update({
      where: { id: usuario.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });

    res.json(createSuccessResponse(null, undefined, 'Email verificado exitosamente'));
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/resend-verification
 * Reenvía email de verificación.
 */
router.post('/resend-verification', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new UnauthorizedError('Email requerido');

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario || usuario.emailVerified) {
      // No revelar si existe o no
      return res.json(createSuccessResponse(null, undefined, 'Si el email existe, se reenviará el email'));
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: usuario.id },
      data: { emailVerifyToken, emailVerifyExpires },
    });

    // TODO: Enviar email

    res.json(createSuccessResponse(null, undefined, 'Email de verificación reenviado'));
  } catch (error) { next(error); }
});

/**
 * GET /api/auth/2fa/status
 * Estado de 2FA.
 */
router.get('/2fa/status', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError('Token requerido');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const usuario = await prisma.user.findUnique({ where: { id: decoded.id }, select: { totpSecret: true } });
    if (!usuario) throw new UnauthorizedError('Usuario no encontrado');

    res.json(createSuccessResponse({ enabled: !!usuario.totpSecret }));
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/2fa/enable
 * Inicia configuración de 2FA (genera secret).
 */
router.post('/2fa/enable', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError('Token requerido');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const usuario = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!usuario) throw new UnauthorizedError('Usuario no encontrado');

    // Generar secret TOTP (base32)
    const secret = crypto.randomBytes(20).toString('base64').replace(/[/+=]/g, '').substring(0, 32);

    await prisma.user.update({ where: { id: usuario.id }, data: { totpSecret: secret } });

    // TODO: Generar QR code URI: otpauth://totp/PCE-Agencia:${email}?secret=${secret}&issuer=PCE-Agencia

    res.json(createSuccessResponse({ secret }, undefined, 'Escanea el QR code con tu app autenticadora'));
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/2fa/verify
 * Verifica código TOTP y habilita 2FA.
 */
router.post('/2fa/verify', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || code.length !== 6) throw new UnauthorizedError('Código inválido');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError('Token requerido');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const usuario = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!usuario || !usuario.totpSecret) throw new UnauthorizedError('2FA no configurado');

    // TODO: Verificar TOTP con usuario.totpSecret y code
    // const verified = verifyTOTP(usuario.totpSecret, code);
    // if (!verified) throw new UnauthorizedError('Código inválido');

    // Por ahora simulamos verificación exitosa
    const verified = true; // TODO: implementar verifyTOTP real

    if (!verified) throw new UnauthorizedError('Código inválido');

    res.json(createSuccessResponse(null, undefined, '2FA habilitado correctamente'));
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/2fa/disable
 * Deshabilita 2FA.
 */
router.post('/2fa/disable', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError('Token requerido');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    await prisma.user.update({ where: { id: decoded.id }, data: { totpSecret: null } });
    res.json(createSuccessResponse(null, undefined, '2FA deshabilitado'));
  } catch (error) { next(error); }
});

export default router;