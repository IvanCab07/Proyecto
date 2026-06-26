# Web — Hospital (panel de administración y portal del paciente)

SPA en **Vite + React + TypeScript** (React Router, Zustand, React Query, Tailwind).
Consume el backend por HTTP; toda la config de red sale de `VITE_API_URL`.

## Desarrollo

```bash
npm install
cp .env.example .env      # ajustá VITE_API_URL si hace falta
npm run dev               # http://localhost:5173
```

| Comando            | Qué hace                                  |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | servidor de desarrollo con HMR            |
| `npm run build`    | `tsc -b && vite build` → compila a `dist/` |
| `npm run preview`  | sirve el `dist/` compilado localmente     |
| `npm run lint`     | ESLint                                    |

## Conexión con el backend

- `src/services/api.ts` crea el cliente axios con `baseURL = VITE_API_URL`. Exporta también
  `apiUrl` (con `/api`) y `apiBaseUrl` (sin `/api`, para construir URLs de archivos en
  `/uploads`). **Usá esos en vez de recalcular la URL** en cada página.
- El token se guarda en `localStorage` y se manda como `Bearer` en cada request; un `401`
  limpia el token y redirige a login.
- El timeout es holgado (45s) para tolerar el **cold start** de Render free.

## Deploy en Render (Static Site)

Hay `render.yaml` (Blueprint con el rewrite de SPA) y `.nvmrc` (Node 20, requerido por Vite).

1. Render → New → Static Site (o Blueprint) → este repo.
2. Build: `npm ci && npm run build`. Publish directory: `dist`.
3. Variable de entorno `VITE_API_URL = https://TU-BACKEND.onrender.com/api`
   - Se "hornea" en el build → cambiarla exige **redeploy**.
   - Debe ser **https** (sino el navegador bloquea por contenido mixto).
4. El rewrite `/* → /index.html` (en `render.yaml`) evita 404 al refrescar rutas internas.
5. Acordate de poner esta URL en el `CORS_ORIGIN` del backend.

> `vercel.json` queda como alternativa si preferís Vercel; en Render manda `render.yaml`.

Guía completa de los 3 servicios en `../DEPLOY.md`.
