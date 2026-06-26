# Deploy en Render — backend, web y app móvil

El proyecto se divide en **3 repos** (uno por carpeta) y cada parte corre por su lado,
encontrándose por URL. Todo se configura con **variables de entorno**: nada de IPs hardcodeadas.

```
[ App móvil (Expo/EAS) ]        [ Web (Render Static Site) ]
        \                              /
         \  EXPO_PUBLIC_API_URL       /  VITE_API_URL
          \                          /
           ▼                        ▼
        [ Backend (Render Web Service, Docker) ]
                     │  DATABASE_URL
                     ▼
            [ MySQL administrado externo (Aiven / Clever Cloud) ]
```

> **Importante:** Render hospeda el **backend** (Web Service) y la **web** (Static Site).
> La **app móvil no se despliega en Render** (las apps no van ahí): su repo se buildea con
> EAS / corre en Expo Go apuntando `EXPO_PUBLIC_API_URL` al backend de Render.
>
> **Por qué MySQL externo:** Render solo ofrece PostgreSQL administrado. Como el backend usa
> MySQL (Prisma), la base vive en un proveedor externo gratis y el backend apunta ahí.

---

## 0) Dividir en 3 repos

Cada carpeta es la raíz de su propio repo (ya tienen su `.gitignore` y `.env.example`):

```bash
# por cada carpeta (backend, web, mobile):
cd backend            # idem web / mobile
git init && git add . && git commit -m "init"
git remote add origin <URL-del-repo-en-GitHub>
git push -u origin main
```

---

## 1) Base de datos (MySQL administrado externo)

Creá una base **MySQL** en **Aiven** o **Clever Cloud** (tienen plan gratis). Copiá la
**connection string**. Estos servicios exigen **TLS**, así que el `DATABASE_URL` queda así:

```
mysql://usuario:password@host:puerto/basededatos?sslaccept=strict
```

Esa string es el `DATABASE_URL` del backend.

---

## 2) Backend (Render Web Service, Docker)

Ya hay `backend/Dockerfile` (multi-stage) y `backend/render.yaml` (Blueprint). Al arrancar
corre `prisma migrate deploy` y levanta la API.

1. Render → **New → Blueprint** (o New → Web Service) → repo del backend (root = `backend/`).
   Render detecta el Dockerfile solo.
2. Variables de entorno (las marcadas `sync:false` en `render.yaml` se cargan acá):
   - `DATABASE_URL` = la del paso 1 (con `?sslaccept=strict`)
   - `JWT_SECRET` = una frase larga y aleatoria
   - `CORS_ORIGIN` = la URL de tu web en Render (paso 3), **sin barra final**
   - `JWT_EXPIRES_IN` = `7d`, `NODE_ENV` = `production` (ya vienen en el Blueprint)
   - `PORT` → **no la setees**, Render la inyecta y el server la respeta.
3. Deploy. Healthcheck: `GET https://TU-BACKEND.onrender.com/api/health` → `{ "ok": true }`.
4. Datos de ejemplo (opcional), apuntando a la `DATABASE_URL` de prod:
   `cd backend && npm run prisma:seed`.

> **Plan free de Render:** el servicio **se duerme** tras ~15 min sin tráfico; el primer
> request después tarda ~50s (cold start). Los frontends ya están preparados para esto
> (timeouts holgados y mensaje de "el servidor está despertando").
>
> **Archivos subidos (estudios):** el disco es **efímero** → los `uploads/` se pierden al
> redeploy. Aceptable para demo. Mejora futura: almacenamiento de objetos (Cloudinary / S3).

---

## 3) Web (Render Static Site)

Es SPA (Vite + React). Hay `web/render.yaml` con el rewrite de SPA y `web/.nvmrc` (Node 20).

1. Render → **New → Static Site** (o Blueprint) → repo de la web (root = `web/`).
2. Build: `npm ci && npm run build`. Publish directory: `dist`.
3. Variable de entorno: `VITE_API_URL` = `https://TU-BACKEND.onrender.com/api`.
   - Se "hornea" en el build → si la cambiás, hacé **redeploy**.
   - Debe ser **https** (sino el navegador bloquea las llamadas por contenido mixto).
4. El rewrite `/* → /index.html` (ya en `render.yaml`) evita 404 al refrescar rutas internas.
5. Poné esta URL de la web en el `CORS_ORIGIN` del backend (paso 2).

---

## 4) App móvil (Expo, con EAS)

Hay `mobile/eas.json` con perfiles `preview` y `production` y `EXPO_PUBLIC_API_URL` ya
apuntando a `https://hospital-api.onrender.com/api` (cambialo por tu URL real).

```bash
cd mobile
npm i -g eas-cli
eas login
# Editá mobile/eas.json: EXPO_PUBLIC_API_URL = https://TU-BACKEND.onrender.com/api
eas build --profile preview --platform android
```

- Con `EXPO_PUBLIC_API_URL` seteada, la app usa esa URL (le gana al auto-discovery local).
- En desarrollo (Expo Go en la misma red), la app encuentra el backend sola, sin tocar nada.

---

## Checklist final

- [ ] 3 repos creados y pusheados (backend, web, mobile).
- [ ] MySQL externo creado, `DATABASE_URL` (con SSL) copiada.
- [ ] Backend en Render: `/api/health` responde, migraciones aplicadas (ver logs).
- [ ] `CORS_ORIGIN` del backend = URL de la web (sin barra final).
- [ ] Web en Render con `VITE_API_URL` al backend; refrescar `/admin/...` no da 404.
- [ ] App buildeada con `EXPO_PUBLIC_API_URL` al backend.
- [ ] Probar tras dejar dormir el backend: web/app reconectan (no rompen) en el cold start.
- [ ] Smoke test: registro/login, panel admin, login de médico, turno, subir/descargar estudio.
