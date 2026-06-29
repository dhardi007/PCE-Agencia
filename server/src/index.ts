import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
import { seedData } from './seed.js';
import { generalLimiter, securityHeaders } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import itinerariosRoutes from './routes/itinerarios.routes.js';
import reservasRoutes from './routes/reservas.routes.js';
import transaccionesRoutes from './routes/transacciones.routes.js';
import facturasRoutes from './routes/facturas.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(securityHeaders);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(generalLimiter);

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/itinerarios', itinerariosRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/transacciones', transaccionesRoutes);
app.use('/api/facturas', facturasRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ruta raíz API
app.get('/api', (_req, res) => {
  res.json({ message: 'API PCE-Agencia activa 🚀', version: '2.0.0' });
});

// SPA fallback — cualquier ruta no-API sirve el frontend
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Conectar a DB, seed y levantar servidor
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL conectado');

    await seedData();
    console.log('🌱 Seed completado');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();