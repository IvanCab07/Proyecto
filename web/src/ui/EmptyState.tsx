import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { fadeInUp } from '../lib/motion';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center text-center py-16 px-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center ring-8 ring-brand-50/40 mb-5 [&>svg]:w-6 [&>svg]:h-6">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tightish text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 leading-relaxed max-w-sm mt-1.5">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
