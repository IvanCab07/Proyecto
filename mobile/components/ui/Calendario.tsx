import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card } from './Card';
import { IconChevronLeft, IconChevronRight } from './Icon';
import { useTheme } from '../../lib/useTheme';
import { haptic } from '../../lib/haptics';
import { MESES_COMPLETOS, DIAS_SEMANA_LUNES, claveDeDia } from '../../lib/fechas';

/**
 * Un punto de color debajo del número del día. El llamador decide el color: los turnos pasan
 * `STATUS[t.status].dot` para que se distinga un turno cancelado de uno confirmado.
 */
export interface MarcaDia {
  key: string;
  color: string;
}

export interface CalendarioProps {
  /** Marcas por día. La clave es "YYYY-MM-DD". */
  marcas?: Record<string, MarcaDia[]>;
  /** Día seleccionado ("YYYY-MM-DD") o null. Lo controla el padre. */
  seleccion?: string | null;
  onSelect?: (fecha: string) => void;
  /** Qué días no se pueden tocar. Por defecto, los que no tienen marcas siguen siendo tocables. */
  deshabilitar?: (fecha: string, dia: Date) => boolean;
  /** Mes visible al montar. Por defecto el de hoy. */
  mesInicial?: Date;
  onMesChange?: (primerDiaDelMes: Date) => void;
  titulo?: string;
  ayuda?: string;
  /** Contenido al pie, dentro de la misma tarjeta (leyenda, resumen del día elegido). */
  pie?: ReactNode;
  /** Envolver en <Card>. Poner false si ya está adentro de una. */
  conCard?: boolean;
  /** 'compacta' baja el alto de celda, para cuando va arriba de una lista larga. */
  densidad?: 'normal' | 'compacta';
}

const MAX_PUNTOS = 3;

/**
 * Calendario mensual de la app. Lo usan los turnos del paciente, la agenda del médico y el
 * selector de fecha de "Solicitar turno".
 *
 * Dos reglas de las que depende que se vea bien en los dos temas:
 *
 * 1. El estado visual de cada celda se resuelve por `style`, NUNCA acumulando clases de borde.
 *    Antes se concatenaban `border` y `border-2` en el mismo className y, cuando un día era hoy
 *    Y tenía turnos, las dos reglas competían y el borde salía cualquiera.
 * 2. Cero literales hex: todos los colores salen de `useTheme()`, así el modo oscuro sale por
 *    construcción y no hay que acordarse de invertir nada.
 */
export function Calendario({
  marcas = {},
  seleccion = null,
  onSelect,
  deshabilitar,
  mesInicial,
  onMesChange,
  titulo = 'Calendario',
  ayuda,
  pie,
  conCard = true,
  densidad = 'normal',
}: CalendarioProps) {
  const { colors } = useTheme();
  const hoy = useMemo(() => new Date(), []);
  const [mesVisible, setMesVisible] = useState(
    () => mesInicial ?? new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );

  const altoCelda = densidad === 'compacta' ? 34 : 40;
  const claveHoy = claveDeDia(hoy);

  // Grilla del mes: huecos hasta el primer día (semana que arranca en lunes) + los días + relleno
  const celdas = useMemo(() => {
    const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1);
    const ultimoDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0);
    // getDay() devuelve 0 para domingo; +6 %7 lo corre para que el lunes sea la columna 0
    const huecos = (primerDia.getDay() + 6) % 7;
    const dias: Array<Date | null> = [
      ...Array.from({ length: huecos }, () => null),
      ...Array.from(
        { length: ultimoDia.getDate() },
        (_, i) => new Date(mesVisible.getFullYear(), mesVisible.getMonth(), i + 1),
      ),
    ];
    while (dias.length % 7 !== 0) dias.push(null);
    return dias;
  }, [mesVisible]);

  const cambiarMes = (delta: number) => {
    const nuevo = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + delta, 1);
    setMesVisible(nuevo);
    onMesChange?.(nuevo);
    haptic.select();
  };

  const contenido = (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 pr-2">
          <Text className="text-[15px] font-bold text-slate-900">{titulo}</Text>
          {ayuda ? <Text className="text-[12px] text-slate-400 mt-0.5">{ayuda}</Text> : null}
        </View>
        <View className="flex-row gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            onPress={() => cambiarMes(-1)}
            className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center"
          >
            <IconChevronLeft size={17} color={colors.slate[600]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            onPress={() => cambiarMes(1)}
            className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center"
          >
            <IconChevronRight size={17} color={colors.slate[600]} />
          </Pressable>
        </View>
      </View>

      <Text className="text-center text-[14px] font-bold text-slate-900 mb-2.5">
        {MESES_COMPLETOS[mesVisible.getMonth()]} {mesVisible.getFullYear()}
      </Text>

      <View className="flex-row mb-1">
        {DIAS_SEMANA_LUNES.map(dia => (
          <Text key={dia} className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase">
            {dia}
          </Text>
        ))}
      </View>

      {Array.from({ length: celdas.length / 7 }, (_, fila) => (
        <View key={fila} className="flex-row mb-1">
          {celdas.slice(fila * 7, fila * 7 + 7).map((dia, columna) => {
            if (!dia) return <View key={`vacio-${columna}`} style={{ flex: 1, height: altoCelda }} />;

            const clave = claveDeDia(dia);
            const puntos = marcas[clave] ?? [];
            const esHoy = clave === claveHoy;
            const activo = seleccion === clave;
            const bloqueado = deshabilitar?.(clave, dia) ?? false;

            // Un solo borde posible: si está seleccionado el fondo ya lo distingue, así que el
            // anillo de "hoy" solo se dibuja cuando NO está seleccionado.
            const fondo = activo
              ? colors.brand[600]
              : puntos.length
                ? colors.brand[50]
                : 'transparent';

            const textoColor = bloqueado
              ? colors.slate[300]
              : activo
                ? colors.white
                : puntos.length
                  ? colors.brand[700]
                  : colors.slate[600];

            return (
              <View key={clave} className="flex-1 px-0.5">
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo, disabled: bloqueado }}
                  accessibilityLabel={
                    `${dia.getDate()} de ${MESES_COMPLETOS[dia.getMonth()]}` +
                    (puntos.length ? `, ${puntos.length} turno${puntos.length !== 1 ? 's' : ''}` : '')
                  }
                  disabled={bloqueado || !onSelect}
                  onPress={() => { haptic.select(); onSelect?.(clave); }}
                  style={{
                    height: altoCelda,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: fondo,
                    borderWidth: esHoy && !activo ? 1.5 : 0,
                    borderColor: colors.brand[500],
                    opacity: bloqueado ? 0.45 : 1,
                  }}
                >
                  <Text
                    style={{ color: textoColor, fontSize: 13, fontWeight: '700' }}
                  >
                    {dia.getDate()}
                  </Text>

                  {puntos.length ? (
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 1 }}>
                      {puntos.slice(0, MAX_PUNTOS).map(p => (
                        <View
                          key={p.key}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            // Sobre el fondo lleno de la selección los colores de estado se
                            // pierden; ahí los puntos van en blanco.
                            backgroundColor: activo ? colors.white : p.color,
                          }}
                        />
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}

      {pie ? <View className="mt-2">{pie}</View> : null}
    </>
  );

  if (!conCard) return <View>{contenido}</View>;
  return <Card className="p-4">{contenido}</Card>;
}
