import { api } from './api';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  /** Ruta relativa de la foto de perfil ("/uploads/avatar-x.jpg"). null = mostrar iniciales. */
  fotoUrl?: string | null;
  role: 'PATIENT' | 'ADMIN' | 'MEDICO';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  puedeCalificar?: boolean;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO extends LoginDTO {
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
}

export interface ActualizarPerfilDTO {
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

export interface CambiarPasswordDTO {
  passwordActual: string;
  passwordNueva: string;
}

export interface Especialidad {
  id: string;
  nombre: string;
  _count?: { medicos: number };
}

export interface AuthResponse {
  user: User;
  token: string;
}

// El login puede pedir un 2do paso si la cuenta tiene 2FA activo
export interface TwoFactorChallenge { twoFactorRequired: true; challenge: string; }
export type LoginResult = AuthResponse | TwoFactorChallenge;
export interface TwoFactorSetup { secret: string; otpauthUrl: string; qr: string; }

export type TurnoStatus = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO' | 'EN_ESPERA' | 'AUSENTE';

export interface Turno {
  id: string;
  fecha: string;
  hora: string;
  motivo?: string;
  status: TurnoStatus;
  esSobreturno?: boolean;
  medico: {
    id: string;
    nombre: string;
    apellido: string;
    especialidad: { id: string; nombre: string };
  };
  paciente?: Pick<User, 'id' | 'nombre' | 'apellido' | 'dni'>;
  calificacion?: Calificacion | null;
  notas?: string;
  razonCancelacion?: string;
  diagnostico?: string;
}

export interface CreateTurnoDTO {
  medicoId: string;
  fecha: string;
  hora: string;
  motivo?: string;
  esSobreturno?: boolean;
}

export interface Calificacion {
  id: string;
  turnoId: string;
  pacienteId: string;
  medicoId: string;
  estrellas: number;
  comentario?: string | null;
  createdAt: string;
}

export interface CreateCalificacionDTO {
  turnoId: string;
  estrellas: number;
  comentario?: string;
}

export interface CalificacionDetalle extends Calificacion {
  paciente?: { id: string; nombre: string; apellido: string; dni: string };
  medico?: { id: string; nombre: string; apellido: string; especialidad: { nombre: string } };
  turno?: { id: string; fecha: string; hora: string };
}

export interface PromedioMedico {
  medicoId: string;
  nombre: string;
  especialidad: string;
  promedio: number;
  cantidad: number;
}

export interface CalificacionesAdmin {
  calificaciones: CalificacionDetalle[];
  promediosPorMedico: PromedioMedico[];
}

/**
 * Lo que devuelve GET /calificaciones/medico. El backend ya mandaba `distribucion`,
 * `atendidos` y `tasaRespuesta` desde siempre; el tipo de acá no los declaraba y la app
 * los estaba descartando.
 */
export interface CalificacionesMedico {
  calificaciones: CalificacionDetalle[];
  promedio: number;
  cantidad: number;
  /** Cuántas reseñas hay de cada puntaje. Los 5 tramos vienen siempre, con 0 si no hubo. */
  distribucion: Record<1 | 2 | 3 | 4 | 5, number>;
  /** Turnos COMPLETADOS: la base sobre la que se calcula tasaRespuesta. */
  atendidos: number;
  /** Porcentaje entero (0-100) de turnos atendidos que dejaron reseña. */
  tasaRespuesta: number;
}

export interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  matricula: string;
  disponible: boolean;
  especialidad: { id: string; nombre: string };
}

export interface CreateMedicoDTO {
  nombre: string;
  apellido: string;
  matricula: string;
  especialidadId: string;
}

export interface Estudio {
  id: string;
  pacienteId: string;
  /** Quién lo subió. El médico solo puede borrar los que subió él (lo valida el backend). */
  subidoPorId?: string | null;
  titulo: string;
  descripcion?: string;
  archivoUrl: string;
  tipoArchivo: string;
  fecha: string;
}

export interface Receta {
  id: string;
  medicamento: string;
  dosis: string;
  indicacion: string;
  fechaEmision: string;
  // Toda receta vence: la columna es NOT NULL y el backend completa 30 días si el emisor no
  // manda la fecha. Era opcional acá por arrastre de antes de esa migración.
  validoHasta: string;
  medico: {
    nombre: string;
    apellido: string;
    especialidad: { nombre: string };
  };
  paciente?: Pick<User, 'id' | 'nombre' | 'apellido' | 'dni'>;
}

export interface CreateRecetaDTO {
  pacienteId: string;
  medicoId?: string;
  medicamento: string;
  dosis: string;
  indicacion: string;
  validoHasta?: string;
}

