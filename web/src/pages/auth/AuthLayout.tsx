import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { listContainer, listItem } from '../../lib/motion';
import { IconCalendar, IconDoc, IconChart } from '../../ui/icons';

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

// Features compartidas por las pantallas de auth (login, registro, reseteo, etc.)
export const AUTH_FEATURES: Feature[] = [
  { icon: <IconCalendar />, title: 'Turnos digitales',   desc: 'Solicitá y gestioná tus turnos online' },
  { icon: <IconDoc />,      title: 'Recetas y estudios', desc: 'Tus documentos médicos, siempre a mano' },
  { icon: <IconChart />,    title: 'Reportes claros',    desc: 'Estadísticas actualizadas al instante' },
];

interface AuthLayoutProps {
  headline: ReactNode;
  tagline: string;
  features: Feature[];
  children: ReactNode;
}

function Monogram() {
  return (
    <div
      className="w-10 h-10 rounded-xl grid place-items-center font-bold text-xl leading-none select-none shrink-0 bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-brand"
      aria-hidden="true"
    >
      H<span className="text-brand-100 text-sm">+</span>
    </div>
  );
}

export function AuthLayout({ headline, tagline, features, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Panel izquierdo — solo desktop */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-between p-12 text-white bg-rail bg-gradient-to-br from-[#0C2422] via-rail to-[#0A1615]">
        {/* Halos teal */}
        <div
          className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #14B8A6, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0D9488, transparent 70%)' }}
        />

        <div className="relative flex items-center gap-3">
          <Monogram />
          <span className="font-semibold text-[15px] tracking-tightish">Hospital</span>
        </div>

        <motion.div variants={listContainer} initial="hidden" animate="visible" className="relative max-w-md">
          <motion.h1 variants={listItem} className="text-[42px] font-bold leading-[1.08] tracking-tighter2 text-white">
            {headline}
          </motion.h1>
          <motion.p variants={listItem} className="text-slate-300 text-[15px] leading-relaxed mt-4 mb-10">
            {tagline}
          </motion.p>

          <div className="space-y-2.5">
            {features.map(f => (
              <motion.div
                key={f.title}
                variants={listItem}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/10 backdrop-blur-sm"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 grid place-items-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-[13px] text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="relative text-xs text-slate-500">Sistema de gestión hospitalaria · Teal Clinical</p>
      </div>

      {/* Lado del formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } }}
          className="w-full max-w-sm py-6"
        >
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <Monogram />
            <span className="font-semibold text-slate-900 tracking-tightish">Hospital</span>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
