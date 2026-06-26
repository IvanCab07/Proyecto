#!/usr/bin/env node
// ============================================================
//  dev-tunnel.mjs — "modo a prueba de redes"
// ------------------------------------------------------------
//  Un solo comando para probar el proyecto en CUALQUIER red
//  (incluidas las del colegio que aíslan dispositivos o bloquean
//  puertos). Levanta el backend, abre un túnel público con
//  cloudflared, escribe la URL del API en mobile/.env y web/.env,
//  y arranca Expo con el túnel de Metro.
//
//  La app móvil toma EXPO_PUBLIC_API_URL sola (es prioridad #1 en
//  serverDiscovery), así que NO hay que tipear ninguna IP.
//
//  Uso:  npm run dev:tunnel
// ============================================================
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url))); // scripts/ -> raíz del repo
const PORT = 3000;
const procs = [];
let exiting = false;
let urlFound = false;

function run(cmd, args, opts = {}) {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  procs.push(p);
  return p;
}

// Reescribe (o agrega) una variable en un archivo .env sin pisar las demás
function upsertEnv(file, key, value) {
  let lines = [];
  if (existsSync(file)) {
    lines = readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith(`${key}=`));
  }
  lines.push(`${key}=${value}`);
  writeFileSync(file, lines.join('\n') + '\n');
}

function shutdown() {
  if (exiting) return;
  exiting = true;
  console.log('\n[dev-tunnel] cerrando procesos…');
  for (const p of procs) { try { p.kill(); } catch {} }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[dev-tunnel] 1/3  Abriendo túnel cloudflared (la primera vez descarga el binario)…');
const cf = spawn('npx', ['cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], { shell: true, cwd: root });
procs.push(cf);

const onData = (buf) => {
  const text = buf.toString();
  process.stdout.write(text);
  const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (m && !urlFound) {
    urlFound = true;
    const base = m[0];
    const apiUrl = `${base}/api`;
    upsertEnv(join(root, 'mobile', '.env'), 'EXPO_PUBLIC_API_URL', apiUrl);
    upsertEnv(join(root, 'web', '.env'), 'VITE_API_URL', apiUrl);
    console.log(`\n[dev-tunnel] ✓ API pública: ${apiUrl}`);
    console.log('[dev-tunnel]   Guardada en mobile/.env y web/.env (la app la toma sola).');

    console.log('[dev-tunnel] 2/3  Levantando backend…');
    run('npm', ['--prefix', 'backend', 'run', 'dev'], { cwd: root, env: { ...process.env, TUNNEL_URL: base } });

    console.log('[dev-tunnel] 3/3  Arrancando Expo con túnel de Metro…\n');
    run('npx', ['expo', 'start', '-c', '--tunnel'], {
      cwd: join(root, 'mobile'),
      env: { ...process.env, EXPO_PUBLIC_API_URL: apiUrl },
    });
  }
};
cf.stdout.on('data', onData);
cf.stderr.on('data', onData);
cf.on('exit', (code) => {
  if (exiting) return;
  console.error(`\n[dev-tunnel] cloudflared terminó (código ${code}).`);
  console.error('[dev-tunnel] ¿Sin internet o sin cloudflared? Probá el modo LAN: npm run dev');
  shutdown();
});
