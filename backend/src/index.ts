import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import qrcode from 'qrcode-terminal';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { PORT } from './config/env';
import { corsOptions } from './config/cors';
import { getNetworkIPs } from './config/network';
import { HttpError, formatZodError, uniqueFieldMessage } from './lib/httpError';

import authRoutes from './routes/auth.routes';
import turnosRoutes from './routes/turnos.routes';
import medicosRoutes from './routes/medicos.routes';
import estudiosRoutes from './routes/estudios.routes';
import recetasRoutes from './routes/recetas.routes';
import usersRoutes from './routes/users.routes';
import especialidadesRoutes from './routes/especialidades.routes';
import notificationsRoutes from './routes/notifications.routes';
import calificacionesRoutes from './routes/calificaciones.routes';

const app = express();

app.use(helmet());
app.use(cors(corsOptions));

// /api/health queda ANTES del rate-limit: el discovery de la app móvil
// lo consulta varias veces y no debe consumir la cuota de requests
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth',           authRoutes);
app.use('/api/turnos',         turnosRoutes);
app.use('/api/medicos',        medicosRoutes);
app.use('/api/estudios',       estudiosRoutes);
app.use('/api/recetas',        recetasRoutes);
app.use('/api/users',          usersRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/notifications',  notificationsRoutes);
app.use('/api/calificaciones', calificacionesRoutes);

// Error handler global: traduce cualquier error a { error: <string> } con un status claro.
// Así un fallo de validación o un dato duplicado NUNCA llega al front como objeto o como 500 genérico.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Validación de Zod → 400 con mensaje en español
  if (err instanceof ZodError) {
    return res.status(400).json({ error: formatZodError(err) });
  }
  // Error con status explícito que lanzamos a propósito
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Restricción única de la base (email/DNI/matrícula repetidos) → 409 amable
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: uniqueFieldMessage(err.meta?.target) });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'No se encontró el registro solicitado' });
    }
  }
  console.error(err instanceof Error ? err.stack : err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Comprueba que la propia API responda en una URL dada (no detecta firewall/aislamiento)
async function selfCheck(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    const data = (await res.json()) as { ok?: boolean };
    return data?.ok === true;
  } catch {
    return false;
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  const ips = getNetworkIPs();
  const rec = ips.find((c) => c.recommended);

  console.log('\n[Backend] Hospital API iniciada');
  console.log(`  Local:  http://localhost:${PORT}/api`);
  console.log('  IPs de red detectadas:');
  for (const c of ips) {
    const mark = c.recommended ? ' <- RECOMENDADA' : '';
    console.log(`    http://${c.address}:${PORT}/api   [${c.name}]${mark}`);
  }

  const localOk = await selfCheck(`http://127.0.0.1:${PORT}/api`);
  console.log(`\n  Self-check localhost: ${localOk ? 'OK' : 'FALLA (la API no responde ni en esta maquina)'}`);

  // Si arrancamos con npm run dev:tunnel, el script nos pasa la URL pública del túnel
  const tunnelBase = process.env.TUNNEL_URL;
  if (tunnelBase) {
    const tunnelApi = `${tunnelBase}/api`;
    console.log(`\n  ► Túnel público activo (modo a prueba de redes): ${tunnelApi}`);
    console.log('    La app móvil lo toma sola desde mobile/.env — no hay que tipear ninguna IP.');
    console.log('    Este QR/URL funciona en cualquier red (colegio, datos móviles, etc.):\n');
    qrcode.generate(tunnelApi, { small: true });
  }

  if (rec) {
    const lanUrl = `http://${rec.address}:${PORT}/api`;
    const lanOk = await selfCheck(lanUrl);
    console.log(`  Self-check ${lanUrl}: ${lanOk ? 'OK' : 'FALLA'}`);
    if (lanOk) {
      console.log('  Ojo: OK aca NO garantiza que el celular llegue. Firewall o WiFi con');
      console.log('  aislamiento no se pueden detectar desde esta maquina.');
    }

    console.log('\n  La app celular busca el servidor sola. Si no lo encuentra, abrir');
    console.log('  "Configurar servidor" en la pantalla de ingreso y tipear esta URL');
    console.log('  (o escanear el QR con la camara del celular para verla):');
    console.log(`\n  ${lanUrl}\n`);
    qrcode.generate(lanUrl, { small: true });
  }

  console.log('\n  Si el celular no conecta:');
  console.log('   - npm run firewall   (abre el puerto en el Firewall de Windows, pide admin)');
  console.log('   - Si el WiFi aisla clientes (colegio): hotspot del celular o tunel (ver README)\n');
});

export default app;
