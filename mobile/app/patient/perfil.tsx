import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useActualizarPerfil, useCambiarPassword } from '../../hooks';
import {
  Card, Avatar, Button, Input, PasswordInput, Sheet, ScreenHeader, confirm, toast, DataRow,
  IconEdit, IconLock, IconLogout, IconUser,
} from '../../components/ui';
import { SeguridadSection } from '../../components/SeguridadSection';
import { FotoPerfilPicker } from '../../components/FotoPerfilPicker';
import { PressableScale } from '../../lib/motion';
import { useTheme } from '../../lib/useTheme';
import { apiError } from '../../lib/apiError';

type ActiveModal = 'perfil' | 'password' | null;

export default function PerfilScreen() {
  const { colors } = useTheme();
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

  const openPerfil = () => {
    setPerfilForm({ nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', telefono: user?.telefono ?? '' });
    setModal('perfil');
  };

  const handleGuardarPerfil = async () => {
    if (!perfilForm.nombre.trim() || !perfilForm.apellido.trim()) return toast.error('Nombre y apellido son obligatorios');
    try {
      await actualizarPerfil.mutateAsync({ nombre: perfilForm.nombre.trim(), apellido: perfilForm.apellido.trim(), telefono: perfilForm.telefono.trim() || undefined });
      setModal(null);
      toast.success('Datos actualizados');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo actualizar'));
    }
  };

  const handleCambiarPassword = async () => {
    if (!pwdForm.passwordActual || !pwdForm.passwordNueva) return toast.error('Completá todos los campos');
    if (pwdForm.passwordNueva.length < 6) return toast.error('La nueva contraseña debe tener al menos 6 caracteres');
    if (pwdForm.passwordNueva !== pwdForm.confirm) return toast.error('Las contraseñas nuevas no coinciden');
    try {
      await cambiarPassword.mutateAsync({ passwordActual: pwdForm.passwordActual, passwordNueva: pwdForm.passwordNueva });
      setModal(null);
      setPwdForm({ passwordActual: '', passwordNueva: '', confirm: '' });
      toast.success('Contraseña actualizada');
    } catch (err) {
      toast.error(apiError(err, 'No se pudo cambiar la contraseña'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <ScreenHeader eyebrow="Mi perfil" title="Datos de tu cuenta" onBack={() => router.back()} />

        {/* Avatar card */}
        <View className="px-4 pt-1">
          <Card className="p-5 items-center">
            <FotoPerfilPicker size={80} />
            <Text className="text-xl font-bold text-slate-900 mt-3" style={{ letterSpacing: -0.4 }}>{user?.nombre} {user?.apellido}</Text>
            <Text className="text-slate-400 text-sm mt-0.5">{user?.email}</Text>
            <View className="bg-brand-50 px-3.5 py-1 rounded-pill mt-2.5">
              <Text className="text-brand-700 text-[11px] font-bold uppercase tracking-widest">Paciente</Text>
            </View>
            <View className="flex-row gap-3 mt-4 w-full">
              <View className="flex-1"><Button variant="secondary" fullWidth size="sm" iconLeft={<IconEdit size={15} color={colors.brand[600]} />} onPress={openPerfil}>Editar datos</Button></View>
              <View className="flex-1"><Button variant="secondary" fullWidth size="sm" iconLeft={<IconLock size={15} color={colors.slate[600]} />} onPress={() => setModal('password')}>Contraseña</Button></View>
            </View>
          </Card>
        </View>

        {/* Datos personales */}
        <View className="px-4 mt-3.5">
          <Card className="p-5">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-lg bg-brand-50 items-center justify-center"><IconUser size={15} color={colors.brand[600]} /></View>
              <Text className="text-[15px] font-bold text-slate-900">Datos personales</Text>
            </View>
            <DataRow label="DNI" value={user?.dni || '—'} />
            <DataRow label="Teléfono" value={user?.telefono || 'No registrado'} />
            <DataRow label="Rol" value="Paciente" last />
          </Card>
        </View>

        {/* Seguridad: verificación de email + 2FA */}
        <View className="px-4 mt-3.5">
          <SeguridadSection />
        </View>

        {/* Acá había una lista de atajos a estudios, mapa y diagnóstico de conexión. Ahora esas
            tres secciones están en la pestaña Menú, junto con todas las demás. */}

        {/* Logout */}
        <View className="px-4 mt-4">
          <PressableScale onPress={handleLogout} haptic="warning" className="flex-row items-center justify-center gap-2 rounded-card py-4 bg-danger-soft border border-danger/20">
            <IconLogout size={16} color={colors.danger.text} />
            <Text className="font-bold text-[15px]" style={{ color: colors.danger.text }}>Cerrar sesión</Text>
          </PressableScale>
        </View>
      </ScrollView>

      {/* Sheet editar datos */}
      <Sheet visible={modal === 'perfil'} onClose={() => setModal(null)} title="Editar datos">
        <Input label="Nombre" value={perfilForm.nombre} onChangeText={(v) => setPerfilForm(f => ({ ...f, nombre: v }))} placeholder="Tu nombre" className="mb-3" />
        <Input label="Apellido" value={perfilForm.apellido} onChangeText={(v) => setPerfilForm(f => ({ ...f, apellido: v }))} placeholder="Tu apellido" className="mb-3" />
        <Input label="Teléfono" value={perfilForm.telefono} onChangeText={(v) => setPerfilForm(f => ({ ...f, telefono: v }))} placeholder="11 1234-5678" keyboardType="phone-pad" className="mb-4" />
        <Button fullWidth loading={actualizarPerfil.isPending} onPress={handleGuardarPerfil}>Guardar cambios</Button>
      </Sheet>

      {/* Sheet contraseña */}
      <Sheet visible={modal === 'password'} onClose={() => setModal(null)} title="Cambiar contraseña">
        <PasswordInput label="Contraseña actual" value={pwdForm.passwordActual} onChangeText={(v) => setPwdForm(f => ({ ...f, passwordActual: v }))} placeholder="••••••••" className="mb-3" />
        <PasswordInput label="Nueva contraseña" value={pwdForm.passwordNueva} onChangeText={(v) => setPwdForm(f => ({ ...f, passwordNueva: v }))} placeholder="••••••••" className="mb-3" />
        <PasswordInput label="Confirmar nueva contraseña" value={pwdForm.confirm} onChangeText={(v) => setPwdForm(f => ({ ...f, confirm: v }))} placeholder="••••••••" className="mb-4" />
        <Button fullWidth loading={cambiarPassword.isPending} onPress={handleCambiarPassword}>Cambiar contraseña</Button>
      </Sheet>
    </View>
  );
}

// DataRow estaba copiado acá, en medico/perfil y en admin/ajustes. Ahora sale de
// components/ui/Rows.tsx.
