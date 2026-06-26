# Backend — Hospital API

API REST en **Express + TypeScript** con **Prisma** sobre MySQL.

## Arquitectura

El flujo de una request es siempre el mismo:

```
request → middlewares globales (helmet, cors, rate-limit)
        → routes/      (define endpoints y qué middlewares de auth aplican)
        → controllers/ (validación con zod + lógica de negocio + queries Prisma)
        → respuesta JSON
```

```
src/
├── index.ts            # arma la app, monta routers bajo /api, error handler global, listen
├── config/             # env.ts (variables), cors.ts, network.ts (detección de IPs)
├── lib/
│   ├── prisma.ts       # singleton de PrismaClient
│   └── asyncHandler.ts # envuelve handlers async para que sus errores lleguen al error handler
├── middlewares/
│   ├── auth.middleware.ts   # verifyToken (JWT), requireAdmin, requirePatient
│   └── upload.middleware.ts # multer: PDF/JPG/PNG hasta 10MB en uploads/
├── controllers/        # un archivo por recurso; schemas zod al tope del archivo
└── routes/             # un archivo por recurso; SOLO rutas, sin lógica
```

## Convenciones

- **Las rutas no tienen lógica**: cada handler vive en `controllers/<recurso>.controller.ts` y se monta con `asyncHandler(...)` (sin eso, en Express 4 un error async deja la request colgada).
- **Validación**: schemas de zod al tope del controller; si falla, `400 { error: zodFlatten }`.
- **Errores**: forma única `{ error: string }`. Los errores imprevistos caen al error handler global de `index.ts` (`500 { error: 'Error interno del servidor' }`) — no hace falta try/catch en los controllers.
- **Status codes**: `400` validación, `401` sin token/credenciales, `403` rol insuficiente, `404` no encontrado, `409` conflicto (duplicado, tiene dependencias), `500` error interno.

## Comandos

```bash
npm run dev          # desarrollo con recarga
npx tsc --noEmit     # chequeo de tipos
npx prisma db seed   # datos de prueba (admin@hospital.com / admin123)
npm run firewall     # abre el puerto 3000 en el Firewall de Windows (pide admin)
```

El servidor escucha en `0.0.0.0:3000` e imprime al arrancar las IPs de la red
y la URL recomendada para conectar la app móvil.

## Deploy en Render (Web Service con Docker)

Hay `Dockerfile` (multi-stage) y `render.yaml` (Blueprint). Al arrancar corre
`prisma migrate deploy && node dist/index.js`. El server respeta `process.env.PORT`
(Render lo inyecta) y escucha en `0.0.0.0`, así que **no requiere cambios de código**.

**Base de datos:** Render no tiene MySQL → usá un MySQL administrado externo gratis
(Aiven / Clever Cloud). Suele exigir TLS: `DATABASE_URL=mysql://...?sslaccept=strict`.

**Pasos:**

1. Render → New → Blueprint (o Web Service) → este repo. Detecta el `Dockerfile` solo.
2. Variables de entorno (ver `.env.example` y `render.yaml`):
   - `DATABASE_URL` (la del MySQL externo, con `?sslaccept=strict`)
   - `JWT_SECRET` (frase larga aleatoria)
   - `CORS_ORIGIN` (URL de la web en Render, **sin barra final**)
   - `JWT_EXPIRES_IN=7d`, `NODE_ENV=production` (ya en el Blueprint)
   - `PORT` → **no la setees**, la inyecta Render.
3. Healthcheck: `GET /api/health` → `{ "ok": true }`.
4. Datos de ejemplo (opcional): `npm run prisma:seed` apuntando a la `DATABASE_URL` de prod.

> **Plan free:** el servicio se duerme tras inactividad; el primer request tarda ~50s
> (cold start). Los frontends ya lo toleran (timeouts holgados).
>
> **Uploads efímeros:** los archivos de `uploads/` se pierden al redeploy. Aceptable para
> demo; para persistencia real usar almacenamiento de objetos (Cloudinary / S3).

Probar el contenedor local:

```bash
docker build -t hospital-api .
docker run -p 3000:3000 --env-file .env hospital-api
```

Ver la guía completa de los 3 servicios en `../DEPLOY.md`.
