// @ts-nocheck -- ported as-is from the original project
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/delux/router';
import { api } from '../../services/api';
import { Goal, GoalStep, Mission, ActivityEvent } from '../../types';
import { PageHeader, LoadingSkeleton, ConfirmationDialog } from '../../components/common/CommonComponents';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { ProgressBar } from '../../components/common/ProgressBar';
import { TaskRow, categoryIcons, categoryLabels } from '../../components/cards/Cards';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Archive, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock, 
  Layers, 
  History, 
  Target, 
  CheckSquare, 
  Sparkles, 
  Edit2,
  Check,
  Route,
  Compass,
  Milestone,
  MapPin,
  Flag,
  Lock,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessSound, playSelectSound, playButtonSound } from '../../services/sound';

export const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'overview' | 'diagnostic' | 'plan' | 'missions' | 'progress' | 'history'>('map');
  
  // Modals & Dialogs
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);

  // New step form
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepCriteria, setNewStepCriteria] = useState('');

  // New mission form
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionInst, setNewMissionInst] = useState('');
  const [newMissionMinutes, setNewMissionMinutes] = useState(30);
  const [newMissionDate, setNewMissionDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchGoal = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getGoal(id);
      setGoal(res.goal);
    } catch (err) {
      console.error(err);
      navigate('/app/objetivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [id]);

  if (loading || !goal) {
    return <LoadingSkeleton rows={4} />;
  }

  const missions = goal.missions || [];
  const steps = goal.steps || [];
  const diagnostic = goal.diagnostic;

  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const progressPercent = missions.length > 0 ? (completedMissions / missions.length) * 100 : 0;

  // Goal status actions
  const handleUpdateStatus = async (newStatus: any) => {
    try {
      const res = await api.updateGoal(goal.id, { status: newStatus });
      setGoal(prev => (prev ? { ...prev, status: newStatus } : null));
      if (newStatus === 'completed') {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async () => {
    try {
      await api.deleteGoal(goal.id);
      navigate('/app/objetivos');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMission = async (missionId: string) => {
    try {
      await api.toggleMission(missionId);
      await fetchGoal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    try {
      await api.createGoalStep(goal.id, {
        title: newStepTitle.trim(),
        description: newStepDesc.trim(),
        success_criteria: newStepCriteria.trim()
      });
      setNewStepTitle('');
      setNewStepDesc('');
      setNewStepCriteria('');
      setShowAddStepModal(false);
      await fetchGoal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim()) return;
    try {
      await api.createMission({
        goal_id: goal.id,
        title: newMissionTitle.trim(),
        instructions: newMissionInst.trim(),
        estimated_minutes: newMissionMinutes,
        scheduled_date: newMissionDate
      });
      setNewMissionTitle('');
      setNewMissionInst('');
      setShowAddMissionModal(false);
      await fetchGoal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStepStatus = async (step: GoalStep) => {
    const nextStatus = step.status === 'completed' ? 'pending' : 'completed';
    try {
      if (nextStatus === 'completed') {
        playSuccessSound();
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        playButtonSound();
      }
      await api.updateGoalStep(step.id, { status: nextStatus });
      await fetchGoal();
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { key: 'map', label: '🗺️ Mapa do Caminho' },
    { key: 'overview', label: 'Visão Geral' },
    { key: 'diagnostic', label: 'Diagnóstico' },
    { key: 'plan', label: 'Etapas' },
    { key: 'missions', label: `Missões (${missions.length})` },
    { key: 'progress', label: 'Progresso' },
    { key: 'history', label: 'Histórico' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={goal.title}
        subtitle={`${categoryLabels[goal.category]} • ${goal.priority === 'high' ? 'Alta Prioridade' : 'Prioridade Normal'}`}
        backAction={() => navigate('/app/objetivos')}
        action={
          <div className="flex items-center gap-2">
            {goal.status === 'active' ? (
              <SecondaryButton size="sm" onClick={() => handleUpdateStatus('paused')} icon={<Pause className="w-3.5 h-3.5" />}>
                Pausar
              </SecondaryButton>
            ) : (
              <SecondaryButton size="sm" onClick={() => handleUpdateStatus('active')} icon={<Play className="w-3.5 h-3.5" />}>
                Ativar
              </SecondaryButton>
            )}

            {goal.status !== 'completed' && (
              <PrimaryButton size="sm" onClick={() => handleUpdateStatus('completed')} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Concluir
              </PrimaryButton>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              aria-label="Excluir objetivo"
              className="w-9 h-9 rounded-xl border border-border  text-muted-foreground  hover:text-destructive  hover:bg-destructive-subtle  flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border  overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-primary via-primary to-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground  hover:bg-muted  hover:text-foreground '
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 0: MAPA DO CAMINHO (ROADMAP DO SONHO) */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Mission & Roadmap Hero HUD */}
          <div className="bg-gradient-to-br from-feature via-feature to-feature text-primary-foreground p-5 sm:p-7 rounded-3xl border border-border shadow-lg relative overflow-hidden">
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <Route className="w-3.5 h-3.5" />
                  <span>Mapa Prático Passo a Passo</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-normal text-primary-foreground">
                  Roteiro de Conquista do Seu Objetivo
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Não é uma lista aleatória: seu objetivo foi desconstruído em estações sequenciais no mínimo detalhe. Cumpra uma estação por vez para alcançar o resultado garantido.
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 bg-card/5 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-card/10">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-normal block">Progresso do Mapa</span>
                  <span className="text-2xl sm:text-3xl font-black text-feature-foreground">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <SecondaryButton 
                  size="sm" 
                  onClick={() => setShowAddStepModal(true)} 
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="bg-card/10 text-primary-foreground border-card/20 hover:bg-card/20 hover:text-primary-foreground"
                >
                  Adicionar Estação
                </SecondaryButton>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-card/10 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="bg-card/5 py-2 px-3 rounded-xl border border-card/5">
                <span className="text-[11px] text-muted-foreground block font-medium">Estações Totais</span>
                <span className="text-base sm:text-lg font-bold text-primary-foreground">{steps.length}</span>
              </div>
              <div className="bg-card/5 py-2 px-3 rounded-xl border border-card/5">
                <span className="text-[11px] text-muted-foreground block font-medium">Concluídas</span>
                <span className="text-base sm:text-lg font-bold text-success">
                  {steps.filter(s => s.status === 'completed').length}
                </span>
              </div>
              <div className="bg-card/5 py-2 px-3 rounded-xl border border-card/5">
                <span className="text-[11px] text-muted-foreground block font-medium">Missões Ativas</span>
                <span className="text-base sm:text-lg font-bold text-primary">
                  {completedMissions}/{missions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Roadmap Route Stations */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary before:to-border ">
            {steps.length === 0 ? (
              <div className="bg-card  p-8 rounded-3xl border border-border  text-center">
                <Compass className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h4 className="text-sm font-bold text-foreground  mb-1">Nenhuma estação definida</h4>
                <p className="text-xs text-muted-foreground  mb-4">Adicione estações para montar o mapa passo a passo do seu objetivo.</p>
                <PrimaryButton size="sm" onClick={() => setShowAddStepModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                  Criar 1ª Estação do Mapa
                </PrimaryButton>
              </div>
            ) : (
              steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = !isCompleted && (idx === 0 || steps[idx - 1].status === 'completed');
                const stepMissions = missions.filter(m => m.goal_step_id === step.id);

                return (
                  <div key={step.id} className="relative group">
                    {/* Glowing GPS Node Indicator on the line */}
                    <button
                      type="button"
                      onClick={() => handleToggleStepStatus(step)}
                      title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
                      className={`absolute -left-6 sm:-left-8 top-5 w-6 sm:w-7 h-6 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-10 ${
                        isCompleted
                          ? 'bg-success border-success-border text-primary-foreground shadow-md shadow-success/30'
                          : isCurrent
                          ? 'bg-gradient-to-r from-primary to-primary border-card text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-primary/20 animate-pulse'
                          : 'bg-card  border-border  text-muted-foreground hover:border-border'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                      ) : isCurrent ? (
                        <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </button>

                    {/* Station Content Card */}
                    <div
                      className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                        isCurrent
                          ? 'border-primary  bg-card  shadow-md ring-1 ring-primary/20'
                          : isCompleted
                          ? 'border-success-border  bg-success-subtle/20 '
                          : 'border-border  bg-card  opacity-80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-normal text-muted-foreground ">
                              Estação {idx + 1}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent  text-primary  border border-primary ">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                Você está aqui • Foco Atual
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-subtle  text-success  border border-success-border ">
                                Conquistada ✓
                              </span>
                            )}
                          </div>

                          <h3 className={`text-base sm:text-lg font-bold ${
                            isCompleted ? 'text-muted-foreground  line-through' : 'text-foreground '
                          }`}>
                            {step.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStepStatus(step)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer self-start sm:self-auto ${
                            isCompleted
                              ? 'border-border  text-muted-foreground  hover:bg-muted '
                              : 'bg-success hover:bg-success text-primary-foreground border-transparent shadow-xs'
                          }`}
                        >
                          {isCompleted ? 'Reabrir Estação' : 'Marcar Estação Concluída'}
                        </button>
                      </div>

                      {/* No Mínimo Detalhe: Passo a Passo & Critério */}
                      <div className="space-y-3 pt-2 text-xs">
                        <div className="bg-card  p-3.5 rounded-2xl border border-border/60 ">
                          <span className="text-[11px] font-bold text-foreground  block mb-1">
                            🎯 O Que Executar Nesta Estação:
                          </span>
                          <p className="text-muted-foreground  leading-relaxed">
                            {step.description || 'Instruções práticas em execução.'}
                          </p>
                        </div>

                        {step.success_criteria && (
                          <div className="bg-success-subtle/40  p-3 rounded-2xl border border-success-border/60  text-success ">
                            <span className="text-[11px] font-bold block mb-0.5">
                              🏁 Critério de Sucesso Tangível:
                            </span>
                            <p className="leading-relaxed">
                              {step.success_criteria}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Associated Missions in this Step */}
                      {stepMissions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border  space-y-2">
                          <span className="text-[11px] font-bold text-muted-foreground  block">
                            Missões Práticas Desta Estação ({stepMissions.length}):
                          </span>
                          {stepMissions.map(sm => (
                            <div
                              key={sm.id}
                              onClick={() => handleToggleMission(sm.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                sm.status === 'completed'
                                  ? 'bg-card  border-border  text-muted-foreground line-through'
                                  : 'bg-card  border-border/80  text-foreground  hover:border-primary'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  sm.status === 'completed'
                                    ? 'bg-success border-success-border text-primary-foreground'
                                    : 'border-border '
                                }`}>
                                  {sm.status === 'completed' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span className="font-medium">{sm.title}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">{sm.estimated_minutes}m</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-card  p-6 rounded-3xl border border-border  space-y-4 shadow-xs transition-colors">
            <h3 className="text-base font-bold text-foreground ">Resultado Esperado</h3>
            <p className="text-sm text-foreground  leading-relaxed bg-card  p-4 rounded-2xl border border-border/60 ">
              {goal.desired_outcome || 'Nenhum resultado formal registrado.'}
            </p>

            {goal.description && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground  block mb-1">Descrição</span>
                <p className="text-xs text-foreground  leading-relaxed">{goal.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border  text-xs">
              <div>
                <span className="text-muted-foreground  block">Status:</span>
                <span className="font-bold text-foreground  capitalize">{goal.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground  block">Prazo Final:</span>
                <span className="font-bold text-foreground ">{goal.target_date || 'Flexível'}</span>
              </div>
              <div>
                <span className="text-muted-foreground  block">Etapas:</span>
                <span className="font-bold text-foreground ">{steps.length} definidas</span>
              </div>
              <div>
                <span className="text-muted-foreground  block">Missões:</span>
                <span className="font-bold text-foreground ">{completedMissions}/{missions.length} concluídas</span>
              </div>
            </div>
          </div>

          <div className="bg-card  p-6 rounded-3xl border border-border  shadow-xs transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-foreground ">Progresso Operacional</span>
              <span className="text-sm font-bold text-primary ">{Math.round(progressPercent)}%</span>
            </div>
            <ProgressBar progress={progressPercent} height="md" />
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNÓSTICO */}
      {activeTab === 'diagnostic' && (
        <div className="bg-card  p-6 rounded-3xl border border-border  space-y-5 shadow-xs text-left transition-colors">
          <div>
            <h3 className="text-base font-bold text-foreground ">Diagnóstico da Meta</h3>
            <p className="text-xs text-muted-foreground  mt-0.5">
              Análise de ponto de partida, bloqueios e recursos feita na criação do objetivo.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-card  border border-border/60  rounded-2xl">
              <span className="text-xs font-bold text-foreground  block mb-1">Situação Inicial Informada</span>
              <p className="text-xs text-muted-foreground  leading-relaxed">
                {diagnostic?.current_situation || goal.current_state || 'Não especificada.'}
              </p>
            </div>

            <div className="p-4 bg-card  border border-border/60  rounded-2xl">
              <span className="text-xs font-bold text-foreground  block mb-2">Obstáculos e Atritos Conhecidos</span>
              {diagnostic?.obstacles && diagnostic.obstacles.length > 0 ? (
                <ul className="space-y-1.5">
                  {diagnostic.obstacles.map((obs, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground  flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground ">Nenhum obstáculo crítico reportado.</p>
              )}
            </div>

            <div className="p-4 bg-card  border border-border/60  rounded-2xl">
              <span className="text-xs font-bold text-foreground  block mb-2">Recursos Disponíveis</span>
              {diagnostic?.available_resources && diagnostic.available_resources.length > 0 ? (
                <ul className="space-y-1.5">
                  {diagnostic.available_resources.map((res, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground  flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground ">Tempo diário e foco.</p>
              )}
            </div>

            {diagnostic?.constraints && (
              <div className="p-4 bg-card  border border-border/60  rounded-2xl">
                <span className="text-xs font-bold text-foreground  block mb-1">Restrições</span>
                <p className="text-xs text-muted-foreground ">{diagnostic.constraints}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PLANO DE AÇÃO (ETAPAS) */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground ">Etapas do Plano</h3>
              <p className="text-xs text-muted-foreground ">Marcos progressivos para quebrar o objetivo.</p>
            </div>
            <SecondaryButton size="sm" onClick={() => setShowAddStepModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Adicionar Etapa
            </SecondaryButton>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              return (
                <div
                  key={step.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'border-success-border/40  bg-success-subtle/20 '
                      : 'border-border  bg-card '
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStepStatus(step)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center mt-0.5 cursor-pointer ${
                          isCompleted
                            ? 'bg-success border-success-border text-primary-foreground'
                            : 'border-border  hover:border-primary bg-card '
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground ">
                            Etapa {idx + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isCompleted
                              ? 'bg-success-subtle  text-success '
                              : 'bg-accent  text-primary '
                          }`}>
                            {isCompleted ? 'Concluída' : 'Em Andamento'}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold mt-0.5 ${isCompleted ? 'line-through text-muted-foreground ' : 'text-foreground '}`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-muted-foreground  mt-1 leading-relaxed">{step.description}</p>
                        {step.success_criteria && (
                          <p className="text-[11px] text-success  font-semibold mt-2">
                            Critério: {step.success_criteria}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MISSÕES */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground ">Missões Associadas</h3>
              <p className="text-xs text-muted-foreground ">Ações práticas para o dia a dia.</p>
            </div>
            <PrimaryButton size="sm" onClick={() => setShowAddMissionModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Nova Missão
            </PrimaryButton>
          </div>

          {missions.length === 0 ? (
            <div className="p-8 bg-card  border border-border  rounded-2xl text-center">
              <p className="text-xs font-semibold text-foreground  mb-1">Nenhuma missão cadastrada ainda</p>
              <p className="text-xs text-muted-foreground  mb-4">Adicione micro-tarefas para começar a avançar hoje.</p>
              <PrimaryButton size="sm" onClick={() => setShowAddMissionModal(true)}>
                Criar Primeira Missão
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-2.5">
              {missions.map(m => (
                <TaskRow
                  key={m.id}
                  mission={m}
                  onToggle={handleToggleMission}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROGRESSO */}
      {activeTab === 'progress' && (
        <div className="bg-card  p-6 rounded-3xl border border-border  space-y-6 shadow-xs transition-colors">
          <div>
            <h3 className="text-base font-bold text-foreground ">Análise de Progresso</h3>
            <p className="text-xs text-muted-foreground  mt-0.5">
              Diferenciação clara entre progresso de tarefas e realização prática.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-card  rounded-2xl border border-border/60 ">
              <span className="text-xs font-semibold text-muted-foreground  block mb-1">Execução de Missões</span>
              <p className="text-2xl font-bold text-foreground ">
                {completedMissions} <span className="text-xs text-muted-foreground ">de {missions.length} concluídas</span>
              </p>
              <ProgressBar progress={progressPercent} height="sm" className="mt-3" />
            </div>

            <div className="p-5 bg-card  rounded-2xl border border-border/60 ">
              <span className="text-xs font-semibold text-muted-foreground  block mb-1">Etapas Superadas</span>
              <p className="text-2xl font-bold text-foreground ">
                {steps.filter(s => s.status === 'completed').length}{' '}
                <span className="text-xs text-muted-foreground ">de {steps.length} etapas</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: HISTÓRICO */}
      {activeTab === 'history' && (
        <div className="bg-card  p-6 rounded-3xl border border-border  space-y-4 shadow-xs transition-colors">
          <div>
            <h3 className="text-base font-bold text-foreground ">Histórico de Atividades</h3>
            <p className="text-xs text-muted-foreground  mt-0.5">Linha do tempo de marcos deste objetivo.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-card  rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground ">Objetivo criado</p>
                <p className="text-[11px] text-muted-foreground ">{new Date(goal.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            {goal.completed_at && (
              <div className="flex items-start gap-3 p-3 bg-success-subtle  rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-success ">Objetivo concluído</p>
                  <p className="text-[11px] text-muted-foreground ">{new Date(goal.completed_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NOVA ETAPA */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card  rounded-3xl max-w-md w-full p-6 border border-border  shadow-xl text-left transition-colors">
            <h3 className="text-lg font-bold text-foreground  mb-3">Nova Etapa do Plano</h3>
            <form onSubmit={handleCreateStep} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">Título da Etapa</label>
                <input
                  type="text"
                  placeholder="Ex: Treino de Compreensão Auditiva Rápida"
                  value={newStepTitle}
                  onChange={e => setNewStepTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-card  border border-border  text-foreground  placeholder:text-muted-foreground  rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Instruções para passar de fase..."
                  value={newStepDesc}
                  onChange={e => setNewStepDesc(e.target.value)}
                  className="w-full p-3 bg-card  border border-border  text-foreground  placeholder:text-muted-foreground  rounded-xl text-xs sm:text-sm resize-none focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">Critério de Sucesso</label>
                <input
                  type="text"
                  placeholder="Ex: 80% de assertividade nas gravações"
                  value={newStepCriteria}
                  onChange={e => setNewStepCriteria(e.target.value)}
                  className="w-full h-11 px-3.5 bg-card  border border-border  text-foreground  placeholder:text-muted-foreground  rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <SecondaryButton size="sm" type="button" onClick={() => setShowAddStepModal(false)}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton size="sm" type="submit">
                  Salvar Etapa
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA MISSÃO */}
      {showAddMissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card  rounded-3xl max-w-md w-full p-6 border border-border  shadow-xl text-left transition-colors">
            <h3 className="text-lg font-bold text-foreground  mb-3">Nova Missão Prática</h3>
            <form onSubmit={handleCreateMission} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">Título da Missão</label>
                <input
                  type="text"
                  placeholder="Ex: Shadowing de 15 minutos com podcast"
                  value={newMissionTitle}
                  onChange={e => setNewMissionTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-card  border border-border  text-foreground  placeholder:text-muted-foreground  rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">Instruções Práticas</label>
                <textarea
                  rows={2}
                  placeholder="O que exatamente deve ser feito no tempo estipulado..."
                  value={newMissionInst}
                  onChange={e => setNewMissionInst(e.target.value)}
                  className="w-full p-3 bg-card  border border-border  text-foreground  placeholder:text-muted-foreground  rounded-xl text-xs sm:text-sm resize-none focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-foreground  block mb-1">Minutos Estimados</label>
                  <input
                    type="number"
                    value={newMissionMinutes}
                    onChange={e => setNewMissionMinutes(parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3.5 bg-card  border border-border  text-foreground  rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground  block mb-1">Data Agendada</label>
                  <input
                    type="date"
                    value={newMissionDate}
                    onChange={e => setNewMissionDate(e.target.value)}
                    className="w-full h-11 px-3.5 bg-card  border border-border  text-foreground  rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <SecondaryButton size="sm" type="button" onClick={() => setShowAddMissionModal(false)}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton size="sm" type="submit">
                  Criar Missão
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteModal}
        title="Excluir Objetivo Definitivamente?"
        description="Esta ação excluirá o diagnóstico, etapas e missões vinculadas. Para manter o histórico sem executá-lo agora, prefira pausar ou arquivar."
        confirmLabel="Sim, excluir"
        isDestructive
        onConfirm={handleDeleteGoal}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
