// @ts-nocheck -- ported as-is from the original project
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Goal, Mission, UserPreferences } from '../../types';
import { PageHeader, LoadingSkeleton, ConfirmationDialog } from '../../components/common/CommonComponents';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { TaskRow } from '../../components/cards/Cards';
import { addDaysToDateOnly } from '../../utils/date';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2,
  CalendarDays,
  MoveRight
} from 'lucide-react';

export const PlannerPage: React.FC = () => {
  const [plannerData, setPlannerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchPlanner = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await api.getPlanner();
      setPlannerData(res);
    } catch (err) {
      console.error(err);
      setLoadError('Não foi possível carregar o planejamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanner();
  }, []);

  const handleToggleMission = async (missionId: string) => {
    try {
      await api.toggleMission(missionId);
      await fetchPlanner();
    } catch (err) {
      console.error(err);
      setToastMessage('Não foi possível atualizar a tarefa. Tente novamente.');
    }
  };

  const handleMoveMissionDate = async (mission: Mission, daysOffset: number) => {
    try {
      const newDateStr = addDaysToDateOnly(mission.scheduled_date, daysOffset);
      await api.updateMission(mission.id, { scheduled_date: newDateStr });
      await fetchPlanner();
    } catch (err) {
      console.error(err);
      setToastMessage('Não foi possível reagendar a tarefa. Tente novamente.');
    }
  };

  const handleConfirmRebalance = async () => {
    setRebalancing(true);
    try {
      const res = await api.rebalancePlanner();
      setShowRebalanceModal(false);
      setToastMessage(res.message);
      await fetchPlanner();
    } catch (err: any) {
      alert(err.message || 'Erro ao redistribuir.');
    } finally {
      setRebalancing(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (!plannerData) {
    return (
      <div className="rounded-2xl border border-border  bg-card  p-6 text-center">
        <p role="alert" className="text-sm text-muted-foreground  mb-4">
          {loadError || 'O planejamento não está disponível no momento.'}
        </p>
        <SecondaryButton size="sm" onClick={fetchPlanner}>
          Tentar novamente
        </SecondaryButton>
      </div>
    );
  }

  const { days, goals, preferences } = plannerData;
  const currentSelectedDay = days[selectedDayIdx] || days[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planejamento Semanal"
        subtitle="Organize suas ações nos próximos 7 dias com base na sua capacidade real de tempo."
        action={
          <SecondaryButton
            size="sm"
            onClick={() => setShowRebalanceModal(true)}
            icon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
          >
            Redistribuir Pendências
          </SecondaryButton>
        }
      />

      {toastMessage && (
        <div className="p-3.5 bg-success-subtle  border border-success-border  text-success  text-xs rounded-2xl flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-bold underline text-xs cursor-pointer">
            OK
          </button>
        </div>
      )}

      {/* 7-Day Quick Strip Bar */}
      <div className="bg-card  p-3 rounded-2xl border border-border  shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day: any, idx: number) => {
            const isSelected = selectedDayIdx === idx;
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-1 min-w-[50px] py-2 px-1 rounded-xl flex flex-col items-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-primary via-primary to-primary text-primary-foreground shadow-sm shadow-primary/25'
                    : 'text-muted-foreground  hover:bg-muted  hover:text-foreground '
                }`}
              >
                <span className="text-[10px] font-semibold tracking-normal uppercase opacity-80">
                  {day.dayName}
                </span>
                <span className="text-sm font-bold mt-0.5">{day.dayNumber}</span>
                <div className="flex items-center gap-1 mt-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      day.hasConflict
                        ? 'bg-warning'
                        : day.missions.length > 0
                        ? isSelected
                          ? 'bg-card'
                          : 'bg-primary '
                        : 'bg-transparent'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Capacity and Conflict Alert */}
      <div className="bg-card  p-5 rounded-3xl border border-border  shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground ">
              {currentSelectedDay.isToday ? 'Hoje' : currentSelectedDay.dayName} —{' '}
              {new Date(currentSelectedDay.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long'
              })}
            </h3>
            <p className="text-xs text-muted-foreground  mt-0.5">
              Carga total estimada:{' '}
              <span className="font-semibold text-foreground ">
                {currentSelectedDay.totalMinutes} minutos
              </span>{' '}
              (sua meta diária: {currentSelectedDay.availableMinutes} min)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                currentSelectedDay.hasConflict
                  ? 'bg-warning-subtle  text-warning  border border-warning-border '
                  : 'bg-success-subtle  text-success  border border-success-border '
              }`}
            >
              {currentSelectedDay.hasConflict ? 'Carga Alta' : 'Equilibrado'}
            </span>
          </div>
        </div>

        {currentSelectedDay.hasConflict && (
          <div className="p-3 bg-warning-subtle/90  border border-warning-border  rounded-2xl text-xs text-warning  flex items-center gap-2.5 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-warning " />
            <p>
              As atividades deste dia superam seu tempo ideal. Considere mover uma das tarefas para o dia seguinte para evitar frustração.
            </p>
          </div>
        )}

        {/* Missions for current day */}
        <div className="space-y-2.5">
          {currentSelectedDay.missions.length === 0 ? (
            <div className="p-8 bg-card  border border-border/60  rounded-2xl text-center">
              <CalendarDays className="w-8 h-8 text-muted-foreground  mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground ">Nenhuma missão agendada para este dia</p>
              <p className="text-[11px] text-muted-foreground  mt-0.5">
                Aproveite o tempo de descanso ou adiante passos dos seus objetivos ativos.
              </p>
            </div>
          ) : (
            currentSelectedDay.missions.map((m: Mission) => {
              const relatedGoal = goals.find((g: Goal) => g.id === m.goal_id);
              return (
                <div key={m.id} className="relative group">
                  <TaskRow
                    mission={m}
                    goalTitle={relatedGoal?.title}
                    onToggle={handleToggleMission}
                  />
                  {/* Quick Reschedule Pill */}
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMoveMissionDate(m, 1);
                      }}
                      title="Mover para amanhã"
                      className="px-2 py-1 bg-card  border border-border  text-[10px] font-semibold text-muted-foreground  hover:text-primary  rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Amanhã</span>
                      <MoveRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Planner Rebalance */}
      <ConfirmationDialog
        isOpen={showRebalanceModal}
        title="Redistribuir Missões Automaticamente?"
        description="O Delux reorganizará as tarefas atrasadas e pendentes pelos próximos 3 dias, respeitando seu limite diário e evitando sobrecarga. Nenhuma tarefa será excluída."
        confirmLabel="Sim, redistribuir com equilíbrio"
        onConfirm={handleConfirmRebalance}
        onCancel={() => setShowRebalanceModal(false)}
      />
    </div>
  );
};
