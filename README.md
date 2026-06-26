# Hospital App

Sistema de gestion de hospitales. Aplicacion movil para pacientes y administradores con backend REST.

## Tecnologias

- Mobile: React Native + TypeScript + Expo SDK 54 + NativeWind
- Web: Vite + React + TypeScript + Tailwind (en construccion, ver TAREAS.md)
- Backend: Node.js + Express + TypeScript
- Base de datos: MySQL + Prisma ORM
- Auth: JWT
- Estado: Zustand + TanStack Query

## Requisitos previos

- Node.js 18 o superior
- MySQL 8.x en ejecucion local
- Expo Go instalado en el celular (soporte SDK 54)

## Estructura del proyecto

```
Proyecto-Gestion-Hospitalaria/
├── backend/    API REST (Express + Prisma + MySQL)
├── mobile/     App movil (Expo + React Native)
└── web/        Sitio web (Vite + React + Tailwind)  (a crear, ver TAREAS.md)
```

Puertos: backend **3000**, web (Vite) **5173**, Metro (Expo) **8081**.

---

## Paso 1 — Configurar el backend

```bash
cd backend
npm install
copy .env.example .env
```

Editar `backend/.env`:

```env
DATABASE_URL="mysql://root:TU_CONTRASENA@localhost:3306/hospital_db"
JWT_SECRET="inventate-una-frase-larga-y-random"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="*"
```

## Paso 2 — Crear la base de datos y cargar datos de prueba

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

Si el seed funciona, aparece:

```
Especialidades creadas
Medicos creados
Admin creado (admin@hospital.com / admin123)
Paciente creado (paciente@test.com / test123)
Seed completado!
```

## Paso 3 — Iniciar el backend

```bash
npm run dev
```

Al iniciar, el backend lista **todas** las IPs detectadas, marca la recomendada,
hace un self-check de que la API responde, y muestra un **QR** con la URL del API
(escanealo con la camara del celular para verla):

```
[Backend] Hospital API iniciada
  Local:  http://localhost:3000/api
  IPs de red detectadas:
    http://192.168.1.50:3000/api   [Wi-Fi] <- RECOMENDADA
    http://172.17.0.1:3000/api     [vEthernet (WSL)]

  Self-check localhost: OK
  Self-check http://192.168.1.50:3000/api: OK
```

Usar la IP marcada como RECOMENDADA (ignorar las de VirtualBox/WSL/Hyper-V).

## Paso 4 — Configurar la app movil

```bash
cd mobile
npm install
```

**La app busca el servidor sola al arrancar**: prueba en paralelo la ultima URL
que funciono, la IP de la PC donde corre Metro y otras candidatas, y usa la
primera que responda. En general **no hay que configurar nada**.

Si no lo encuentra, en la pantalla de ingreso aparece un aviso y el link
**"Configurar servidor"**: ahi se tipea la IP de la PC (alcanza con la IP pelada,
ej. `192.168.1.50`), se toca "Probar conexion" y "Guardar y usar". La URL queda
guardada para los proximos arranques.

Crear `.env` solo si se usa un tunel (la variable le gana a todo lo demas):

```bash
copy .env.example .env
```

```env
EXPO_PUBLIC_API_URL=https://tu-tunel.trycloudflare.com/api
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
```

## Paso 5 — Iniciar la app

```bash
npx expo start -c
```

Escanear el QR con Expo Go en el celular. El celular y la computadora tienen que estar en la misma red WiFi.

---

## Correr el proyecto en otra computadora (escuela, casa de un amigo, etc.)

### Modo a prueba de redes (recomendado) — un solo comando

Desde la **raíz** del proyecto:

```bash
npm run dev:tunnel
```

Esto levanta el backend, abre un **túnel público** con cloudflared, escribe la URL del API
en `mobile/.env` y `web/.env` **solo** (la app la toma sin que tipees nada), y arranca Expo con
túnel de Metro. Funciona en **cualquier red** —incluida la PC de escritorio del colegio, WiFi que
aísla dispositivos o datos móviles— porque no depende de la red local. Escaneá el QR de Expo y listo.

> Requiere internet (la primera vez `npx` descarga `cloudflared`). La URL del túnel es nueva en cada
> corrida, pero el comando reescribe `mobile/.env` cada vez, así que no queda vieja.

### Modo LAN clásico (misma WiFi)

