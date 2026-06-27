import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting general
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: { success: false, error: { message: 'Demasiadas solicitudes, intenta más tarde' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para auth
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 intentos por minuto
  message: { success: false, error: { message: 'Demasiados intentos, espera 1 minuto' } },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiting para registro
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora por IP
  message: { success: false, error: { message: 'Demasiados registros, intenta más tarde' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers con Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});