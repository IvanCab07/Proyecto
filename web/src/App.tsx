import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingScreen } from './components/LoadingScreen';
import { homePath } from './lib/nav';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyOTP from './pages/auth/VerifyOTP';

import AdminDashboard from './pages/admin/Dashboard';
import AdminMedicos from './pages/admin/Medicos';
import AdminEspecialidades from './pages/admin/Especialidades';
import AdminUsuarios from './pages/admin/Usuarios';
import AdminCalificaciones from './pages/admin/Calificaciones';
import AdminReportes from './pages/admin/Reportes';
import AdminAjustes from './pages/admin/Ajustes';

import MedicoInicio from './pages/medico/Inicio';
import MedicoAgenda from './pages/medico/Agenda';
import MedicoPacientes from './pages/medico/Pacientes';
import MedicoRecetas from './pages/medico/Recetas';
import MedicoCalificaciones from './pages/medico/Calificaciones';
import MedicoPerfil from './pages/medico/Perfil';

import PacienteInicio from './pages/paciente/Inicio';
import PacienteTurnos from './pages/paciente/Turnos';
import PacienteSolicitar from './pages/paciente/SolicitarTurno';
import PacienteRecetas from './pages/paciente/Recetas';
import PacienteEstudios from './pages/paciente/Estudios';
import PacienteMapa from './pages/paciente/Mapa';
import PacientePerfil from './pages/paciente/Perfil';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppRouter() {
  const { loadUser, isLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => { loadUser(); }, [loadUser]);

  if (isLoading) return <LoadingScreen />;

  const home = homePath(user?.role);

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={home} replace /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to={home} replace /> : <Register />
      } />

      {/* Flujos de cuenta (accesibles con o sin sesión) */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/verify-email"    element={<VerifyEmail />} />
      <Route path="/verify-otp"      element={<VerifyOTP />} />

      <Route path="/admin/dashboard"      element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/medicos"        element={<ProtectedRoute role="ADMIN"><AdminMedicos /></ProtectedRoute>} />
      <Route path="/admin/especialidades" element={<ProtectedRoute role="ADMIN"><AdminEspecialidades /></ProtectedRoute>} />
      <Route path="/admin/usuarios"       element={<ProtectedRoute role="ADMIN"><AdminUsuarios /></ProtectedRoute>} />
      <Route path="/admin/calificaciones" element={<ProtectedRoute role="ADMIN"><AdminCalificaciones /></ProtectedRoute>} />
      <Route path="/admin/reportes"       element={<ProtectedRoute role="ADMIN"><AdminReportes /></ProtectedRoute>} />
      <Route path="/admin/ajustes"        element={<ProtectedRoute role="ADMIN"><AdminAjustes /></ProtectedRoute>} />

      <Route path="/medico/inicio"        element={<ProtectedRoute role="MEDICO"><MedicoInicio /></ProtectedRoute>} />
      <Route path="/medico/agenda"        element={<ProtectedRoute role="MEDICO"><MedicoAgenda /></ProtectedRoute>} />
      <Route path="/medico/pacientes"     element={<ProtectedRoute role="MEDICO"><MedicoPacientes /></ProtectedRoute>} />
      <Route path="/medico/recetas"       element={<ProtectedRoute role="MEDICO"><MedicoRecetas /></ProtectedRoute>} />
      <Route path="/medico/calificaciones" element={<ProtectedRoute role="MEDICO"><MedicoCalificaciones /></ProtectedRoute>} />
      <Route path="/medico/perfil"        element={<ProtectedRoute role="MEDICO"><MedicoPerfil /></ProtectedRoute>} />

      <Route path="/paciente/inicio"    element={<ProtectedRoute role="PATIENT"><PacienteInicio /></ProtectedRoute>} />
      <Route path="/paciente/turnos"    element={<ProtectedRoute role="PATIENT"><PacienteTurnos /></ProtectedRoute>} />
      <Route path="/paciente/solicitar" element={<ProtectedRoute role="PATIENT"><PacienteSolicitar /></ProtectedRoute>} />
      <Route path="/paciente/recetas"   element={<ProtectedRoute role="PATIENT"><PacienteRecetas /></ProtectedRoute>} />
      <Route path="/paciente/estudios"  element={<ProtectedRoute role="PATIENT"><PacienteEstudios /></ProtectedRoute>} />
      <Route path="/paciente/mapa"      element={<ProtectedRoute role="PATIENT"><PacienteMapa /></ProtectedRoute>} />
      <Route path="/paciente/perfil"    element={<ProtectedRoute role="PATIENT"><PacientePerfil /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  );
}