export interface Historial {
  user: User;
  turnos: Turno[];
  recetas: Receta[];
  estudios: Estudio[];
}

// Cuenta de usuario para la gestión del admin (incluye activo y la ficha de médico si aplica)
export interface Cuenta {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  fotoUrl?: string | null;
  role: 'PATIENT' | 'ADMIN' | 'MEDICO';
  activo: boolean;
  createdAt: string;
  puedeCalificar: boolean;
  medico?: { id: string; matricula: string; especialidad: { id: string; nombre: string } } | null;
}

export interface CreateUsuarioDTO {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  role: 'PATIENT' | 'ADMIN' | 'MEDICO';
  matricula?: string;
  especialidadId?: string;
}

export interface UpdateUsuarioDTO {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  role?: 'PATIENT' | 'ADMIN' | 'MEDICO';
  activo?: boolean;
  puedeCalificar?: boolean;
}

export interface TrendPoint { fecha?: string; mes?: string; label: string; total: number; }

export interface AdminStats {
  turnos: {
    total: number;
    pendientes: number;
    confirmados: number;
    completados: number;
    cancelados: number;
    ausentes: number;
    hoy: number;
    mes: number;
  };
  tendencia: { dias: TrendPoint[]; meses: TrendPoint[] };
  usuarios: { pacientes: number };
  medicos: { disponibles: number };
  topMedicos: { nombre: string; especialidad: string; total: number }[];
  porEspecialidad: { nombre: string; medicos: number; turnos: number }[];
}

export const authService = {
  login: async (data: LoginDTO): Promise<LoginResult> => {
    const res = await api.post<LoginResult>('/auth/login', data);
    if ('token' in res.data) await SecureStore.setItemAsync('auth_token', res.data.token);
    return res.data;
  },

  register: async (data: RegisterDTO): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    await SecureStore.setItemAsync('auth_token', res.data.token);
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  actualizarPerfil: async (data: ActualizarPerfilDTO): Promise<User> => {
    const res = await api.patch<User>('/auth/perfil', data);
    return res.data;
  },

  cambiarPassword: async (data: CambiarPasswordDTO): Promise<{ message: string }> => {
    const res = await api.patch<{ message: string }>('/auth/cambiar-password', data);
    return res.data;
  },

  // ── Foto de perfil ──
  // Los dos devuelven el usuario completo, así que alcanza con pisar el del store.
  // El FormData lleva la imagen bajo el campo "foto" (lo exige uploadImagen.middleware).
  subirFoto: (formData: FormData) =>
    api.post<User>('/auth/perfil/foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  eliminarFoto: () =>
    api.delete<User>('/auth/perfil/foto').then(r => r.data),

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
  },

  // ── Verificación de email ──
  resendVerification: () =>
    api.post<{ message: string }>('/auth/resend-verification').then(r => r.data),

  // ── Recuperación de contraseña ──
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }).then(r => r.data),

  // ── 2FA (TOTP) ──
  twoFactorSetup: () =>
    api.post<TwoFactorSetup>('/auth/2fa/setup').then(r => r.data),
  twoFactorEnable: (code: string) =>
    api.post<{ message: string }>('/auth/2fa/enable', { code }).then(r => r.data),
  twoFactorDisable: (code: string) =>
    api.post<{ message: string }>('/auth/2fa/disable', { code }).then(r => r.data),
  twoFactorLogin: async (challenge: string, code: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/2fa/login', { challenge, code });
    await SecureStore.setItemAsync('auth_token', res.data.token);
    return res.data;
  },
};

export const turnosService = {
  crear: (data: CreateTurnoDTO) =>
    api.post<Turno>('/turnos', data).then(r => r.data),

  misTurnos: () =>
    api.get<Turno[]>('/turnos/mis-turnos').then(r => r.data),

  todos: (params?: { status?: string; fecha?: string }) =>
    api.get<Turno[]>('/turnos', { params }).then(r => r.data),

  updateStatus: (id: string, status: string, notas?: string, diagnostico?: string) =>
    api.patch<Turno>(`/turnos/${id}/status`, { status, notas, diagnostico }).then(r => r.data),

  cancelar: (id: string, razonCancelacion?: string) =>
    api.delete(`/turnos/${id}`, { data: { razonCancelacion } }),

  stats: () =>
    api.get<AdminStats>('/turnos/stats').then(r => r.data),

  // Agenda del médico logueado (sus turnos asignados)
  miAgenda: () =>
    api.get<Turno[]>('/turnos/medico').then(r => r.data),
};

