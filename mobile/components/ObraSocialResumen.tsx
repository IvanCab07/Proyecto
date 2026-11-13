import { View, Text } from 'react-native';
import type { User } from '../services';
import { Card, Button, DataRow, SectionHead, IconCreditCard, IconEdit } from './ui';
import { useTheme } from '../lib/useTheme';
import { formatFecha } from '../lib/format';
import { estaVencida, diasHastaVencer, DIAS_POR_VENCER } from '../lib/fechas';
import { cn } from '../lib/cn';

export type EstadoCobertura = 'particular' | 'vigente' | 'por-vencer' | 'vencida' | 'sin-vencimiento';

/** Estado de la credencial del paciente. Fuente única para el badge del perfil y el aviso del inicio. */
export function estadoCobertura(user?: Pick<User, 'obraSocialId' | 'vencimientoObraSocial'> | null): EstadoCobertura {
  if (!user?.obraSocialId) return 'particular';
  const venc = user.vencimientoObraSocial;
  if (!venc) return 'sin-vencimiento';
  if (estaVencida(venc)) return 'vencida';
  return diasHastaVencer(venc) <= DIAS_POR_VENCER ? 'por-vencer' : 'vigente';
}

const BADGE: Record<EstadoCobertura, { label: string; bg: string; text: string }> = {
  particular:        { label: 'Particular',     bg: 'bg-slate-100',  text: 'text-slate-500' },
  'sin-vencimiento': { label: 'Activa',         bg: 'bg-success-soft', text: 'text-success-text' },
  vigente:           { label: 'Vigente',        bg: 'bg-success-soft', text: 'text-success-text' },
  'por-vencer':      { label: 'Por vencer',     bg: 'bg-warning-soft', text: 'text-warning-text' },
  vencida:           { label: 'Vencida',        bg: 'bg-danger-soft',  text: 'text-danger-text' },
};

export function BadgeCobertura({ estado }: { estado: EstadoCobertura }) {
  const b = BADGE[estado];
  return (
    <View className={cn('px-2.5 py-0.5 rounded-pill', b.bg)}>
      <Text className={cn('text-[11px] font-bold uppercase tracking-wider', b.text)}>{b.label}</Text>
    </View>
  );
}

/**
 * Tarjeta de solo lectura con la cobertura del paciente. La usan el perfil (con botón para
 * editar) y la pantalla de obra social (arriba del formulario).
 */
export function ObraSocialResumen({ user, onEditar }: { user: User | null; onEditar?: () => void }) {
  const { colors } = useTheme();
  const estado = estadoCobertura(user);
  const tiene = estado !== 'particular';

  return (
    <Card className="p-5">
      <View className="flex-row items-start justify-between">
        <SectionHead icon={<IconCreditCard size={15} color={colors.brand[600]} />} title="Obra social" />
        <BadgeCobertura estado={estado} />
      </View>

      {tiene ? (
        <>
          <DataRow label="Obra social" value={user?.obraSocial?.nombre ?? '—'} />
          <DataRow label="N° de afiliado" value={user?.numeroAfiliado || 'No cargado'} />
          <DataRow
            label="Vencimiento"
            value={user?.vencimientoObraSocial ? formatFecha(user.vencimientoObraSocial) : 'Sin vencimiento'}
            last
          />
        </>
      ) : (
        <Text className="text-slate-500 text-sm leading-5">
          No tenés una obra social cargada: tus turnos se registran como particular.
        </Text>
      )}

      {estado === 'vencida' ? (
        <Text className="text-danger-text text-[13px] mt-3">Tu credencial venció. Actualizá la fecha para que la clínica la tome.</Text>
      ) : null}

      {onEditar ? (
        <View className="mt-4">
          <Button variant="secondary" fullWidth size="sm" iconLeft={<IconEdit size={15} color={colors.brand[600]} />} onPress={onEditar}>
            {tiene ? 'Editar cobertura' : 'Cargar obra social'}
          </Button>
        </View>
      ) : null}
    </Card>
  );
}
