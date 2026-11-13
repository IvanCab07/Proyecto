import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { RecordatorioSalud, Turno } from '../services';
import { fechaDeTurno } from './fechas';

// Configurar cómo se muestran las notificaciones cuando la app está abierta en pantalla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let canalesDisponibles = false;

/**
 * Configura los canales de notificación de Android con sonido y vibración prioritarios.
 */
export async function configurarCanalesNotificaciones(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('medicamentos', {
        name: 'Recordatorio de Medicamentos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2C5F4E',
        sound: 'default',
      });
      canalesDisponibles = true;
    } catch (e) {
      // En Expo Go de Android NotificationsChannelsProvider puede ser null
      canalesDisponibles = false;
    }

    try {
      await Notifications.setNotificationChannelAsync('turnos', {
        name: 'Recordatorio de Turnos Médicos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2C5F4E',
        sound: 'default',
      });
    } catch {}
  }
}

/**
 * Solicita permisos de notificación al usuario si aún no fueron concedidos.
 */
export async function solicitarPermisosNotificaciones(): Promise<boolean> {
  try {
    await configurarCanalesNotificaciones();
  } catch {}

  try {
    const existing = await Notifications.getPermissionsAsync();
    let isGranted = existing.granted || existing.status === 'granted';

    if (!isGranted) {
      const requested = await Notifications.requestPermissionsAsync();
      isGranted = requested.granted || requested.status === 'granted';
    }

    return isGranted;
  } catch (error) {
    // Si falla la consulta de permisos en Expo Go pero están activos en el sistema, no bloqueamos
    return true;
  }
}

/**
 * Dispara una notificación de prueba en N segundos.
 * Permite cerrar la app o bloquear el teléfono para verificar que el sistema operativo la lance.
 */
export async function dispararNotificacionPrueba(segundos = 5): Promise<string> {
  try {
    await solicitarPermisosNotificaciones();
  } catch {}

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Vitalis: Hora de tu medicación',
      body: 'Prueba exitosa: Amoxicilina 500mg. ¡La alarma del sistema funciona aunque cierres la app!',
      data: { tipo: 'MEDICAMENTO_PRUEBA' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, segundos),
      repeats: false,
      ...(canalesDisponibles ? { channelId: 'medicamentos' } : {}),
    },
  });
}

/**
 * Sincroniza todos los recordatorios activos de salud con las alarmas locales del teléfono.
 * Se programa una alarma recurrente diaria para cada horario configurado (ej: 08:00, 16:00).
 */
export async function sincronizarRecordatoriosLocales(recordatorios: RecordatorioSalud[]): Promise<number> {
  try {
    const tienePermiso = await solicitarPermisosNotificaciones();
    if (!tienePermiso) return 0;

    // 1. Limpiar notificaciones programadas previas de medicamentos para evitar duplicados
    const programadas = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of programadas) {
      if (notif.identifier && notif.identifier.startsWith('med-')) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // 2. Programar las alarmas para cada recordatorio activo
    let programadasCount = 0;
    const activos = recordatorios.filter(r => r.activo);

    for (const rec of activos) {
      if (!Array.isArray(rec.horarios)) continue;

      for (const hStr of rec.horarios) {
        const partes = hStr.split(':');
        if (partes.length !== 2) continue;

        const hora = parseInt(partes[0], 10);
        const minuto = parseInt(partes[1], 10);
        if (isNaN(hora) || isNaN(minuto) || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) continue;

        const identifier = `med-${rec.id}-${hStr}`;

        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: `💊 Vitalis: ${rec.titulo}`,
            body: rec.dosis
              ? `Es hora de tu dosis: ${rec.dosis}`
              : `Es hora de tomar tu tratamiento: ${rec.titulo}`,
            data: { tipo: 'MEDICAMENTO', recordatorioId: rec.id, horario: hStr },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hora,
            minute: minuto,
            ...(canalesDisponibles ? { channelId: 'medicamentos' } : {}),
          },
        });

        programadasCount++;
      }
    }

    return programadasCount;
  } catch (err) {
    console.error('[notifications] Error al sincronizar recordatorios:', err);
    return 0;
  }
}

