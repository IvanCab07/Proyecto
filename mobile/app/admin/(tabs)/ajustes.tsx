import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { useActualizarPerfil, useCambiarPassword } from '../../../hooks';
import {
  Card, Avatar, Button, Input, PasswordInput, Sheet, ScreenHeader, confirm, toast,
  IconUser, IconEdit, IconLock, IconLogout,
  IconUsers, IconTag, IconShield, IconChevronRight, IconStar,
} from '../../../components/ui';
import { SeguridadSection } from '../../../components/SeguridadSection';
import { PressableScale } from '../../../lib/motion';
import { colors } from '../../../lib/theme';
import { apiError } from '../../../lib/apiError';

type ActiveModal = 'perfil' | 'password' | null;

export default function AjustesScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const actualizarPerfil = useActualizarPerfil();
  const cambiarPassword = useCambiarPassword();

  const [modal, setModal] = useState<ActiveModal>(null);
  const [perfilForm, setPerfilForm] = useState({ nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', telefono: user?.telefono ?? '' });
  const [pwdForm, setPwdForm] = useState({ passwordActual: '', passwordNueva: '', confirm: '' });

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Cerrar sesión', message: '¿Querés salir de tu cuenta?', confirmText: 'Salir', destructive: true });
    if (ok) { await logout(); router.replace('/auth/login'); }
  };

  const openPerfil = () => { setPerfilForm({ nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', telefono: user?.telefono ?? '' }); setModal('perfil'); };

  const handleGuardarPerfil = async () => {
    if (!perfilForm.nombre.trim() || !perfilForm.apellido.trim()) return toast.error('Nombre y apellido son obligatorios');
    try {
      await actualizarPerfil.mutateAsync({ nombre: perfilForm.nombre.trim(), apellido: perfilForm.apellido.trim(), telefono: perfilForm.telefono.trim() || undefined });
      setModal(null); toast.success('Datos actualizados');
    } catch (err) { toast.error(apiError(err, 'No se pudo actualizar')); }
  };

  const handleCambiarPassword = async () => {
    if (!pwdForm.passwordActual || !pwdForm.passwordNueva) return toast.error('Completá todos los campos');
    if (pwdForm.passwordNueva.length < 6) return toast.error('La nueva contraseña debe tener al menos 6 caracteres');
    if (pwdForm.passwordNueva !== pwdForm.confirm) return toast.error('Las contraseñas no coinciden');
    try {
      await cambiarPassword.mutateAsync({ passwordActual: pwdForm.passwordActual, passwordNueva: pwdForm.passwordNueva });
      setModal(null); setPwdForm({ passwordActual: '', passwordNueva: '', confirm: '' });
      toast.success('Contraseña actualizada');
    } catch (err) { toast.error(apiError(err, 'No se pudo cambiar la contraseña')); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <ScreenHeader eyebrow="Cuenta" title="Ajustes" pb={48} />

        <View className="px-4" style={{ marginTop: -28 }}>
          <Card className="p-5 items-center">
            <Avatar nombre={user?.nombre} apellido={user?.apellido} size={80} />
            <Text className="text-xl font-bold text-slate-900 mt-3" style={{ letterSpacing: -0.4 }}>{user?.nombre} {user?.apellido}</Text>
            <Text className="text-slate-400 text-sm mt-0.5">{user?.email}</Text>
            <View className="bg-brand-50 px-3.5 py-1 rounded-pill mt-2.5"><Text className="text-brand-700 text-[11px] font-bold uppercase tracking-widest">Administrador</Text></View>
            <View className="flex-row gap-3 mt-4 w-full">
              <View className="flex-1"><Button variant="secondary" fullWidth size="sm" iconLeft={<IconEdit size={15} color={colors.brand[600]} />} onPress={openPerfil}>Editar datos</Button></View>
              <View className="flex-1"><Button variant="secondary" fullWidth size="sm" iconLeft={<IconLock size={15} color={colors.slate[600]} />} onPress={() => setModal('password')}>Contraseña</Button></View>
            </View>
          </Card>
        </View>

        <View className="px-4 mt-3.5">
          <Card className="p-5">
            <SectionHead icon={<IconUser size={15} color={colors.brand[600]} />} title="Información de la cuenta" />
            <DataRow label="DNI" value={user?.dni || '—'} />
            <DataRow label="Teléfono" value={user?.telefono || 'No registrado'} />
            <DataRow label="Rol" value="Administrador" last />
          </Card>
        </View>

        <View className="px-4 mt-3.5">
          <SeguridadSection />
        </View>

        <View className="px-4 mt-3.5">
          <Card className="p-5">
            <SectionHead icon={<IconShield size={15} color={colors.brand[600]} />} title="Gestión" />
            <NavRow icon={<IconUsers size={16} color={colors.brand[600]} />} label="Usuarios y cuentas" desc="Crear, editar y dar de baja" onPress={() => router.push('/admin/usuarios')} />
            <NavRow icon={<IconTag size={16} color={colors.brand[600]} />} label="Especialidades" desc="Catálogo médico" onPress={() => router.push('/admin/especialidades')} />
            <NavRow icon={<IconStar size={16} color={colors.brand[600]} />} label="Calificaciones" desc="Reseñas y promedio por médico" onPress={() => router.push('/admin/calificaciones')} last />
          </Card>
        </View>

        <View className="px-4 mt-4">
          <PressableScale onPress={handleLogout} haptic="warning" className="flex-row items-center justify-center gap-2 rounded-card py-4 bg-danger-soft border border-danger/20">
            <IconLogout size={16} color={colors.danger.text} />
            <Text className="font-bold text-[15px]" style={{ color: colors.danger.text }}>Cerrar sesión</Text>
          </PressableScale>
        </View>
      </ScrollView>

      <Sheet visible={modal === 'perfil'} onClose={() => setModal(null)} title="Editar datos">
        <Input label="Nombre" value={perfilForm.nombre} onChangeText={(v) => setPerfilForm(f => ({ ...f, nombre: v }))} placeholder="Tu nombre" className="mb-3" />
        <Input label="Apellido" value={perfilForm.apellido} onChangeText={(v) => setPerfilForm(f => ({ ...f, apellido: v }))} placeholder="Tu apellido" className="mb-3" />
        <Input label="Teléfono" value={perfilForm.telefono} onChangeText={(v) => setPerfilForm(f => ({ ...f, telefono: v }))} placeholder="11 1234-5678" keyboardType="phone-pad" className="mb-4" />
        <Button fullWidth loading={actualizarPerfil.isPending} onPress={handleGuardarPerfil}>Guardar cambios</Button>
      </Sheet>

      <Sheet visible={modal === 'password'} onClose={() => setModal(null)} title="Cambiar contraseña">
        <PasswordInput label="Contraseña actual" value={pwdForm.passwordActual} onChangeText={(v) => setPwdForm(f => ({ ...f, passwordActual: v }))} placeholder="••••••••" className="mb-3" />
        <PasswordInput label="Nueva contraseña" value={pwdForm.passwordNueva} onChangeText={(v) => setPwdForm(f => ({ ...f, passwordNueva: v }))} placeholder="••••••••" className="mb-3" />
        <PasswordInput label="Confirmar nueva contraseña" value={pwdForm.confirm} onChangeText={(v) => setPwdForm(f => ({ ...f, confirm: v }))} placeholder="••••••••" className="mb-4" />
        <Button fullWidth loading={cambiarPassword.isPending} onPress={handleCambiarPassword}>Cambiar contraseña</Button>
      </Sheet>
    </View>
  );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <View className="w-8 h-8 rounded-lg bg-brand-50 items-center justify-center">{icon}</View>
      <Text className="text-[15px] font-bold text-slate-900">{title}</Text>
    </View>
  );
}

function DataRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between py-3 ${last ? '' : 'border-b border-slate-100'}`}>
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-semibold">{value}</Text>
    </View>
  );
}

function NavRow({ icon, label, desc, onPress, last }: { icon: React.ReactNode; label: string; desc: string; onPress: () => void; last?: boolean }) {
  return (
    <PressableScale onPress={onPress} haptic="select" className={`flex-row items-center gap-3 py-3 ${last ? '' : 'border-b border-slate-100'}`}>
      <View className="w-9 h-9 rounded-lg bg-brand-50 items-center justify-center">{icon}</View>
      <View className="flex-1">
        <Text className="text-slate-900 text-sm font-semibold">{label}</Text>
        <Text className="text-slate-400 text-[12px]">{desc}</Text>
      </View>
      <IconChevronRight size={16} color={colors.slate[300]} />
    </PressableScale>
  );
}
