import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/delux/router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UserPreferences } from '../../types';
import { PageHeader, FormField, LoadingSkeleton, ConfirmationDialog } from '../../components/common/CommonComponents';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { soundManager, playSuccessSound, playToggleSound } from '../../services/sound';
import { 
  User, 
  Calendar, 
  Clock, 
  Bell, 
  Sparkles, 
  LogOut, 
  Trash2, 
  Check, 
  ShieldCheck, 
  ChevronRight,
  SunMoon,
  Volume2,
  VolumeX
} from 'lucide-react';

const DAYS = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' }
];

export const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'flexible'>('morning');
  const [responseStyle, setResponseStyle] = useState<'direct' | 'detailed' | 'progressive'>('progressive');

  // Notifications
  const [notifMissions, setNotifMissions] = useState(true);
  const [notifDigest, setNotifDigest] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);

  // Sound feedback setting
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  // Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    api.getPreferences()
      .then(prefRes => {
        setPreferences(prefRes.preferences);
        if (prefRes.preferences) {
          setSelectedDays(prefRes.preferences.preferred_days || ['seg', 'ter', 'qua', 'qui', 'sex']);
          setDailyMinutes(prefRes.preferences.daily_available_minutes || 30);
          setPreferredTime(prefRes.preferences.preferred_time || 'morning');
          setResponseStyle(prefRes.preferences.assistant_response_style || 'progressive');
          if (prefRes.preferences.notification_preferences) {
            setNotifMissions(prefRes.preferences.notification_preferences.missions_reminders);
            setNotifDigest(prefRes.preferences.notification_preferences.weekly_digest);
            setNotifAlerts(prefRes.preferences.notification_preferences.achievement_alerts);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSaveProfileAndPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessNotice(false);

    try {
      await api.updateProfile({ full_name: fullName });
      await api.updatePreferences({
        preferred_days: selectedDays,
        daily_available_minutes: dailyMinutes,
        preferred_time: preferredTime,
        assistant_response_style: responseStyle,
        notification_preferences: {
          missions_reminders: notifMissions,
          weekly_digest: notifDigest,
          achievement_alerts: notifAlerts,
          daily_start_reminder: true
        }
      });
      await refreshUser();
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Perfil & Rotina"
        subtitle="Gerencie seus dados pessoais, disponibilidade e configurações de consistência."
      />

      {successNotice && (
        <div className="p-3.5 bg-success-subtle  border border-success-border  text-success  text-xs rounded-2xl flex items-center gap-2 transition-colors">
          <Check className="w-4 h-4 text-success " />
          <span>Configurações atualizadas com sucesso!</span>
        </div>
      )}

      {/* Personal Information Form */}
      <form onSubmit={handleSaveProfileAndPrefs} className="space-y-6">
        {/* Appearance Settings */}
        <div className="delux-section bg-card p-6 rounded-3xl border border-border  shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/10   flex items-center justify-center text-primary ">
                <SunMoon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground ">Aparência do Delux</h3>
                <p className="text-xs text-muted-foreground  mt-0.5">
                  Alterne entre o tema claro e escuro a qualquer momento.
                </p>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              <ThemeToggle variant="segmented" />
            </div>
          </div>
        </div>

        {/* Sound Effects & Feedback Settings */}
        <div className="delux-section bg-card p-6 rounded-3xl border border-border  shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                soundEnabled 
                  ? 'bg-gradient-to-br from-primary/10 to-primary/10   text-primary '
                  : 'bg-muted  text-muted-foreground '
              }`}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground ">Sons de Clique & Feedback</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    soundEnabled
                      ? 'bg-success-subtle  text-success  border border-success-border '
                      : 'bg-muted  text-muted-foreground '
                  }`}>
                    {soundEnabled ? 'Ativado' : 'Mudo'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground  mt-0.5">
                  Efeito sonoro suave ao clicar em botões, selecionar opções e avançar no mapa.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {soundEnabled && (
                <button
                  type="button"
                  onClick={() => playSuccessSound()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border  bg-card  text-foreground  hover:bg-muted  transition-colors cursor-pointer active:scale-95"
                >
                  Testar Som
                </button>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                aria-label="Ativar ou desativar sons dos botões"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  soundManager.setEnabled(next);
                  if (!next) playToggleSound();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                  soundEnabled ? 'bg-gradient-to-r from-primary to-primary' : 'bg-border '
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-card shadow-xs transition-transform absolute top-0.5 ${
                    soundEnabled ? 'translate-x-6.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="delux-section bg-card p-6 rounded-3xl border border-border  space-y-4 shadow-xs transition-colors">
          <h3 className="text-base font-bold text-foreground ">Dados da Conta</h3>

          <FormField
            label="Nome Completo"
            id="fullName"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Seu nome (opcional)"
          />

          <FormField
            label="E-mail"
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            helperText="O e-mail é o identificador exclusivo da sua conta."
          />
        </div>

        {/* Availability Settings */}
        <div className="delux-section bg-card p-6 rounded-3xl border border-border  space-y-5 shadow-xs transition-colors">
          <div>
            <h3 className="text-base font-bold text-foreground ">Disponibilidade Semanal</h3>
            <p className="text-xs text-muted-foreground  mt-0.5">
              O planejador usa esses dados para evitar sobrecarga nas suas missões.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground  block mb-2">
              Dias da semana preferidos para execução
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => {
                const active = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`w-11 h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-primary via-primary to-primary text-primary-foreground shadow-xs'
                        : 'bg-muted  text-muted-foreground  hover:bg-accent '
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-foreground ">
                Tempo diário disponível para missões
              </label>
              <span className="text-sm font-bold text-primary ">{dailyMinutes} min/dia</span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={dailyMinutes}
              onChange={e => setDailyMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground  block mb-2">
              Período de preferência
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'morning', label: 'Manhã' },
                { id: 'afternoon', label: 'Tarde' },
                { id: 'evening', label: 'Noite' },
                { id: 'flexible', label: 'Flexível' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreferredTime(p.id as any)}
                  className={`h-10 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    preferredTime === p.id
                      ? 'border-primary bg-accent  text-primary '
                      : 'border-border  text-muted-foreground  hover:border-border '
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications & Guidance Settings */}
        <div className="delux-section bg-card p-6 rounded-3xl border border-border  space-y-4 shadow-xs transition-colors">
          <h3 className="text-base font-bold text-foreground ">Notificações & Orientação</h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-muted  border border-border  cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-foreground  block">Lembretes de Missões</span>
                <span className="text-[11px] text-muted-foreground ">Avisos nos horários agendados das tarefas</span>
              </div>
              <input
                type="checkbox"
                checked={notifMissions}
                onChange={e => setNotifMissions(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-muted  border border-border  cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-foreground  block">Resumo Semanal de Progresso</span>
                <span className="text-[11px] text-muted-foreground ">Balanço das atividades concluídas na semana</span>
              </div>
              <input
                type="checkbox"
                checked={notifDigest}
                onChange={e => setNotifDigest(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <PrimaryButton type="submit" loading={saving} size="md">
            Salvar Todas as Alterações
          </PrimaryButton>
        </div>
      </form>

      {/* Account Safety and Actions */}
      <div className="delux-section bg-card p-6 rounded-3xl border border-border  space-y-4 shadow-xs transition-colors">
        <h3 className="text-base font-bold text-foreground ">Ações da Conta</h3>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <SecondaryButton
            size="md"
            onClick={handleLogout}
            icon={<LogOut className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Encerrar Sessão
          </SecondaryButton>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-xs font-semibold text-destructive  hover:bg-destructive-subtle  border border-destructive-border  rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Solicitar Exclusão da Conta</span>
          </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteModal}
        title="Excluir Conta Delux?"
        description="Esta ação removerá permanentemente seu histórico, diagnósticos, metas e conversas do banco de dados, em conformidade com as regras de privacidade."
        confirmLabel="Sim, excluir permanentemente"
        isDestructive
        onConfirm={() => {
          setShowDeleteModal(false);
          handleLogout();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