/** Hora (local) del día anterior al turno a la que llega el aviso. */
export const HORA_AVISO_TURNO = 18;
export const MINUTO_AVISO_TURNO = 0;

// Las sincronizaciones se encadenan: dos corriendo a la vez se pisarían al cancelar y
// reprogramar las mismas notificaciones.
let colaTurnos: Promise<unknown> = Promise.resolve();

/**
 * Deja programado un aviso por cada turno vigente: el día anterior a las HORA_AVISO_TURNO,
 * "mañana tenés turno". Cancela primero los avisos de turnos que ya estaban programados, así
 * un turno cancelado o reagendado no deja una alarma colgada.
 *
 * Si el aviso caería en el pasado (turno para mañana reservado después de esa hora) no se
 * programa: el paciente acaba de sacarlo.
 */
export function sincronizarRecordatoriosTurnos(turnos: Turno[]): Promise<number> {
  const tarea = colaTurnos.then(() => programarAvisosTurnos(turnos));
  colaTurnos = tarea.catch(() => {});
  return tarea;
}

async function programarAvisosTurnos(turnos: Turno[]): Promise<number> {
  try {
    const tienePermiso = await solicitarPermisosNotificaciones();
    if (!tienePermiso) return 0;

    const programadas = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of programadas) {
      if (notif.identifier?.startsWith('turno-')) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const ahora = new Date();
    let cantidad = 0;

    for (const turno of turnos) {
      if (turno.status !== 'PENDIENTE' && turno.status !== 'CONFIRMADO') continue;

      // fechaDeTurno ancla la fecha al mediodía local: `new Date(turno.fecha)` corre un día en UTC-3.
      const aviso = fechaDeTurno(turno.fecha);
      aviso.setDate(aviso.getDate() - 1);
      aviso.setHours(HORA_AVISO_TURNO, MINUTO_AVISO_TURNO, 0, 0);
      if (isNaN(aviso.getTime()) || aviso <= ahora) continue;

      const medico = turno.medico ? `Dr. ${turno.medico.apellido}` : 'tu médico';
      const especialidad = turno.medico?.especialidad?.nombre;

      await Notifications.scheduleNotificationAsync({
        identifier: `turno-${turno.id}`,
        content: {
          title: '🗓️ Vitalis: Mañana tenés turno',
          body: `Mañana a las ${turno.hora} hs con ${medico}${especialidad ? ` (${especialidad})` : ''}.`,
          data: { tipo: 'TURNO', turnoId: turno.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: aviso,
          ...(canalesDisponibles ? { channelId: 'turnos' } : {}),
        },
      });
      cantidad++;
    }

    return cantidad;
  } catch (err) {
    console.error('[notifications] Error al sincronizar avisos de turnos:', err);
    return 0;
  }
}

/**
 * Devuelve la lista de todas las notificaciones actualmente programadas en el teléfono.
 */
export async function getNotificacionesProgramadas(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * La notificación que abrió la app desde cero (estaba cerrada y se la abrió tocándola).
 *
 * El listener de `suscribirRespuestaNotificacion` no la ve: el toque ocurrió antes de que la app
 * lo registrara. Se consume una sola vez: si no se limpia, cada arranque la volvería a procesar.
 */
export function consumirRespuestaInicialNotificacion(): { tipo?: string; recordatorioId?: string; turnoId?: string } | null {
  try {
    const response = Notifications.getLastNotificationResponse();
    if (!response) return null;
    Notifications.clearLastNotificationResponse();
    return (response.notification?.request?.content?.data as any) ?? null;
  } catch {
    return null;
  }
}

/**
 * Escucha cuando el usuario toca una notificación en la barra del teléfono.
 */
export function suscribirRespuestaNotificacion(
  callback: (data: { tipo?: string; recordatorioId?: string; turnoId?: string }) => void
) {
  try {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response?.notification?.request?.content?.data as any;
      if (data) {
        callback(data);
      }
    });

    return () => {
      try {
        sub.remove();
      } catch {}
    };
  } catch (err) {
    console.warn('[notifications] Error al suscribir respuesta:', err);
    return () => {};
  }
}

