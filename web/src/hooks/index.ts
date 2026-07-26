import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  turnosService, medicosService, especialidadesService,
  estudiosService, recetasService, usersService, authService,
  notificationsService, calificacionesService,
} from '../services';
import type {
  CreateTurnoDTO, CreateMedicoDTO, CreateRecetaDTO,
  ActualizarPerfilDTO, CambiarPasswordDTO, Medico,
  CreateUsuarioDTO, UpdateUsuarioDTO, CreateCalificacionDTO,
  PacienteRef,
} from '../services';
import { useAuthStore } from '../store/useAuthStore';

export const useMisTurnos = () =>
  useQuery({ queryKey: ['mis-turnos'], queryFn: turnosService.misTurnos });

export const useAllTurnos = (filters?: { status?: string; fecha?: string }) =>
  useQuery({ queryKey: ['turnos', filters], queryFn: () => turnosService.todos(filters) });

export const useCrearTurno = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTurnoDTO) => turnosService.crear(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mis-turnos'] }),
  });
};

export const useCancelarTurno = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, razonCancelacion }: { id: string; razonCancelacion?: string }) =>
      turnosService.cancelar(id, razonCancelacion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-turnos'] });
      qc.invalidateQueries({ queryKey: ['turnos'] });
    },
  });
};

export const useUpdateTurnoStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notas, diagnostico }: { id: string; status: string; notas?: string; diagnostico?: string }) =>
      turnosService.updateStatus(id, status, notas, diagnostico),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['turnos'] });
      qc.invalidateQueries({ queryKey: ['mi-agenda'] });
      // Cambiar un turno mueve las métricas del panel y dispara avisos al paciente
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useAdminStats = () =>
  useQuery({ queryKey: ['admin-stats'], queryFn: turnosService.stats, staleTime: 60_000 });

export const useMedicos = () =>
  useQuery({ queryKey: ['medicos'], queryFn: medicosService.todos });

export const useMedicosPorEspecialidad = (especialidadId: string) =>
  useQuery({
    queryKey: ['medicos', especialidadId],
    queryFn: () => medicosService.porEspecialidad(especialidadId),
    enabled: !!especialidadId,
  });

export const useDisponibilidad = (medicoId: string, fecha: string) =>
  useQuery({
    queryKey: ['disponibilidad', medicoId, fecha],
    queryFn: () => medicosService.disponibilidad(medicoId, fecha),
    enabled: !!medicoId && !!fecha,
    staleTime: 30_000,
  });

export const useTodosMedicos = () =>
  useQuery({ queryKey: ['medicos-admin'], queryFn: medicosService.todosAdmin });

export const useCrearMedico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicoDTO) => medicosService.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicos-admin'] });
      qc.invalidateQueries({ queryKey: ['medicos'] });
    },
  });
};

export const useActualizarMedico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<Medico, 'nombre' | 'apellido' | 'disponible'>>) =>
      medicosService.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicos-admin'] });
      qc.invalidateQueries({ queryKey: ['medicos'] });
    },
  });
};

export const useEliminarMedico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicosService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicos-admin'] });
      qc.invalidateQueries({ queryKey: ['medicos'] });
    },
  });
};

export const useEspecialidades = () =>
  useQuery({ queryKey: ['especialidades'], queryFn: especialidadesService.todas });

export const useCrearEspecialidad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => especialidadesService.crear(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['especialidades'] }),
  });
};

export const useActualizarEspecialidad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) => especialidadesService.actualizar(id, nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['especialidades'] }),
  });
};

export const useEliminarEspecialidad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => especialidadesService.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['especialidades'] }),
  });
};

export const useMisEstudios = () =>
  useQuery({ queryKey: ['mis-estudios'], queryFn: estudiosService.misEstudios });

export const useSubirEstudio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => estudiosService.subir(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-estudios'] });
      qc.invalidateQueries({ queryKey: ['estudios-paciente'] });
      qc.invalidateQueries({ queryKey: ['historial'] });
    },
  });
};

export const useEliminarEstudio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => estudiosService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-estudios'] });
      qc.invalidateQueries({ queryKey: ['estudios-paciente'] });
      qc.invalidateQueries({ queryKey: ['historial'] });
    },
  });
};

export const useMisRecetas = () =>
  useQuery({ queryKey: ['mis-recetas'], queryFn: recetasService.misRecetas });

// Una receta nueva o borrada afecta a las tres vistas que la listan
const invalidarRecetas = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['historial'] });
  qc.invalidateQueries({ queryKey: ['recetas-medico'] });
  qc.invalidateQueries({ queryKey: ['mis-recetas'] });
};

