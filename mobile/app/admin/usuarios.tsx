import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  useCuentas, useEspecialidades, useCrearUsuario, useActualizarUsuario, useResetPassword, useEliminarUsuario,
} from '../../hooks';
import { useAuthStore } from '../../hooks/useAuthStore';
import {
  Card, Button, Input, PasswordInput, Chip, Avatar, Sheet, ScreenHeader, SegmentedTabs, EmptyState,
  Skeleton, confirm, actionSheet, toast,
  IconUserPlus, IconUsers, IconSearch, IconKey, IconMore,
} from '../../components/ui';
import { PressableScale, stagger } from '../../lib/motion';
import { colors } from '../../lib/theme';
import { apiError } from '../../lib/apiError';
import type { Cuenta } from '../../services';

type RoleFilter = 'TODOS' | 'PATIENT' | 'MEDICO' | 'ADMIN';
type Role = 'PATIENT' | 'MEDICO' | 'ADMIN';
const ROLE_LABEL: Record<string, string> = { PATIENT: 'Paciente', MEDICO: 'Médico', ADMIN: 'Admin' };
const ROLE_BADGE: Record<string, string> = {
  PATIENT: 'bg-slate-100 text-slate-600',
  MEDICO: 'bg-brand-50 text-brand-700',
  ADMIN: 'bg-rail text-white',
};

const EMPTY_FORM = {
  email: '', password: '', nombre: '', apellido: '', dni: '', telefono: '',
  role: 'PATIENT' as Role, matricula: '', especialidadId: '',
};

