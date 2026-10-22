import React, { useState } from 'react';
import { Link } from '@/delux/router';
import { DeluxLogo } from '../../components/common/DeluxLogo';
import { PrimaryButton } from '../../components/common/Buttons';
import { FormField } from '../../components/common/CommonComponents';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle2, LockKeyhole } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.updatePassword(password);
      setMessage(result.message);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível atualizar sua senha. Abra novamente o link do e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background  flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="delux-auth-form w-full max-w-md bg-card  border border-border  rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex flex-col items-center text-center mb-8">
          <DeluxLogo size="xl" className="mb-6" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-normal text-foreground ">
            Criar nova senha
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground  mt-1 max-w-xs">
            Escolha uma senha com pelo menos 8 caracteres para proteger sua conta.
          </p>
        </div>

        {message ? (
          <div className="text-center p-6 bg-accent  border border-border  rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-primary  mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground  mb-1">Senha atualizada</p>
            <p className="text-xs text-muted-foreground  leading-relaxed mb-6">{message}</p>
            <Link to="/login?mode=login" className="inline-flex items-center gap-2 text-xs font-semibold text-primary  hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 rounded-xl bg-destructive-subtle  border border-destructive-border  text-destructive  text-xs">
                {error}
              </div>
            )}
            <FormField
              label="Nova senha"
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
            <FormField
              label="Confirmar nova senha"
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
              required
            />
            <PrimaryButton type="submit" loading={loading} className="w-full mt-2">
              <LockKeyhole className="w-4 h-4 mr-2 inline" />
              Atualizar senha
            </PrimaryButton>
          </form>
        )}
      </div>
    </div>
  );
};
