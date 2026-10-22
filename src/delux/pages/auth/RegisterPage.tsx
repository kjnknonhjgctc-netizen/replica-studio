import React, { useState } from 'react';
import { Link, useNavigate } from '@/delux/router';
import { useAuth } from '../../context/AuthContext';
import { DeluxLogo } from '../../components/common/DeluxLogo';
import { PrimaryButton } from '../../components/common/Buttons';
import { FormField } from '../../components/common/CommonComponents';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Preencha seu e-mail e sua senha.');
      return;
    }
    if (cleanPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register(cleanEmail, cleanPassword);
      // Access granted immediately - direct to the 4-step onboarding quiz
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
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

      <div className="w-full max-w-md bg-card  border border-border  rounded-3xl p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex flex-col items-center text-center mb-6">
          <DeluxLogo size="lg" className="mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-foreground ">
            Comece no Delux
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground  mt-1 max-w-xs">
            Crie sua conta para salvar seus dados com segurança.
          </p>
        </div>

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
            label="Senha (mínimo 8 caracteres)"
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Crie sua senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <div className="pt-2">
            <PrimaryButton
              type="submit"
              loading={loading}
              className="w-full"
            >
              Criar Conta e Acessar
            </PrimaryButton>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground ">
          Já possui uma conta?{' '}
          <Link to="/login?mode=login" className="font-semibold text-primary  hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};
