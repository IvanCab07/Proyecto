import { Redirect } from 'expo-router';

// Los turnos viven dentro de Mi agenda. Esta ruta queda para los links que ya apuntan acá
// (notificaciones, atajos del inicio, asistente).
export default function TurnosRedirect() {
  return <Redirect href={{ pathname: '/patient/agenda', params: { tab: 'turnos' } }} />;
}
