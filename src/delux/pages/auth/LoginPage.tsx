import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from '@/delux/router';
import { useAuth } from '../../context/AuthContext';
import { DeluxLogo } from '../../components/common/DeluxLogo';
import { PrimaryButton } from '../../components/common/Buttons';
import { FormField } from '../../components/common/CommonComponents';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Login links must open the login form; signup routes open registration.
  const initialMode = searchParams.get('mode') === 'login' || location.pathname === '/login' ? 'login' : 'register';
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    if (mode === 'register' && cleanPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        // Direct access: registers and logs in immediately without email confirmation
        await register(cleanEmail, cleanPassword);
        navigate('/onboarding', { replace: true });
      } else {
        await login(cleanEmail, cleanPassword);
        navigate('/app/inicio', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao processar.';
      // Helpful redirection if user already exists
      if (mode === 'register' && msg.toLowerCase().includes('já existe')) {
        setError('Este e-mail já possui cadastro. Você pode alternar para "Já tenho conta".');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background  text-foreground  flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative transition-colors">
      {/* Top Corner Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="icon" size="sm" />
      </div>

      <div className="delux-auth-form w-full max-w-md bg-card  border border-border  rounded-3xl p-6 sm:p-8 shadow-xs transition-colors">
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <DeluxLogo size="xl" className="mb-6" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-normal text-foreground ">
            {mode === 'register' ? 'Comece no Delux' : 'Acesse sua conta'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground  mt-1 max-w-xs">
            {mode === 'register'
              ? 'Crie sua conta para salvar seus dados com segurança.'
              : 'Digite seu e-mail e senha para continuar seu progresso.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-muted  rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-card  text-foreground  shadow-xs'
                : 'text-muted-foreground  hover:text-foreground '
            }`}
          >
            Criar Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-card  text-foreground  shadow-xs'
                : 'text-muted-foreground  hover:text-foreground '
            }`}
          >
            Já tenho conta
          </button>
        </div>

        {mode === 'login' && (
          <div className="mb-5 flex items-center gap-2 p-2.5 rounded-xl bg-success-subtle  border border-success-border  text-success  text-[11px] font-medium transition-colors">
            <ShieldCheck className="w-4 h-4 text-success  shrink-0" />
            <span>Entre com seu e-mail e senha para continuar seu progresso.</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-destructive-subtle  border border-destructive-border  text-destructive  text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="E-mail"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <FormField
            label="Senha"
            id="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            placeholder="Digite sua senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <PrimaryButton
            type="submit"
            loading={loading}
            className="w-full mt-2"
          >
            {mode === 'register' ? 'Criar e Acessar Agora' : 'Entrar no Delux'}
          </PrimaryButton>
        </form>

        {mode === 'login' && (
          <div className="mt-4 text-right">
            <Link to="/recuperar-senha" className="text-xs font-semibold text-primary  hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        )}

        {/* Toggle Mode Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground ">
          {mode === 'register' ? (
            <>
              Já possui uma conta salva?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-primary  hover:underline cursor-pointer"
              >
                Entrar com e-mail e senha
              </button>
            </>
          ) : (
            <>
              Primeira vez por aqui?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-primary  hover:underline cursor-pointer"
              >
                Criar conta rápida
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
