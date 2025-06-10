// app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';

import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import eventRoutes from './routes/eventRoutes';
import comprasRoutes from './routes/comprasRoutes';
import statsRoutes from './routes/statsRoutes';
import adminRoutes from './routes/adminRoutes';
import kycRoutes from './routes/kycRoutes';
import { kycWebhookHandler } from './controllers/kycWebhookController'; // ✅ Corregido

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;

// Validar variables de entorno críticas al inicio
const requiredEnvVars = ['DIDIT_API_KEY', 'WORKFLOW_ID', 'APP_URL', 'WEBHOOK_SECRET_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  console.error('🔧 Configura estas variables antes de iniciar la aplicación');
  process.exit(1);
}

console.log('✅ Variables de entorno KYC configuradas correctamente');

// Webhook raw body parser - DEBE ir antes que otros middleware de body parsing
app.use('/api/kyc/callback', bodyParser.json({
  verify: (req: Request & { rawBody?: string }, res: Response, buf: Buffer, encoding: BufferEncoding) => {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}));

// Webhook endpoint - DEBE ir antes que las rutas generales
app.post('/api/kyc/callback', kycWebhookHandler); // ✅ Corregido

// Middlewares comunes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging global
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📋 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    kycConfigured: {
      hasApiKey: !!process.env.DIDIT_API_KEY,
      hasWorkflowId: !!process.env.WORKFLOW_ID,
      hasWebhookSecret: !!process.env.WEBHOOK_SECRET_KEY,
      appUrl: process.env.APP_URL
    }
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', statsRoutes);

// Ruta no encontrada
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Ruta API no encontrada: ${req.originalUrl}`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SPA catch-all
app.get('*', (req: Request<{}, any, any>, res: Response) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({ success: false, error: 'Esta ruta API no existe' });
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Error handler global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ ERROR GLOBAL:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ SERVIDOR INICIADO EN PUERTO ${PORT}`);
  console.log(`🔗 URL del webhook: ${process.env.APP_URL}/api/kyc/callback`);
});