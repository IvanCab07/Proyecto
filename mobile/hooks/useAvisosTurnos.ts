import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useMisTurnos } from './index';
import {
  sincronizarRecordatoriosTurnos,
  suscribirRespuestaNotificacion,
  consumirRespuestaInicialNotificacion,
} from '../lib/notifications';

type DatosNotificacion = { tipo?: string };

/**
 * Mantiene programado el aviso "mañana tenés turno" de cada turno del paciente, y lleva a Mi
 * agenda cuando toca una notificación (de turno o de medicación), con la app abierta, en
 * segundo plano o cerrada.
 *
 * Va en el layout del paciente y no en una pantalla: así los avisos se reprograman en cuanto
 * cambian los turnos (se saca uno, se cancela otro), sin depender de que abra la agenda.
 */
export function useAvisosTurnos() {
  const router = useRouter();
  const { data: turnos } = useMisTurnos();

  useEffect(() => {
    if (turnos) sincronizarRecordatoriosTurnos(turnos);
  }, [turnos]);

  useEffect(() => {
    const abrir = (data?: DatosNotificacion | null) => {
      if (data?.tipo === 'TURNO') {
        router.navigate({ pathname: '/patient/agenda', params: { tab: 'turnos' } });
      } else if (data?.tipo === 'MEDICAMENTO' || data?.tipo === 'MEDICAMENTO_PRUEBA') {
        router.navigate({ pathname: '/patient/agenda', params: { tab: 'tomas' } });
      }
    };

    abrir(consumirRespuestaInicialNotificacion());
    return suscribirRespuestaNotificacion(abrir);
  }, [router]);
}