1. `npm run dev` en `backend/` y `npx expo start -c` en `mobile/`. La app **busca el servidor sola**.
2. Si no conecta, en la app: **Perfil → Diagnóstico de conexión** muestra qué probó y deja
   tipear/escanear la IP RECOMENDADA que imprime el backend.

**Importante:** si quedó un `mobile/.env` con una IP de otra red, borralo o vacialo —
`EXPO_PUBLIC_API_URL` tiene prioridad sobre la detección automática (`dev:tunnel` lo reescribe solo).

Si hay problemas de versiones al instalar dependencias del mobile, ejecutar:

```bash
npx expo install --fix
```

Esto sincroniza todas las librerias con la version de Expo SDK 54 instalada.

---

## El celular no se conecta al backend (colegio / WiFi nuevo)

Sintoma tipico: la base se crea, front y back arrancan, pero las peticiones del
celular no llegan al backend. Revisar en este orden:

| Sintoma | Causa probable | Solucion |
|---|---|---|
| La app avisa "No se encontro el servidor" | Firewall de Windows bloquea el puerto 3000 | En `backend/`: `npm run firewall` (pide permisos de admin) |
| Todas las URLs fallan en "Configurar servidor" | Celular y PC en redes distintas | Conectar ambos al MISMO WiFi |
| IP correcta, firewall abierto, igual falla | WiFi con aislamiento de clientes (tipico en colegios) | Hotspot del celular: conectar la PC al hotspot y reintentar. O tunel (abajo) |
| Funcionaba en casa y en otra red no | Quedo un `mobile/.env` con la IP vieja | Borrar/vaciar `mobile/.env` (la variable le gana a la deteccion automatica) |

**Herramientas integradas:**

- **"Configurar servidor"** (link en la pantalla de ingreso de la app): muestra
  todas las URLs que la app probo y el error de cada una, permite tipear una IP
  a mano, probarla y guardarla.
- El backend al arrancar imprime self-checks, la IP RECOMENDADA y un QR con la URL.
- En Ajustes (admin) tambien hay "Probar conexion" y acceso a "Configurar servidor".

**Tunel (ultimo recurso, atraviesa cualquier red):**

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Pegar la URL publica que devuelve (con `/api` al final) en "Configurar servidor"
o en `mobile/.env` como `EXPO_PUBLIC_API_URL`, y arrancar Metro con
`npx expo start --tunnel`.

> Ojo: `npx expo start --tunnel` solo tuneliza **Metro** (la descarga de la app),
> NO la API. Para la API hace falta el tunel de cloudflared/localtunnel aparte.

---

## Correr backend + web + celular a la vez

Tras crear el `package.json` raiz (ver `TAREAS.md`, frente E):

```bash
npm run dev          # levanta backend + web juntos
```

El celular (Expo) conviene en su propia terminal por el QR:

```bash
cd mobile && npx expo start -c
```

---

## Usuarios de prueba

| Rol       | Email                  | Contrasena |
|-----------|------------------------|------------|
| Admin     | admin@admin.com        | admin123   |
| Admin     | admin@hospital.com     | admin123   |
| Médico    | medico@hospital.com    | medico123  |
| Paciente  | paciente@test.com      | test123    |

> Los **médicos** inician sesión en la **web** (`/medico/...`): ven su agenda, completan turnos con
> diagnóstico y emiten recetas. El **admin** gestiona todas las cuentas y roles desde **Usuarios**
> (crear pacientes/médicos/admins, resetear contraseñas, activar/desactivar, eliminar).
>
> Para deployar web, app, backend y base en servidores separados, ver **[DEPLOY.md](DEPLOY.md)**.

---

## Funcionalidades

### Paciente
- Ver turnos activos e historial, con estado (Pendiente, Confirmado, Completado, Cancelado)
- Cancelar turnos pendientes
- Solicitar turno: elegir especialidad, medico, fecha y horario
- Subir y ver estudios medicos (PDF o imagen)
- Ver recetas emitidas por medicos
- Mapa con ubicacion del hospital y centros de salud cercanos

### Administrador
- Panel con estadisticas: total, pendientes, turno de hoy
- Filtrar turnos por estado
- Cambiar estado de cualquier turno
- Ver lista de pacientes con busqueda por nombre, apellido o DNI
- Ver historial completo de cada paciente: turnos, recetas y estudios