export default function UsuariosScreen() {
  const router = useRouter();
  const yo = useAuthStore(s => s.user);

  const [tab, setTab] = useState<RoleFilter>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editando, setEditando] = useState<Cuenta | null>(null);
  const [resetTarget, setResetTarget] = useState<Cuenta | null>(null);
  const [nuevaPass, setNuevaPass] = useState('');

  const role = tab === 'TODOS' ? undefined : tab;
  const { data: cuentas, isLoading, isRefetching, refetch } = useCuentas(role);
  const { data: especialidades } = useEspecialidades();
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();
  const reset = useResetPassword();
  const eliminar = useEliminarUsuario();

  const filtradas = useMemo(
    () => (cuentas ?? []).filter(c =>
      `${c.nombre} ${c.apellido} ${c.email} ${c.dni}`.toLowerCase().includes(busqueda.toLowerCase())),
    [cuentas, busqueda],
  );

  const openCrear = () => { setForm(EMPTY_FORM); setModal('crear'); };
  const openEditar = (c: Cuenta) => {
    setEditando(c);
    setForm({ ...EMPTY_FORM, nombre: c.nombre, apellido: c.apellido, telefono: c.telefono ?? '', role: c.role });
    setModal('editar');
  };

  const handleGuardar = async () => {
    if (modal === 'crear') {
      if (!form.email || !form.password || !form.nombre || !form.apellido || !form.dni) {
        return toast.error('Completá email, contraseña, nombre, apellido y DNI');
      }
      if (form.role === 'MEDICO' && (!form.matricula || !form.especialidadId)) {
        return toast.error('Un médico necesita matrícula y especialidad');
      }
    } else if (!form.nombre || !form.apellido) {
      return toast.error('Nombre y apellido son obligatorios');
    }
    try {
      if (modal === 'crear') {
        await crear.mutateAsync({
          email: form.email, password: form.password, nombre: form.nombre, apellido: form.apellido,
          dni: form.dni, telefono: form.telefono || undefined, role: form.role,
          ...(form.role === 'MEDICO' ? { matricula: form.matricula, especialidadId: form.especialidadId } : {}),
        });
        toast.success('Cuenta creada');
      } else if (editando) {
        await actualizar.mutateAsync({
          id: editando.id, nombre: form.nombre, apellido: form.apellido,
          telefono: form.telefono || undefined, role: form.role,
        });
        toast.success('Cuenta actualizada');
      }
      setModal(null);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo guardar'));
    }
  };

  const handleToggleActivo = async (c: Cuenta) => {
    try {
      await actualizar.mutateAsync({ id: c.id, activo: !c.activo });
      toast.success(c.activo ? 'Cuenta desactivada' : 'Cuenta activada');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo cambiar el estado'));
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    if (nuevaPass.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    try {
      await reset.mutateAsync({ id: resetTarget.id, password: nuevaPass });
      toast.success(`Contraseña de ${resetTarget.nombre} actualizada`);
      setResetTarget(null); setNuevaPass('');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo resetear la contraseña'));
    }
  };

  const handleEliminar = async (c: Cuenta) => {
    const ok = await confirm({
      title: 'Eliminar cuenta',
      message: `¿Eliminar la cuenta de ${c.nombre} ${c.apellido}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar', destructive: true,
    });
    if (!ok) return;
    try { await eliminar.mutateAsync(c.id); toast.success('Cuenta eliminada'); }
    catch (e) { toast.error(apiError(e, 'No se pudo eliminar')); }
  };

  const openAcciones = (c: Cuenta) => {
    const esYo = c.id === yo?.id;
    actionSheet({
      title: `${c.nombre} ${c.apellido}`,
      message: ROLE_LABEL[c.role],
      options: [
        { label: 'Editar', onPress: () => openEditar(c) },
        { label: 'Resetear contraseña', onPress: () => { setResetTarget(c); setNuevaPass(''); } },
        ...(esYo ? [] : [{ label: c.activo ? 'Desactivar cuenta' : 'Activar cuenta', onPress: () => handleToggleActivo(c) }]),
        ...(esYo ? [] : [{ label: 'Eliminar cuenta', onPress: () => handleEliminar(c), destructive: true }]),
      ],
    });
  };

  const count = filtradas.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader eyebrow="Gestión" title="Usuarios" subtitle="Cuentas de pacientes, médicos y admins" onBack={() => router.back()} />

      <View className="px-4 pt-4 gap-3">
        <Button fullWidth iconLeft={<IconUserPlus size={16} color="#fff" />} onPress={openCrear}>Nuevo usuario</Button>
        <SegmentedTabs
          value={tab}
          onChange={(k) => setTab(k as RoleFilter)}
          tabs={[
            { key: 'TODOS', label: 'Todos' },
            { key: 'PATIENT', label: 'Pacientes' },
            { key: 'MEDICO', label: 'Médicos' },
            { key: 'ADMIN', label: 'Admins' },
          ]}
        />
        <Input
          iconLeft={<IconSearch size={16} color={colors.slate[400]} />}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre, email o DNI…"
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View className="p-4 gap-2.5">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[88px] rounded-card" />)}</View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand[500]} />}
          ListEmptyComponent={
            <EmptyState
              className="pt-12"
              icon={<IconUsers size={28} color={colors.brand[500]} />}
              title={busqueda ? 'Sin resultados' : 'Sin cuentas'}
              message={busqueda ? `Ninguna cuenta coincide con "${busqueda}".` : 'Creá la primera cuenta con "Nuevo usuario".'}
            />
          }
          ListHeaderComponent={count > 0 ? <Text className="text-[12px] text-slate-400 font-medium mb-1 px-1">{count} cuenta{count !== 1 ? 's' : ''}</Text> : null}
          renderItem={({ item, index }) => (
            <Animated.View entering={stagger(index)}>
              <Card className="p-3.5 flex-row items-center">
                <Avatar nombre={item.nombre} apellido={item.apellido} size={44} />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[15px] font-bold text-slate-900 flex-shrink" style={{ letterSpacing: -0.3 }} numberOfLines={1}>{item.nombre} {item.apellido}</Text>
                    <View className={`px-2 py-0.5 rounded-pill ${ROLE_BADGE[item.role].split(' ')[0]}`}>
                      <Text className={`text-[10px] font-bold ${ROLE_BADGE[item.role].split(' ')[1]}`}>{ROLE_LABEL[item.role]}</Text>
                    </View>
                  </View>
                  <Text className="text-[12px] text-slate-500 mt-0.5" numberOfLines={1}>{item.email}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-[11px] text-slate-400">DNI {item.dni}</Text>
                    <View className="flex-row items-center gap-1">
                      <View className={`w-1.5 h-1.5 rounded-full ${item.activo ? 'bg-success' : 'bg-slate-300'}`} />
                      <Text className={`text-[11px] font-semibold ${item.activo ? 'text-success' : 'text-slate-400'}`}>{item.activo ? 'Activa' : 'Inactiva'}</Text>
                    </View>
                    {item.medico ? <Text className="text-[11px] text-slate-400">· Mat. {item.medico.matricula}</Text> : null}
                  </View>
                </View>
                <PressableScale onPress={() => openAcciones(item)} haptic="select" className="w-9 h-9 rounded-lg bg-slate-100 items-center justify-center">
                  <IconMore size={16} color={colors.slate[600]} />
                </PressableScale>
              </Card>
            </Animated.View>
          )}
        />
      )}

      {/* Crear / Editar */}
      <Sheet visible={!!modal} onClose={() => setModal(null)} title={modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}>
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1"><Input label="Nombre" value={form.nombre} onChangeText={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Nombre" /></View>
          <View className="flex-1"><Input label="Apellido" value={form.apellido} onChangeText={v => setForm(f => ({ ...f, apellido: v }))} placeholder="Apellido" /></View>
        </View>
        {modal === 'crear' && (
          <>
            <Input label="Email" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" className="mb-3" />
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1"><Input label="DNI" value={form.dni} onChangeText={v => setForm(f => ({ ...f, dni: v }))} placeholder="12345678" keyboardType="numeric" /></View>
              <View className="flex-1"><PasswordInput label="Contraseña" value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder="Mínimo 6" /></View>
            </View>
          </>
        )}
        <Input label="Teléfono" value={form.telefono} onChangeText={v => setForm(f => ({ ...f, telefono: v }))} placeholder="Opcional" keyboardType="phone-pad" className="mb-3" />

        <Text className="text-[13px] font-semibold text-slate-700 mb-2">Rol</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {(['PATIENT', 'MEDICO', 'ADMIN'] as Role[]).map(r => (
            <Chip key={r} label={ROLE_LABEL[r]} active={form.role === r} onPress={() => setForm(f => ({ ...f, role: r }))} />
          ))}
        </View>

        {modal === 'crear' && form.role === 'MEDICO' && (
          <>
            <Input label="Matrícula" value={form.matricula} onChangeText={v => setForm(f => ({ ...f, matricula: v }))} placeholder="Ej: MN 12345" className="mb-3" />
            <Text className="text-[13px] font-semibold text-slate-700 mb-2">Especialidad</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {especialidades?.map(e => (
                <Chip key={e.id} label={e.nombre} active={form.especialidadId === e.id} onPress={() => setForm(f => ({ ...f, especialidadId: e.id }))} />
              ))}
            </View>
          </>
        )}
        {modal === 'editar' && editando?.role === 'MEDICO' ? (
          <Text className="text-[12px] text-slate-400 mb-3">Esta cuenta tiene una ficha de médico vinculada.</Text>
        ) : null}

        <Button fullWidth loading={crear.isPending || actualizar.isPending} onPress={handleGuardar}>
          {modal === 'crear' ? 'Crear cuenta' : 'Guardar cambios'}
        </Button>
      </Sheet>

      {/* Resetear contraseña */}
      <Sheet visible={!!resetTarget} onClose={() => setResetTarget(null)} title="Resetear contraseña">
        <Text className="text-[13px] text-slate-500 mb-3">
          Nueva contraseña para {resetTarget?.nombre} {resetTarget?.apellido}.
        </Text>
        <PasswordInput label="Nueva contraseña" value={nuevaPass} onChangeText={setNuevaPass} placeholder="Mínimo 6 caracteres" className="mb-4" />
        <Button fullWidth loading={reset.isPending} onPress={handleReset} iconLeft={<IconKey size={16} color="#fff" />}>Guardar contraseña</Button>
      </Sheet>
    </View>
  );
}