export const useCrearReceta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecetaDTO) => recetasService.crear(data),
    onSuccess: () => invalidarRecetas(qc),
  });
};

export const useEliminarReceta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recetasService.eliminar(id),
    onSuccess: () => invalidarRecetas(qc),
  });
};

export const usePacientes = () =>
  useQuery({ queryKey: ['pacientes'], queryFn: usersService.todos });

// No hay hook para GET /users/:id/historial: ese endpoint es admin-only (users.routes.ts hace
// `router.use(verifyToken, requireAdmin)`), así que la pantalla del médico no puede usarlo —
// le devolvería 403. El historial que ve el médico se arma con usePacientesDelMedico() y
// useRecetasMedico(), que sí están dentro de su alcance. `usersService.historial` sigue
// existiendo para cuando haya una vista de historial en el panel de admin.

export const useActualizarPerfil = () => {
  const loadUser = useAuthStore(s => s.loadUser);
  return useMutation({
    mutationFn: (data: ActualizarPerfilDTO) => authService.actualizarPerfil(data),
    onSuccess: () => loadUser(),
  });
};

export const useCambiarPassword = () =>
  useMutation({ mutationFn: (data: CambiarPasswordDTO) => authService.cambiarPassword(data) });

// ── Seguridad de cuenta (verificación de email + 2FA) ──
export const useReenviarVerificacion = () =>
  useMutation({ mutationFn: () => authService.resendVerification() });

export const use2FASetup = () =>
  useMutation({ mutationFn: () => authService.twoFactorSetup() });

export const use2FAEnable = () => {
  const loadUser = useAuthStore(s => s.loadUser);
  return useMutation({
    mutationFn: (code: string) => authService.twoFactorEnable(code),
    onSuccess: () => loadUser(),
  });
};

export const use2FADisable = () => {
  const loadUser = useAuthStore(s => s.loadUser);
  return useMutation({
    mutationFn: (code: string) => authService.twoFactorDisable(code),
    onSuccess: () => loadUser(),
  });
};

export const useEstudiosPaciente = (id: string) =>
  useQuery({
    queryKey: ['estudios-paciente', id],
    queryFn: () => estudiosService.porPaciente(id),
    enabled: !!id,
  });

// ── Gestión de cuentas (admin) ──
export const useCuentas = (role?: string) =>
  useQuery({ queryKey: ['cuentas', role ?? 'all'], queryFn: () => usersService.cuentas(role) });

export const useCrearUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUsuarioDTO) => usersService.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuentas'] });
      qc.invalidateQueries({ queryKey: ['medicos-admin'] });
      qc.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });
};

export const useActualizarUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateUsuarioDTO) => usersService.actualizar(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas'] }),
  });
};

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => usersService.resetPassword(id, password),
  });

export const useEliminarUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuentas'] });
      qc.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });
};

// ── Médico ──
export const useMiAgenda = () =>
  useQuery({ queryKey: ['mi-agenda'], queryFn: turnosService.miAgenda });

/**
 * Pacientes del médico, derivados de su agenda: no hay endpoint propio y la lista
 * la necesitan varias pantallas (Mis pacientes, Recetas), así que se calcula una sola vez acá.
 */
export const usePacientesDelMedico = () => {
  const { data: agenda, ...resto } = useMiAgenda();

  const pacientes = useMemo(() => {
    const map = new Map<string, PacienteRef>();
    for (const t of agenda ?? []) {
      if (t.paciente && !map.has(t.paciente.id)) map.set(t.paciente.id, t.paciente);
    }
    return [...map.values()].sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [agenda]);

  return { ...resto, agenda, pacientes };
};

export const useRecetasMedico = () =>
  useQuery({ queryKey: ['recetas-medico'], queryFn: recetasService.delMedico });

export const useMiFichaMedico = () =>
  useQuery({ queryKey: ['mi-ficha-medico'], queryFn: medicosService.miFicha });

export const useActualizarMiDisponibilidad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (disponible: boolean) => medicosService.actualizarMiDisponibilidad(disponible),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-ficha-medico'] }),
  });
};

// ── Calificaciones ──
export const useCrearCalificacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCalificacionDTO) => calificacionesService.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-turnos'] });
      qc.invalidateQueries({ queryKey: ['calificaciones'] });
    },
  });
};

export const useCalificacionesAdmin = () =>
  useQuery({ queryKey: ['calificaciones'], queryFn: calificacionesService.listadoAdmin });

export const useMisCalificacionesMedico = () =>
  useQuery({ queryKey: ['calificaciones-medico'], queryFn: calificacionesService.miMedico });

// ── Notificaciones ──
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: notificationsService.list });

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsService.unreadCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

export const useMarkNotifRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllNotifRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
