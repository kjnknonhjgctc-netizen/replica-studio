// @ts-nocheck -- ported as-is from the original project
import React from 'react';
import { motion } from 'motion/react';
import { Goal, Mission, GoalCategory, MissionPriority } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { 
  Check, 
  Clock, 
  Calendar, 
  Target, 
  Sparkles, 
  ArrowRight, 
  MoreHorizontal,
  Flame,
  BookOpen,
  Briefcase,
  DollarSign,
  HeartPulse,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessSound, playButtonSound } from '../../services/sound';

export const categoryIcons: Record<GoalCategory, React.ReactNode> = {
  health: <HeartPulse className="w-4 h-4 text-success" />,
  learning: <BookOpen className="w-4 h-4 text-primary" />,
  career: <Briefcase className="w-4 h-4 text-primary" />,
  finance: <DollarSign className="w-4 h-4 text-warning" />,
  organization: <Target className="w-4 h-4 text-primary" />,
  personal_dev: <Flame className="w-4 h-4 text-warning" />,
  other: <Compass className="w-4 h-4 text-muted-foreground" />
};

export const categoryLabels: Record<GoalCategory, string> = {
  health: 'Saúde & Físico',
  learning: 'Aprendizado',
  career: 'Carreira',
  finance: 'Finanças',
  organization: 'Organização',
  personal_dev: 'Desenvolvimento',
  other: 'Outro'
};

interface TaskRowProps {
  mission: Mission;
  goalTitle?: string;
  onToggle: (id: string) => void;
  onClick?: (mission: Mission) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  mission,
  goalTitle,
  onToggle,
  onClick
}) => {
  const isCompleted = mission.status === 'completed';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      playSuccessSound();
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#356AE6', '#248A62', '#84a9ff']
        });
      } catch {
        // ignore
      }
    } else {
      playButtonSound();
    }
    onToggle(mission.id);
  };

  return (
    <motion.div
      onClick={() => onClick && onClick(mission)}
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`group flex items-center justify-between p-3.5 sm:p-4 bg-card  hover:bg-card/70  border border-border/90  rounded-2xl cursor-pointer shadow-xs transition-colors ${
        isCompleted ? 'opacity-75 bg-card/70 ' : ''
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Apple-style circular checkbox with spring feedback */}
        <motion.button
          onClick={handleCheckboxClick}
          whileTap={{ scale: 0.8 }}
          animate={{ scale: isCompleted ? [0.85, 1.15, 1] : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          aria-label={isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
          className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isCompleted
              ? 'bg-success border-success text-primary-foreground shadow-xs'
              : 'border-border  hover:border-primary bg-card  group-hover:scale-105'
          }`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </motion.button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium leading-snug transition-all ${
              isCompleted ? 'line-through text-muted-foreground ' : 'text-foreground '
            }`}
          >
            {mission.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {goalTitle && (
              <span className="text-[11px] text-muted-foreground  font-medium truncate max-w-[140px] sm:max-w-[200px]">
                {goalTitle}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ">
              <Clock className="w-3 h-3 text-muted-foreground " />
              {mission.estimated_minutes} min
            </span>
            {mission.priority === 'high' && (
              <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-destructive-subtle  text-destructive  rounded-md">
                Alta
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center pl-2 shrink-0">
        <ArrowRight className="w-4 h-4 text-muted-foreground  group-hover:text-primary  group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.div>
  );
};

interface GoalCardProps {
  goal: Goal;
  onClick: (id: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const missions = goal.missions || [];
  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const progressPercent = missions.length > 0 ? (completedMissions / missions.length) * 100 : 0;
  const activeStep = goal.steps?.find(s => s.status === 'in_progress') || goal.steps?.[0];

  const statusBadges: Record<string, { label: string; class: string }> = {
    active: { label: 'Ativo', class: 'bg-accent  text-primary ' },
    paused: { label: 'Pausado', class: 'bg-warning-subtle  text-warning ' },
    completed: { label: 'Concluído', class: 'bg-success-subtle  text-success ' },
    draft: { label: 'Rascunho', class: 'bg-muted  text-muted-foreground ' },
    archived: { label: 'Arquivado', class: 'bg-muted  text-muted-foreground ' }
  };

  const badge = statusBadges[goal.status] || statusBadges.active;

  return (
    <motion.div
      onClick={() => onClick(goal.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="delux-goal-card group bg-card  hover:bg-card/60  p-5 rounded-2xl border border-border/90  hover:border-primary/40  cursor-pointer shadow-xs hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-muted  rounded-lg">
            {categoryIcons[goal.category] || categoryIcons.other}
          </span>
          <span className="text-xs font-semibold text-muted-foreground ">
            {categoryLabels[goal.category]}
          </span>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.class}`}>
          {badge.label}
        </span>
      </div>

      <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary  transition-colors leading-snug line-clamp-2 mb-2">
        {goal.title}
      </h3>

      {goal.desired_outcome && (
        <p className="text-xs text-muted-foreground  line-clamp-2 mb-4 leading-relaxed">
          {goal.desired_outcome}
        </p>
      )}

      {activeStep && (
        <div className="p-2.5 bg-card  rounded-xl mb-4 border border-border/60 ">
          <span className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground  block mb-0.5">
            Etapa Atual
          </span>
          <p className="text-xs font-medium text-foreground  truncate">
            {activeStep.title}
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-border ">
        <div className="flex justify-between items-center text-xs text-muted-foreground  mb-1.5">
          <span>{completedMissions}/{missions.length} missões concluídas</span>
          <span className="font-semibold text-foreground ">{Math.round(progressPercent)}%</span>
        </div>
        <ProgressBar progress={progressPercent} height="sm" />
      </div>
    </motion.div>
  );
};
