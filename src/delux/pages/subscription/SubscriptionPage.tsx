// @ts-nocheck -- ported as-is from the original project
import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/delux/router';
import { api } from '../../services/api';
import { Subscription } from '../../types';
import { PageHeader, LoadingSkeleton } from '../../components/common/CommonComponents';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  CalendarDays, 
  Target, 
  ShieldCheck, 
  ArrowLeft,
  Flame,
  Check
} from 'lucide-react';

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getSubscription()
      .then(res => setSubscription(res.subscription))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const res = await api.toggleSubscription();
      setSubscription(res.subscription);
      setNotice(
        res.subscription.status === 'active'
          ? 'Assinatura reativada com sucesso!'
          : 'Assinatura pausada/cancelada para o próximo ciclo.'
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar assinatura.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={3} />;
  }

  const statusLabels: Record<string, { label: string; class: string }> = {
    active: { label: 'Assinatura Ativa', class: 'bg-success-subtle  text-success  border-success-border ' },
    trial: { label: 'Período de Testes (7 dias)', class: 'bg-accent  text-primary  border-border ' },
    canceled: { label: 'Cancelamento Agendado', class: 'bg-warning-subtle  text-warning  border-warning-border ' },
    none: { label: 'Plano Gratuito', class: 'bg-muted  text-muted-foreground  border-border ' },
    past_due: { label: 'Pagamento Pendente', class: 'bg-destructive-subtle  text-destructive  border-destructive-border ' },
    expired: { label: 'Expirada', class: 'bg-destructive-subtle  text-destructive  border-destructive-border ' }
  };

  const currentBadge = statusLabels[subscription?.status || 'none'] || statusLabels.active;

  const features = [
    { title: 'Diagnóstico Estruturado Completo', desc: 'Mapeamento detalhado de contexto, bloqueios e recursos.' },
    { title: 'Assistente Inteligente Delux', desc: 'Consultoria diária para refinar rotina, metas e obstáculos em tempo real.' },
    { title: 'Planejamento e Redistribuição Semanal', desc: 'Equilíbrio automático de carga para nunca acumular pendências.' },
    { title: 'Objetivos Ilimitados', desc: 'Organize aprendizado, carreira, saúde e finanças simultaneamente.' },
    { title: 'Acompanhamento de Consistência Real', desc: 'Indicadores derivados da prática real, sem métricas superficiais.' },
    { title: 'Sincronização em Nuvem Segura', desc: 'Acesse de qualquer dispositivo sem risco de perda de progresso.' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Plano Delux Premium"
        subtitle="Acesso integral ao método de planejamento, execução e inteligência artificial."
        backAction={() => navigate('/app/inicio')}
      />

      {notice && (
        <div className="p-3.5 bg-success-subtle  border border-success-border  text-success  text-xs rounded-2xl flex items-center gap-2 transition-colors">
          <Check className="w-4 h-4 text-success " />
          <span>{notice}</span>
        </div>
      )}

      {/* Hero Pricing Card */}
      <div className="bg-card  border border-border  rounded-3xl p-6 sm:p-8 shadow-xs text-center relative overflow-hidden transition-colors">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-4 ${currentBadge.class}`}>
          <Crown className="w-3.5 h-3.5 text-primary " />
          <span>{currentBadge.label}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground  tracking-normal">
          R$ 29,90 <span className="text-sm sm:text-base font-normal text-muted-foreground ">/ mês</span>
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground  mt-2 max-w-sm mx-auto leading-relaxed">
          Sem taxas ocultas, sem fidelidade. Cancele ou pause quando desejar com um clique.
        </p>

        <div className="pt-6 pb-2 max-w-xs mx-auto">
          {subscription?.status === 'active' || subscription?.status === 'trial' ? (
            <SecondaryButton
              size="md"
              loading={actionLoading}
              onClick={handleToggleStatus}
              className="w-full text-xs font-semibold"
            >
              Pausar / Cancelar Assinatura
            </SecondaryButton>
          ) : (
            <PrimaryButton
              size="md"
              loading={actionLoading}
              onClick={handleToggleStatus}
              className="w-full text-xs font-semibold"
            >
              Reativar Assinatura Premium
            </PrimaryButton>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground  mt-3 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success " />
          <span>Segurança garantida • Cobrança transparente</span>
        </p>
      </div>

      {/* Feature Breakdown */}
      <div className="delux-section bg-card p-6 sm:p-7 rounded-3xl border border-border  shadow-xs transition-colors">
        <h3 className="text-base font-bold text-foreground  mb-4">
          Tudo o que está incluído no seu plano
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-muted  rounded-2xl border border-border  transition-colors">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary/15 to-primary/15 text-primary  flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground ">{feat.title}</p>
                <p className="text-[11px] text-muted-foreground  mt-0.5 leading-snug">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Integration Architecture Notice */}
      <div className="p-4 bg-muted  rounded-2xl border border-border  text-xs text-muted-foreground  leading-relaxed transition-colors">
        <p className="font-semibold text-foreground  mb-1">
          Transparência & Arquitetura de Pagamentos
        </p>
        O Delux possui integração nativa preparada para webhooks de servidores seguros. Em ambiente de homologação ou desenvolvimento, o status de assinatura pode ser alternado de maneira segura para testes de fluxo sem efetuar cobranças em cartões reais.
      </div>
    </div>
  );
};
