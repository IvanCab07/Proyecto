import { Redirect } from 'expo-router';

// Las recetas viven dentro de Mi agenda. Esta ruta queda para los links que ya apuntan acá
// (notificaciones, atajos del inicio, asistente).
export default function RecetasRedirect() {
  return <Redirect href={{ pathname: '/patient/agenda', params: { tab: 'recetas' } }} />;
}