export const medicosService = {
  todos: () =>
    api.get<Medico[]>('/medicos').then(r => r.data),

  porEspecialidad: (id: string) =>
    api.get<Medico[]>(`/medicos/especialidad/${id}`).then(r => r.data),

  todosAdmin: () =>
    api.get<Medico[]>('/medicos/all').then(r => r.data),

  disponibilidad: (medicoId: string, fecha: string) =>
    api.get<{ horasOcupadas: string[]; sobreturnos?: Record<string, number> }>(`/medicos/${medicoId}/disponibilidad`, { params: { fecha } }).then(r => r.data),

  crear: (data: CreateMedicoDTO) =>
    api.post<Medico>('/medicos', data).then(r => r.data),

  actualizar: (id: string, data: Partial<Pick<Medico, 'nombre' | 'apellido' | 'disponible'>>) =>
    api.patch<Medico>(`/medicos/${id}`, data).then(r => r.data),

  eliminar: (id: string) =>
    api.delete(`/medicos/${id}`),

  // Médico: su propia ficha y disponibilidad
  miFicha: () =>
    api.get<Medico>('/medicos/mi-ficha').then(r => r.data),

  actualizarMiDisponibilidad: (disponible: boolean) =>
    api.patch<Medico>('/medicos/mi-disponibilidad', { disponible }).then(r => r.data),
};

export const estudiosService = {
  misEstudios: () =>
    api.get<Estudio[]>('/estudios/mis-estudios').then(r => r.data),

  subir: (formData: FormData) =>
    api.post<Estudio>('/estudios/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  porPaciente: (pacienteId: string) =>
    api.get<Estudio[]>(`/estudios/paciente/${pacienteId}`).then(r => r.data),

  eliminar: (id: string) =>
    api.delete<{ message: string }>(`/estudios/${id}`).then(r => r.data),
};

export const recetasService = {
  misRecetas: () =>
    api.get<Receta[]>('/recetas/mis-recetas').then(r => r.data),

  crear: (data: CreateRecetaDTO) =>
    api.post<Receta>('/recetas', data).then(r => r.data),

  // Recetas emitidas por el médico logueado
  delMedico: () =>
    api.get<Receta[]>('/recetas/medico').then(r => r.data),

  // El backend solo deja borrar las que emitió el propio médico (el admin, cualquiera)
  eliminar: (id: string) =>
    api.delete<{ message: string }>(`/recetas/${id}`).then(r => r.data),
};

export const usersService = {
  todos: () =>
    api.get<User[]>('/users').then(r => r.data),

  historial: (id: string) =>
    api.get<Historial>(`/users/${id}/historial`).then(r => r.data),

  // Gestión de cuentas (admin)
  cuentas: (role?: string) =>
    api.get<Cuenta[]>('/users/todos', { params: role ? { role } : {} }).then(r => r.data),

  crear: (data: CreateUsuarioDTO) =>
    api.post<Cuenta>('/users', data).then(r => r.data),

  actualizar: (id: string, data: UpdateUsuarioDTO) =>
    api.patch<Cuenta>(`/users/${id}`, data).then(r => r.data),

  resetPassword: (id: string, password: string) =>
    api.post<{ message: string }>(`/users/${id}/reset-password`, { password }).then(r => r.data),

  eliminar: (id: string) =>
    api.delete(`/users/${id}`),
};

export const calificacionesService = {
  crear: (data: CreateCalificacionDTO) =>
    api.post<Calificacion>('/calificaciones', data).then(r => r.data),
  listadoAdmin: () =>
    api.get<CalificacionesAdmin>('/calificaciones').then(r => r.data),
  miMedico: () =>
    api.get<CalificacionesMedico>('/calificaciones/medico').then(r => r.data),
};

export const especialidadesService = {
  todas: () =>
    api.get<Especialidad[]>('/especialidades').then(r => r.data),

  crear: (nombre: string) =>
    api.post<Especialidad>('/especialidades', { nombre }).then(r => r.data),

  actualizar: (id: string, nombre: string) =>
    api.patch<Especialidad>(`/especialidades/${id}`, { nombre }).then(r => r.data),

  eliminar: (id: string) =>
    api.delete(`/especialidades/${id}`),
};

export type NotificationType =
  | 'TURNO_SOLICITADO' | 'TURNO_CONFIRMADO' | 'TURNO_CANCELADO' | 'TURNO_COMPLETADO' | 'RECETA_NUEVA'
  | 'SOBRETURNO_SOLICITADO' | 'SOBRETURNO_ASIGNADO';

export interface Notification {
  id: string;
  type: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  data?: { turnoId?: string; recetaId?: string; link?: string } | null;
  createdAt: string;
}

export const notificationsService = {
  list: () =>
    api.get<Notification[]>('/notifications').then(r => r.data),
  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then(r => r.data.count),
  markRead: (id: string) =>
    api.patch<{ message: string }>(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    api.patch<{ message: string }>('/notifications/read-all').then(r => r.data),
};
