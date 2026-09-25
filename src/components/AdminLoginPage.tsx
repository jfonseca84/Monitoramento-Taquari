import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { HOME_FONT } from './homeTheme';

interface AdminLoginPageProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoggingIn: boolean;
  error: string | null;
  info: string | null;
  onGoogle: () => void;
  onForgot: () => void;
  // Redefinição de senha (depois de abrir o link recebido por e-mail)
  recoveryMode: boolean;
  onSetNewPassword: (newPassword: string) => Promise<void>;
  onClose: () => void;
}

const FIELD =
  'w-full px-3 py-2 rounded-[8px] bg-[var(--hm-a)] border border-[var(--hm-line)] text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] text-[12.5px] focus:outline-none focus:border-[var(--hm-accent)] transition-colors';
const LABEL = 'block text-[12px] font-semibold text-[var(--hm-muted)] mb-1.5';

const GoogleGlyph: React.FC = () => (
  <svg viewBox="0 0 48 48" className="w-[18px] h-[18px]" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

// Login do painel admin no formato da página Início: formulário no centro, frase do projeto à esquerda
export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  email, setEmail, password, setPassword, onSubmit, isLoggingIn, error, info, onGoogle, onForgot, recoveryMode, onSetNewPassword, onClose
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (newPassword.length < 8) {
      setRecoveryError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('As senhas não coincidem.');
      return;
    }
    setSaving(true);
    try {
      await onSetNewPassword(newPassword);
    } catch (err: any) {
      setRecoveryError(err?.message || 'Não foi possível salvar a nova senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${HOME_FONT} fixed inset-x-0 top-14 bottom-0 z-30 bg-[var(--hm-a)] text-[var(--hm-text)] flex flex-col lg:grid lg:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.6fr)_150px] overflow-y-auto lg:overflow-hidden`}>
      {/* CENTRO: FORMULÁRIO, centralizado no card */}
      <div className="order-1 lg:order-2 min-w-0 lg:h-full lg:overflow-y-auto no-scrollbar bg-[var(--hm-b)] flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-[290px]">
          <div className="text-center mb-5">
            <h1 className="m-0 text-[26px] font-black tracking-[-0.03em] leading-tight">{recoveryMode ? 'Nova senha' : 'Entrar'}</h1>
            <p className="m-0 text-[13px] text-[var(--hm-muted)]">Área administrativa</p>
          </div>

        <section>
          <div>
            {recoveryMode ? (
              <form onSubmit={submitNewPassword} className="flex flex-col gap-4">
                <p className="m-0 text-center text-[13px] text-[var(--hm-muted)]">Escolha uma nova senha para continuar.</p>
                {recoveryError && <p role="alert" className="m-0 text-[13px] text-[#C63B2F] font-semibold">{recoveryError}</p>}
                <div>
                  <label className={LABEL} htmlFor="new-password">Nova senha</label>
                  <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={FIELD} autoComplete="new-password" required />
                </div>
                <div>
                  <label className={LABEL} htmlFor="confirm-password">Confirmar nova senha</label>
                  <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={FIELD} autoComplete="new-password" required />
                </div>
                <button type="submit" disabled={saving} className="w-full py-2 rounded-[8px] bg-[#2F6FA3] hover:bg-[#28608F] disabled:opacity-50 text-white text-[12.5px] font-bold cursor-pointer transition-colors">
                  {saving ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <p className="m-0 text-center text-[14px] font-extrabold">Acesse sua conta</p>
                  {error && <p role="alert" className="m-0 text-[13px] text-[#C63B2F] font-semibold leading-snug">{error}</p>}
                  {info && <p role="status" className="m-0 text-[13px] text-[#2E9E5B] font-semibold leading-snug">{info}</p>}
                  <div>
                    <label className={LABEL} htmlFor="login-email">E-mail</label>
                    <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} autoComplete="username" required />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="login-password">Senha</label>
                    <div className="relative">
                      <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${FIELD} pr-11`} autoComplete="current-password" required />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--hm-muted)] hover:text-[var(--hm-text)] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="mt-2 text-right">
                      <button type="button" onClick={onForgot} className="text-[13px] font-semibold text-[var(--hm-accent)] hover:underline cursor-pointer">
                        Esqueci a senha
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoggingIn} className="w-full py-2 rounded-[8px] bg-[#2F6FA3] hover:bg-[#28608F] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12.5px] font-bold cursor-pointer transition-colors">
                    {isLoggingIn ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-6" aria-hidden="true">
                  <span className="flex-1 h-px bg-[var(--hm-line)]" />
                  <span className="text-[12px] text-[var(--hm-muted)]">ou</span>
                  <span className="flex-1 h-px bg-[var(--hm-line)]" />
                </div>

                <button
                  type="button"
                  onClick={onGoogle}
                  className="w-full inline-flex items-center justify-center gap-2.5 py-2 rounded-[8px] bg-white text-[#1B222B] border border-[#D5DAE0] hover:bg-[#F4F5F7] text-[12.5px] font-bold cursor-pointer transition-colors"
                >
                  <GoogleGlyph /> Entrar com o Google
                </button>
              </>
            )}

            <button type="button" onClick={onClose} className="mt-7 block mx-auto text-[13px] font-semibold text-[var(--hm-muted)] hover:text-[var(--hm-text)] cursor-pointer">
              ← Voltar ao site
            </button>
          </div>
        </section>
        </div>
      </div>

      {/* DIREITA: espaço reservado (será organizado depois) */}
      <aside aria-hidden="true" className="hidden lg:block order-3 bg-[var(--hm-side)]" />

      {/* ESQUERDA (onde fica o mapa na Início): só a frase do projeto */}
      <section className="order-2 lg:order-1 relative lg:h-full min-h-[220px] overflow-hidden bg-[var(--map-bg)] text-[var(--map-text)]">
        <div className="h-full px-7 pb-12 flex items-center justify-center text-center">
          <h2 className="m-0 text-[clamp(20px,1.8vw,26px)] font-black tracking-[-0.02em] leading-tight">O Vale bem informado</h2>
        </div>
        <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-[var(--map-faint)] pointer-events-none">© {new Date().getFullYear()} Nível Taquari. Todos os direitos reservados.</div>
      </section>
    </div>
  );
};
