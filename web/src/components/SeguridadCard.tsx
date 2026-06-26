import { useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { useReenviarVerificacion, use2FASetup, use2FAEnable, use2FADisable } from '../hooks';
import { apiError } from '../lib/apiError';
import type { TwoFactorSetup } from '../services';
import { Card, Button, Dialog, Input } from '../ui';
import { IconShield, IconMail, IconCheckCircle, IconAlert } from '../ui/icons';

export function SeguridadCard() {
  const { user } = useAuthStore();
  const reenviar = useReenviarVerificacion();
  const setup = use2FASetup();
  const enable = use2FAEnable();
  const disable = use2FADisable();

  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [enableError, setEnableError] = useState('');

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  if (!user) return null;

  const handleReenviar = async () => {
    try {
      const r = await reenviar.mutateAsync();
      toast.success(r.message);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo reenviar el email'));
    }
  };

  const abrirSetup = async () => {
    setEnableError('');
    setCode('');
    try {
      const data = await setup.mutateAsync();
      setSetupData(data);
    } catch (err) {
      toast.error(apiError(err, 'No se pudo iniciar la configuración'));
    }
  };

  const handleEnable = async (e: FormEvent) => {
    e.preventDefault();
    setEnableError('');
    if (!/^\d{6}$/.test(code)) return setEnableError('Ingresá el código de 6 dígitos de tu app.');
    try {
      const r = await enable.mutateAsync(code);
      toast.success(r.message);
      setSetupData(null);
      setCode('');
    } catch (err) {
      setEnableError(apiError(err, 'El código no es válido'));
    }
  };

  const handleDisable = async (e: FormEvent) => {
    e.preventDefault();
    setDisableError('');
    if (!/^\d{6}$/.test(disableCode)) return setDisableError('Ingresá el código de 6 dígitos de tu app.');
    try {
      const r = await disable.mutateAsync(disableCode);
      toast.success(r.message);
      setDisableOpen(false);
      setDisableCode('');
    } catch (err) {
      setDisableError(apiError(err, 'El código no es válido'));
    }
  };

  return (
    <Card className="p-5">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <IconShield className="w-4 h-4 text-slate-400" /> Seguridad
      </h3>

      <div className="divide-y divide-slate-100">
        {/* Verificación de email */}
        <div className="flex items-center gap-3 py-3.5">
          <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 grid place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4">
            <IconMail />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">Verificación de email</p>
            {user.emailVerified ? (
              <p className="text-[13px] text-success-text font-medium flex items-center gap-1">
                <IconCheckCircle className="w-3.5 h-3.5" /> Email verificado
              </p>
            ) : (
              <p className="text-[13px] text-warning-text font-medium flex items-center gap-1">
                <IconAlert className="w-3.5 h-3.5" /> Pendiente de verificar
              </p>
            )}
          </div>
          {!user.emailVerified && (
            <Button variant="secondary" size="sm" loading={reenviar.isPending} onClick={handleReenviar}>
              Reenviar
            </Button>
          )}
        </div>

        {/* 2FA */}
        <div className="flex items-center gap-3 py-3.5">
          <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 grid place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4">
            <IconShield />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">Verificación en dos pasos (2FA)</p>
            {user.twoFactorEnabled ? (
              <p className="text-[13px] text-success-text font-medium flex items-center gap-1">
                <IconCheckCircle className="w-3.5 h-3.5" /> Activada
              </p>
            ) : (
              <p className="text-[13px] text-slate-400">Protegé tu cuenta con una app autenticadora</p>
            )}
          </div>
          {user.twoFactorEnabled ? (
            <Button variant="secondary" size="sm" onClick={() => { setDisableError(''); setDisableCode(''); setDisableOpen(true); }}>
              Desactivar
            </Button>
          ) : (
            <Button variant="secondary" size="sm" loading={setup.isPending} onClick={abrirSetup}>
              Activar
            </Button>
          )}
        </div>
      </div>

      {/* Modal de configuración (QR) */}
      <Dialog open={!!setupData} onClose={() => setSetupData(null)} title="Activar verificación en dos pasos">
        {setupData && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              1. Escaneá este código QR con Google Authenticator, Authy o similar.
            </p>
            <div className="flex justify-center">
              <img src={setupData.qr} alt="Código QR para 2FA" className="w-44 h-44 rounded-xl ring-1 ring-slate-200" />
            </div>
            <p className="text-sm text-slate-500">
              ¿No podés escanear? Ingresá esta clave manualmente:
            </p>
            <code className="block text-center text-[13px] font-mono bg-slate-50 text-slate-700 rounded-field px-3 py-2 ring-1 ring-inset ring-slate-200 break-all">
              {setupData.secret}
            </code>

            <form onSubmit={handleEnable} className="space-y-4 pt-1">
              <Input
                label="2. Ingresá el código de 6 dígitos"
                required
                autoFocus
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                error={enableError}
              />
              <div className="flex justify-end gap-2.5 pt-1">
                <Button type="button" variant="secondary" onClick={() => setSetupData(null)}>Cancelar</Button>
                <Button type="submit" loading={enable.isPending}>Activar 2FA</Button>
              </div>
            </form>
          </div>
        )}
      </Dialog>

      {/* Modal para desactivar */}
      <Dialog open={disableOpen} onClose={() => setDisableOpen(false)} title="Desactivar verificación en dos pasos">
        <form onSubmit={handleDisable} className="space-y-4">
          <p className="text-sm text-slate-500">Para confirmar, ingresá un código actual de tu app autenticadora.</p>
          <Input
            label="Código de 6 dígitos"
            required
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={disableCode}
            onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            error={disableError}
          />
          <div className="flex justify-end gap-2.5 pt-1">
            <Button type="button" variant="secondary" onClick={() => setDisableOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="danger" loading={disable.isPending}>Desactivar 2FA</Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}
