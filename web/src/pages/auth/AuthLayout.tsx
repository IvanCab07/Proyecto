import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { LogoWordmark } from '../../ui/Logo';

// Layout compartido por las 6 pantallas de ingreso: formulario a la izquierda e ilustración a
// la derecha, todo dentro de una tarjeta redondeada.
//
// LAS ILUSTRACIONES: láminas botánicas de hierbas medicinales, en `web/public/`. Tienen fondo
// transparente a propósito — las plantas quedan recortadas flotando sobre el degradado verde y
// los halos menta de más abajo, así que el verde sigue siendo el lienzo y no se tapa. Por eso
// son WebP y no JPG: sin canal alfa quedarían dentro de una caja negra.
//
// Son WebP y no PNG porque en PNG las tres sumaban 5,2 MB y se bajan antes de ver el formulario
// de login, que es la primera pantalla de la app. Los originales están en `web/assets-fuente/`
// y se convierten con `npm run imagenes` (scripts/optimizar-imagenes.mjs).
//
// Van como background-image y no como <img>, también a propósito: si el archivo no existe, el
// navegador simplemente no pinta nada y queda el verde liso. Un <img> mostraría el ícono de
// imagen rota.
const IMAGENES = {
  login:    "url('/auth-login.webp')",
  register: "url('/auth-register.webp')",
  recovery: "url('/auth-recovery.webp')",
} as const;

type ImagenAuth = keyof typeof IMAGENES;

interface AuthLayoutProps {
  headline: ReactNode;
  tagline: string;
  /** Qué lámina va en el panel derecho. Cada tramo del flujo usa la suya. */
  image?: ImagenAuth;
  children: ReactNode;
}

export function AuthLayout({ headline, tagline, image = 'login', children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas p-0 lg:p-6">
      <div
        className={
          'bg-surface overflow-hidden grid lg:grid-cols-2 '
          + 'min-h-screen lg:min-h-[calc(100vh-3rem)] '
          + 'lg:rounded-[28px] lg:ring-1 lg:ring-inset lg:ring-slate-200/70 lg:shadow-lift'
        }
      >
        {/* Formulario */}
        <div className="flex flex-col p-6 sm:p-10 lg:p-12 overflow-y-auto">
          <LogoWordmark className="text-slate-900" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } }}
            className="w-full max-w-sm mx-auto my-auto py-10"
          >
            {children}
          </motion.div>
        </div>

        {/* Visual — se oculta en pantallas chicas para dejarle todo el ancho al formulario */}
        <div className="relative hidden lg:block gradient-card overflow-hidden">
          {/* Halos menta: se ven cuando no hay foto y le dan profundidad al degradado */}
          <div
            className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #7BDC93, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #22C55E, transparent 70%)' }}
          />

          {/* La lámina, si está. `contain` para que entre entera (es un recorte: al recortarla
              con `cover` se perderían plantas por los costados). El 42% la levanta apenas y
              despeja la base, que es donde va el titular — es la perilla de ajuste fino. */}
          <div
            className="absolute inset-0 bg-contain bg-no-repeat"
            style={{ backgroundImage: IMAGENES[image], backgroundPosition: 'center 42%' }}
          />

          {/* Velo: hace que el texto se lea sobre cualquier imagen, clara u oscura, y también
              sobre el degradado cuando no hay ninguna */}
          <div className="absolute inset-0 bg-gradient-to-t from-rail/85 via-rail/25 to-transparent" />

          {/* Absoluto y no h-full: así el texto queda anclado abajo aunque la columna
              crezca porque el formulario de al lado es largo (el de registro, por ejemplo) */}
          <div className="absolute inset-0 flex flex-col justify-end p-12">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.1, ease: [0.25, 1, 0.5, 1] } }}
              className="text-[38px] font-bold leading-[1.1] tracking-tighter2 text-rail-fg max-w-md"
            >
              {headline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.18, ease: [0.25, 1, 0.5, 1] } }}
              className="text-rail-fg/75 text-[15px] leading-relaxed mt-4 max-w-md"
            >
              {tagline}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
