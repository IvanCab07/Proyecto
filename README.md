# Sistema de Gestión Hospitalaria

Aplicación para gestionar turnos médicos de un hospital. Tiene **web** (para el equipo) y
**app móvil** (para pacientes y médicos), sobre una **API REST** compartida.

Hay **tres tipos de cuenta**: **Paciente**, **Médico** y **Administrador**.

## Tecnologías

- **Backend:** Node.js + Express + TypeScript + Prisma (MySQL) · auth con JWT
- **Web:** Vite + React + TypeScript + Tailwind
- **Mobile:** React Native + Expo (SDK 54) + NativeWind
- **Estado/datos:** Zustand + TanStack Query

## Requisitos

- Node.js 18 o superior
- MySQL 8 corriendo en local
- Expo Go en el celular (para la app móvil)

## Estructura

```
Proyecto-Gestion-Hospitalaria/
├── backend/   API REST (Express + Prisma + MySQL)
├── web/       App web (Vite + React)
└── mobile/    App móvil (Expo + React Native)
```

Puertos: backend **3000**, web **5173**, Expo (Metro) **8081**.

---

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Editar `backend/.env`:

```env
DATABASE_URL="mysql://root:TU_CONTRASEÑA@localhost:3306/hospital_db"
JWT_SECRET="una-frase-larga-y-aleatoria"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="*"
```

Crear la base, generar el cliente y cargar datos de prueba:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

Iniciar:

```bash
npm run dev          # http://localhost:3000/api
```

## 2. Web

```bash
cd web
npm install
npm run dev          # http://localhost:5173
```

## 3. Mobile

```bash
cd mobile
npm install
npx expo start -c
```

Escaneá el QR con **Expo Go**. La app busca el backend sola; si no lo encuentra, en la
pantalla de login tocá **"Configurar servidor"** y escribí la IP de la PC (ej. `192.168.1.50`).
El celular y la PC tienen que estar en la misma red WiFi.

---

## Usuarios de prueba

| Rol       | Email                | Contraseña |
|-----------|----------------------|------------|
| Admin     | admin@hospital.com   | admin123   |
| Médico    | medico@hospital.com  | medico123  |
| Paciente  | paciente@test.com    | test123    |

---

## Qué hace cada rol

### Paciente
- Solicitar turno (especialidad, médico, fecha y hora) y pedir sobreturnos.
- Ver sus turnos (próximos e historial) y cancelarlos.
- Ver recetas, subir y consultar estudios.
- Calificar a los médicos después del turno.
- Mapa de centros de salud.

### Médico
- **Inicio:** resumen del día (turnos de hoy, próximos, completados).
- **Agenda:** sus turnos asignados; confirmar, completar o cancelar y cargar diagnóstico/notas.
- **Mis pacientes:** historial de a quién atendió y emisión de recetas.
- **Calificaciones:** reseñas y promedio que le dejaron los pacientes.
- **Perfil:** editar datos, marcarse disponible / no disponible.

### Administrador
Enfocado en **administrar cuentas**:
- **Usuarios:** crear, editar, eliminar cuentas (pacientes, médicos, admins), resetear contraseñas, activar/desactivar.
- **Médicos:** alta/baja de médicos y disponibilidad.
- **Especialidades:** catálogo usado para dar de alta médicos.
- **Calificaciones** y **Reportes:** vista general de reseñas y estadísticas.

El registro público crea siempre cuentas de **paciente**. Las cuentas de médico y admin
las crea únicamente el administrador desde **Usuarios**.
