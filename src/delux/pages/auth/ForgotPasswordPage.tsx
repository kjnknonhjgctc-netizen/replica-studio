import React, { useState } from 'react';
import { Link } from '@/delux/router';
import { DeluxLogo } from '../../components/common/DeluxLogo';
import { PrimaryButton } from '../../components/common/Buttons';
import { FormField } from '../../components/common/CommonComponents';
import { api } from '../../services/api';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setMessage(res.message);
      setSubmitted(true);
    } catch {
      setError('Não foi possível processar a solicitação. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background  flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-md bg-card  border border-border  rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex flex-col items-center text-center mb-8">
          <DeluxLogo size="lg" className="mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-foreground ">
            Recuperação de Acesso
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground  mt-1 max-w-xs">
            Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.
          </p>
        </div>

        {submitted ? (
          <div className="text-center p-6 bg-accent  border border-border  rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-primary  mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground  mb-1">Status da recuperação</p>
            <p className="text-xs text-muted-foreground  leading-relaxed mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary  hover:underline"
            >
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
              label="E-mail cadastrado"
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <PrimaryButton
              type="submit"
              loading={loading}
              className="w-full mt-2"
            >
              Enviar Instruções
            </PrimaryButton>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground  hover:text-foreground  transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retornar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
