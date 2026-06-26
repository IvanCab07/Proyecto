# App móvil — Hospital (Expo / React Native)

App en **Expo (managed)** con **expo-router**, NativeWind, Zustand y React Query.
La conexión al backend es automática: la app **busca el servidor sola** al arrancar.

## Desarrollo

```bash
npm install
npm start                 # Expo Dev Server (escaneás el QR con Expo Go)
npm run android           # abre en emulador/dispositivo Android
```

En desarrollo, con el celular y la PC en la **misma red**, la app detecta el backend solo
(usa la IP de la PC donde corre Metro) — no hace falta configurar nada.

## Cómo elige a qué backend conectarse

`services/serverDiscovery.ts` prueba en paralelo varias URLs candidatas y se queda con la
primera que responde `GET /health`. Orden de prioridad:

1. `EXPO_PUBLIC_API_URL` (si está seteada, **le gana a todo**)
2. la última URL que funcionó (guardada en AsyncStorage)
3. la IP de la PC de desarrollo (vía Metro)
4. emulador Android (`10.0.2.2`) / `localhost`

- A los backends **remotos/https** (p. ej. Render) se les da un timeout más largo y, si
  fijaste `EXPO_PUBLIC_API_URL`, se confía en esa URL aunque el primer probe expire por
  **cold start** (Render free duerme el servicio). El request real reintenta con timeout holgado.
- Si nada responde, la pantalla **"Configurar servidor"** permite escribir la IP/URL a mano.

## Apuntar a un backend desplegado (Render)

Las apps **no se despliegan en Render**; solo apuntan al backend de Render.

- **En desarrollo:** creá `.env` con `EXPO_PUBLIC_API_URL=https://TU-BACKEND.onrender.com/api`.
- **En builds (EAS):** `eas.json` ya trae `EXPO_PUBLIC_API_URL` en los perfiles `preview` y
  `production` (cambiá el placeholder por tu URL real).

```bash
npm i -g eas-cli
eas login
eas build --profile preview --platform android
```

`EXPO_PUBLIC_GOOGLE_MAPS_KEY` es necesaria para el mapa en builds de producción (en Expo Go
el mapa anda sin key).

Guía completa de los 3 servicios en `../DEPLOY.md`.
