// @ts-nocheck -- ported as-is from the original project
import React, { useState } from 'react';
import { useNavigate } from '@/delux/router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DeluxLogo } from '../../components/common/DeluxLogo';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { 
  playButtonSound, 
  playSelectSound, 
  playStepSound, 
  playSuccessSound 
} from '../../services/sound';
import { 
  HeartPulse, 
  BookOpen, 
  Briefcase, 
  DollarSign, 
  Flame, 
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  ArrowLeft,
  User,
  Zap,
  Target,
  Smile,
  ShieldCheck,
  Check,
  Sunrise,
  Sun,
  Moon,
  RotateCcw,
  MapPin,
  Route,
  Milestone
} from 'lucide-react';

const MOMENTS = [
  {
    id: 'unlock_goal',
    title: 'Transformar um Grande Sonho em Realidade',
    desc: 'Tenho uma visão ambiciosa, mas preciso do mapa exato de como chegar lá passo a passo.',
    icon: Compass,
    accent: 'from-primary/10 to-primary/10 text-primary   '
  },
  {
    id: 'transition',
    title: 'Nova Transição de Carreira ou Vida',
    desc: 'Iniciando nova área, estudos intensivos ou mudança e preciso do caminho detalhado.',
    icon: Route,
    accent: 'from-primary/10 to-primary/10 text-primary   '
  },
  {
    id: 'focus_discipline',
    title: 'Eliminar Procrastinação & Destravar',
    desc: 'Sei onde quero chegar, mas me perco no dia a dia por falta de um roteiro no mínimo detalhe.',
    icon: Zap,
    accent: 'from-warning/10 to-warning/10 text-warning   '
  },
  {
    id: 'mastery',
    title: 'Conquistar Maestria & Metas de Alto Nível',
    desc: 'Quero dominar uma habilidade complexa (esporte, idiomas, finanças ou negócios).',
    icon: Milestone,
    accent: 'from-success/10 to-success/10 text-success   '
  }
];

const CATEGORIES = [
  { 
    id: 'career', 
    label: 'Carreira & Negócios', 
    icon: Briefcase, 
    desc: 'Transição tech, abrir empresa, promoção ou novos clientes',
    suggestions: [
      'Transição para Desenvolvedor(a) e 1º emprego em 6 meses',
      'Lançar um E-commerce próprio e faturar os primeiros R$ 10k',
      'Construir autoridade na área e conseguir promoção de cargo'
    ]
  },
  { 
    id: 'learning', 
    label: 'Conhecimento & Idiomas', 
    icon: BookOpen, 
    desc: 'Fluência em idiomas, certificações e leitura profunda',
    suggestions: [
      'Alcançar conversação fluente em inglês em 6 meses',
      'Passar em concurso público de alto nível',
      'Aprender Inteligência Artificial e dominar programação'
    ]
  },
  { 
    id: 'health', 
    label: 'Superação Física & Saúde', 
    icon: HeartPulse, 
    desc: 'Completar maratonas, transformar o corpo e vitalidade',
    suggestions: [
      'Treinar do zero e completar uma Meia Maratona (21km)',
      'Construir condicionamento de atleta e perder 12kg',
      'Rotina de musculação e alimentação saudável 5x por semana'
    ]
  },
  { 
    id: 'finance', 
    label: 'Liberdade Financeira & Patrimônio', 
    icon: DollarSign, 
    desc: 'Reserva estratégica, investimentos e compra de bens',
    suggestions: [
      'Construir reserva de emergência e começar a investir em ações',
      'Juntar R$ 60 mil para dar entrada no imóvel próprio',
      'Zerar todas as dívidas e organizar patrimônio familiar'
    ]
  },
  { 
    id: 'personal_dev', 
    label: 'Projetos de Vida & Maestria', 
    icon: Flame, 
    desc: 'Escrever um livro, arte, foco inabalável e novos hábitos',
    suggestions: [
      'Escrever, revisar e publicar meu primeiro livro',
      'Construir disciplina matinal sem celular ou distrações',
      'Dominar um instrumento musical do zero'
    ]
  }
];

const DAYS = [
  { id: 'seg', label: 'Seg', full: 'Segunda' },
  { id: 'ter', label: 'Ter', full: 'Terça' },
  { id: 'qua', label: 'Qua', full: 'Quarta' },
  { id: 'qui', label: 'Qui', full: 'Quinta' },
  { id: 'sex', label: 'Sex', full: 'Sexta' },
  { id: 'sab', label: 'Sáb', full: 'Sábado' },
  { id: 'dom', label: 'Dom', full: 'Domingo' }
];

const STYLES = [
  {
    id: 'detailed',
    title: 'Mapa Cirúrgico no Mínimo Detalhe',
    badge: 'Recomendado',
    desc: 'Passo a passo minucioso com instruções exatas de o que fazer em cada sessão, eliminando qualquer dúvida.'
  },
  {
    id: 'progressive',
    title: 'Progressivo & Adaptativo',
    badge: 'Gradual',
    desc: 'Começa com micro-passos acessíveis e ganha complexidade conforme sua constância aumenta.'
  },
  {
    id: 'direct',
    title: 'Direto ao Ponto & Focado',
    badge: 'Objetivo',
    desc: 'Instruções concisas sem enrolação, focado puramente na ação e no resultado de cada marco.'
  }
];

const OBSTACLES = [
  'Não saber por onde começar ou qual o próximo passo',
  'Falta de tempo e rotina sobrecarregada',
  'Procrastinação quando a meta parece grande demais',
  'Distrações constantes com celular e redes sociais',
  'Perder o ânimo após 2 ou 3 semanas sem um mapa claro'
];

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Tab state: 'identification' OR 'quiz' (5 etapas)
  const [activeTab, setActiveTab] = useState<'identification' | 'quiz'>('identification');

  // Name (Aba de Identificação)
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [nameError, setNameError] = useState<string | null>(null);

  // Quiz Steps: 1, 2, 3, 4, 5
  const [quizStep, setQuizStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Quiz Step 1: Momento & Ponto de Partida
  const [selectedMoment, setSelectedMoment] = useState('unlock_goal');

  // Quiz Step 2: O Grande Sonho / Objetivo
  const [category, setCategory] = useState('career');
  const [goalTitle, setGoalTitle] = useState('');

  // Quiz Step 3: Ritmo de Marcha
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'flexible'>('morning');
  const [selectedDays, setSelectedDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);

  // Quiz Step 4: Nível de Detalhe & Obstáculos
  const [responseStyle, setResponseStyle] = useState<'detailed' | 'progressive' | 'direct'>('detailed');
  const [primaryObstacle, setPrimaryObstacle] = useState('Não saber por onde começar ou qual o próximo passo');

  // Submission state
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishSuccess, setFinishSuccess] = useState(false);

  const toggleDay = (dayId: string) => {
    playSelectSound();
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== dayId);
      }
      return [...prev, dayId];
    });
  };

  const setAllDays = () => {
    playSelectSound();
    setSelectedDays(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']);
  };

  const setWeekdays = () => {
    playSelectSound();
    setSelectedDays(['seg', 'ter', 'qua', 'qui', 'sex']);
  };

  const currentCategoryObj = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  const handleContinueToQuiz = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setNameError('Por favor, informe seu nome para continuar.');
      return;
    }
    playStepSound();
    setNameError(null);
    setActiveTab('quiz');
  };

  const handleFinishQuiz = async () => {
    setIsFinishing(true);
    playSuccessSound();
    try {
      const finalName = fullName.trim() || 'Usuário';
      const resolvedGoalTitle = goalTitle.trim() || `Mapa de Conquista: ${currentCategoryObj.label}`;

      await api.completeOnboarding({
        name: finalName,
        full_name: finalName,
        preferences: {
          preferred_days: selectedDays,
          daily_available_minutes: dailyMinutes,
          preferred_time: preferredTime,
          assistant_response_style: responseStyle,
          notification_preferences: {
            missions_reminders: true,
            weekly_digest: true,
            achievement_alerts: true,
            daily_start_reminder: true
          }
        },
        firstGoal: {
          title: resolvedGoalTitle,
          category,
          priority: 'high',
          desired_outcome: resolvedGoalTitle,
          current_state: `Momento inicial: ${MOMENTS.find(m => m.id === selectedMoment)?.title || 'Novo ciclo'}`,
          obstacles: [primaryObstacle],
          constraints: `${dailyMinutes} min/dia nos dias: ${selectedDays.join(', ')}`
        }
      });

      await refreshUser();
      setFinishSuccess(true);
      setTimeout(() => {
        navigate('/app/inicio', { replace: true });
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Erro ao concluir o quiz. Tente novamente.');
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background    text-foreground  flex flex-col justify-between py-4 sm:py-6 px-3.5 sm:px-6 relative overflow-x-hidden transition-colors">
      
      {/* Decorative ambient background glows */}

      {/* Top Header with Delux Logo & Responsive Stepper */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pb-3 sm:pb-5 relative z-10">
        <DeluxLogo size="md" />
        
        <div className="flex items-center gap-2">
          {/* Step Indicator when on Quiz */}
          {activeTab === 'quiz' && (
            <div className="flex items-center gap-2.5 bg-card/80  backdrop-blur-md px-3 py-1.5 rounded-full border border-border/80  shadow-xs">
              <span className="text-[11px] font-semibold text-muted-foreground ">
                <span className="hidden xs:inline">Etapa </span>
                <strong className="text-primary  font-bold">{quizStep}</strong>
                <span>/5</span>
              </span>
              <div className="flex items-center gap-1" aria-label={`Etapa ${quizStep} de 5`}>
                {[1, 2, 3, 4, 5].map(s => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      s === quizStep
                        ? 'w-6 bg-gradient-to-r from-primary via-primary to-primary shadow-xs'
                      : s < quizStep
                      ? 'w-2.5 bg-success'
                      : 'w-2 bg-muted '
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <ThemeToggle variant="icon" size="sm" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-auto relative z-10 pb-4">
        <div className="delux-section bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-soft transition-all">
          
          {/* Finish Success State */}
          {finishSuccess ? (
            <div className="text-center py-10 sm:py-12 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-success/20 to-primary/20 text-success flex items-center justify-center mx-auto mb-5 shadow-xs">
                <Route className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black tracking-normal text-foreground  mb-2">
                Mapa do Caminho de {fullName.trim() || 'Usuário'} Gerado!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground  max-w-sm mx-auto mb-6 leading-relaxed">
                Seu objetivo foi desconstruído em estações, marcos práticos e micro-passos diários no mínimo detalhe. Entrando no Delux...
              </p>
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : activeTab === 'identification' ? (
            
            /* ======================================================== */
            /* IDENTIFICAÇÃO (BOAS-VINDAS & MISSÃO DO SISTEMA)          */
            /* ======================================================== */
            <form onSubmit={handleContinueToQuiz}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/10   text-primary  border border-primary/20 text-xs font-semibold mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>O Arquiteto de Sonhos em Ação</span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black tracking-normal text-foreground  mb-2">
                Como devemos te chamar?
              </h1>
              
              <p className="text-xs sm:text-sm text-muted-foreground  mb-6 leading-relaxed">
                O Delux não é mais um app genérico de listas ou rotinas. Nossa missão é transformar <strong>qualquer objetivo ou sonho</strong> em um <strong>mapa prático passo a passo no mínimo detalhe</strong> para você seguir sem hesitar.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="user_name_input" className="text-xs font-bold text-foreground  block mb-2">
                    Seu nome completo ou apelido
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted-foreground  absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="user_name_input"
                      type="text"
                      placeholder="Ex: Lucas, Camila ou Alex"
                      value={fullName}
                      onChange={e => {
                        setFullName(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      autoFocus
                      className="w-full h-12 pl-10 pr-4 bg-card/70  hover:bg-card  focus:bg-card  border border-border  focus:border-primary  focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm text-foreground  placeholder-border  focus:outline-none transition-all font-medium"
                    />
                  </div>
                  {nameError && (
                    <p className="text-xs text-destructive  font-medium mt-2 flex items-center gap-1">
                      <span>•</span>
                      <span>{nameError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Mobile-Ergonomic Action Bar */}
              <div className="delux-wizard-actions sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-3.5 sm:p-0 sm:pt-4 bg-card/95  backdrop-blur-md border-t border-border  sm:border-0 rounded-b-2xl sm:rounded-none flex justify-end items-center z-20">
                <button
                  type="submit"
                  className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary hover:opacity-95 active:scale-[0.98] text-primary-foreground font-bold text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
                >
                  <span>Mapear Meu Objetivo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

          ) : (

            /* ======================================================== */
            /* MINI QUIZ (4 ETAPAS COM MOBILE-FIRST REFINADO)           */
            /* ======================================================== */
            <>
              {/* QUIZ ETAPA 1 DE 5: Momento & Ponto de Partida */}
              {quizStep === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent  text-primary  border border-primary/60  text-xs font-semibold">
                      <Compass className="w-3.5 h-3.5" />
                      Passo 1 de 5 • Ponto de Partida
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground  mb-1.5">
                    Qual é o ponto de partida do seu objetivo?
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground  mb-5 leading-relaxed">
                    Identificamos o estado atual para traçar o roteiro exato até a realização.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-6">
                    {MOMENTS.map(moment => {
                      const Icon = moment.icon;
                      const isSelected = selectedMoment === moment.id;
                      return (
                        <div
                          key={moment.id}
                          onClick={() => {
                            playSelectSound();
                            setSelectedMoment(moment.id);
                          }}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] min-h-[52px] ${
                            isSelected
                              ? 'border-primary  bg-accent/80  shadow-xs ring-1 ring-primary/50 '
                              : 'border-border/90  hover:border-border  bg-card  hover:bg-card/70 '
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-xl bg-gradient-to-br ${moment.accent} shadow-2xs`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'border-primary  bg-primary  text-primary-foreground' : 'border-border '
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <div>
                            <p className={`text-xs sm:text-sm font-bold mb-1 ${isSelected ? 'text-primary ' : 'text-foreground '}`}>
                              {moment.title}
                            </p>
                            <p className={`text-[11px] leading-snug ${isSelected ? 'text-muted-foreground ' : 'text-muted-foreground '}`}>
                              {moment.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Sticky Actions */}
                  <div className="delux-wizard-actions sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-3 sm:p-0 sm:pt-4 bg-card/95  backdrop-blur-md border-t border-border  sm:border-0 rounded-b-2xl sm:rounded-none flex justify-between items-center z-20">
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setActiveTab('identification');
                      }}
                      className="h-11 px-4 rounded-xl border border-border  hover:bg-card  text-muted-foreground  text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(2);
                      }}
                      className="h-12 px-6 sm:px-7 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary hover:opacity-95 active:scale-[0.98] text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
                    >
                      <span>Avançar para o Sonho</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* QUIZ ETAPA 2 DE 5: O Grande Sonho ou Objetivo */}
              {quizStep === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent  text-primary  border border-primary/60  text-xs font-semibold">
                      <Target className="w-3.5 h-3.5" />
                      Passo 2 de 5 • Seu Grande Objetivo
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground  mb-1.5">
                    Qual é o sonho ou objetivo a ser desconstruído?
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground  mb-5 leading-relaxed">
                    Escolha uma categoria e personalize com seu objetivo específico. Nós traçaremos as etapas e estações.
                  </p>

                  {/* Category Selection */}
                  <div className="space-y-2 mb-5">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => {
                            playSelectSound();
                            setCategory(cat.id);
                            if (!goalTitle) {
                              setGoalTitle(cat.suggestions[0]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] min-h-[48px] ${
                            isSelected
                              ? 'border-primary  bg-accent/80  shadow-xs ring-1 ring-primary/50 '
                              : 'border-border/90  hover:border-border  bg-card  hover:bg-card/70 '
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-primary  text-primary-foreground shadow-xs' : 'bg-muted  text-muted-foreground '}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-primary ' : 'text-foreground '}`}>
                              {cat.label}
                            </p>
                            <p className={`text-[11px] truncate ${isSelected ? 'text-muted-foreground ' : 'text-muted-foreground '}`}>{cat.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-primary  bg-primary  text-primary-foreground' : 'border-border '
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Goal Input & Suggestions */}
                  <div className="mb-5">
                    <label className="text-xs font-bold text-foreground  block mb-1.5">
                      Descreva seu objetivo (seja o mais específico que desejar):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Abrir e-commerce, correr 42km, aprender programação..."
                      value={goalTitle}
                      onChange={e => setGoalTitle(e.target.value)}
                      className="w-full h-12 px-4 bg-card/70  hover:bg-card  focus:bg-card  border border-border  focus:border-primary  focus:ring-4 focus:ring-primary/10 rounded-2xl text-xs sm:text-sm text-foreground  placeholder-border  focus:outline-none transition-all font-medium mb-2.5"
                    />

                    {/* Quick suggestion chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground  block">Exemplos práticos de caminhos:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {currentCategoryObj.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              playSelectSound();
                              setGoalTitle(sug);
                            }}
                            className="text-[11px] px-3 py-1.5 rounded-xl bg-muted  hover:bg-accent  hover:text-primary  text-muted-foreground  border border-border/60  font-medium transition-colors cursor-pointer text-left active:scale-95"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Sticky Actions */}
                  <div className="delux-wizard-actions sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-3 sm:p-0 sm:pt-4 bg-card/95  backdrop-blur-md border-t border-border  sm:border-0 rounded-b-2xl sm:rounded-none flex justify-between items-center z-20">
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(1);
                      }}
                      className="h-11 px-4 rounded-xl border border-border  hover:bg-card  text-muted-foreground  text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(3);
                      }}
                      className="h-12 px-6 sm:px-7 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary hover:opacity-95 active:scale-[0.98] text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
                    >
                      <span>Definir Ritmo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* QUIZ ETAPA 3 DE 5: Ritmo de Marcha Real */}
              {quizStep === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent  text-primary  border border-primary/60  text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Passo 3 de 5 • Ritmo de Execução
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground  mb-1.5">
                    Qual é o seu ritmo real para avançar no mapa?
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground  mb-5 leading-relaxed">
                    Dividimos cada grande marco em micro-passos proporcionais ao seu tempo, garantindo que você nunca trave.
                  </p>

                  <div className="space-y-5 mb-6">
                    {/* Daily Minutes Selection */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-foreground ">
                          Minutos por dia dedicados ao mapa:
                        </label>
                        <span className="text-xs font-bold text-primary  bg-accent  border border-primary/60  px-2.5 py-0.5 rounded-full">
                          {dailyMinutes} min/dia
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                        {[
                          { min: 15, label: '15 min', tag: 'Micro-passos', desc: 'Rápido & Focado' },
                          { min: 30, label: '30 min', tag: 'Recomendado', desc: 'Ritmo Ideal' },
                          { min: 45, label: '45+ min', tag: 'Aceleração', desc: 'Intensivo' }
                        ].map(m => (
                          <button
                            key={m.min}
                            type="button"
                            onClick={() => {
                              playSelectSound();
                              setDailyMinutes(m.min);
                            }}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                              dailyMinutes === m.min
                                ? 'border-primary  bg-accent/80  shadow-xs ring-1 ring-primary/50 '
                                : 'border-border/90  hover:border-border  bg-card  hover:bg-card/70 '
                            }`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-normal block mb-0.5 ${dailyMinutes === m.min ? 'text-primary ' : 'text-muted-foreground '}`}>
                              {m.tag}
                            </span>
                            <span className={`block text-base sm:text-lg font-black ${dailyMinutes === m.min ? 'text-primary ' : 'text-foreground '}`}>
                              {m.label}
                            </span>
                            <span className={`text-[10px] sm:text-[11px] font-medium mt-0.5 block ${dailyMinutes === m.min ? 'text-muted-foreground ' : 'text-muted-foreground '}`}>{m.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Best Period */}
                    <div>
                      <label className="text-xs font-bold text-foreground  block mb-2">
                        Momento do dia preferido para agir:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'morning', label: 'Manhã', desc: 'Início do dia', icon: Sunrise },
                          { id: 'afternoon', label: 'Tarde', desc: 'Pausa focada', icon: Sun },
                          { id: 'evening', label: 'Noite', desc: 'Período calmo', icon: Moon },
                          { id: 'flexible', label: 'Flexível', desc: 'Livre', icon: RotateCcw }
                        ].map(p => {
                          const Icon = p.icon;
                          const isSelected = preferredTime === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                playSelectSound();
                                setPreferredTime(p.id as any);
                              }}
                              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-95 ${
                                isSelected
                                  ? 'border-primary  bg-accent/80  text-primary  ring-1 ring-primary/50  shadow-xs'
                                  : 'border-border/90  text-foreground  bg-card  hover:border-border  hover:bg-card/70 '
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary  text-primary-foreground' : 'bg-muted  text-muted-foreground '}`}>
                                   <Icon className="w-3.5 h-3.5" />
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-primary  stroke-[3]" />}
                              </div>
                              <div>
                                <span className={`block text-xs font-bold ${isSelected ? 'text-primary ' : 'text-foreground '}`}>{p.label}</span>
                                <span className={`text-[10px] ${isSelected ? 'text-muted-foreground ' : 'text-muted-foreground '}`}>{p.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Days Selection with responsive sizing for 7 days */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-foreground ">
                          Dias na semana para avançar:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={setWeekdays}
                            className="text-[11px] text-primary  hover:underline font-semibold cursor-pointer"
                          >
                            Dias úteis
                          </button>
                          <span className="text-xs text-muted-foreground ">•</span>
                          <button
                            type="button"
                            onClick={setAllDays}
                            className="text-[11px] text-primary  hover:underline font-semibold cursor-pointer"
                          >
                            Todos
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1 justify-between">
                        {DAYS.map(d => {
                          const active = selectedDays.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleDay(d.id)}
                              className={`flex-1 h-11 min-w-[36px] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                active
                                  ? 'bg-gradient-to-r from-primary via-primary to-primary text-primary-foreground shadow-xs'
                                  : 'bg-muted  text-muted-foreground  hover:bg-muted/80 '
                              }`}
                              title={d.full}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Sticky Actions */}
                  <div className="delux-wizard-actions sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-3 sm:p-0 sm:pt-4 bg-card/95  backdrop-blur-md border-t border-border  sm:border-0 rounded-b-2xl sm:rounded-none flex justify-between items-center z-20">
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(2);
                      }}
                      className="h-11 px-4 rounded-xl border border-border  hover:bg-card  text-muted-foreground  text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(4);
                      }}
                      className="h-12 px-6 sm:px-7 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary hover:opacity-95 active:scale-[0.98] text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
                    >
                      <span>Ajustar Detalhe</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* QUIZ ETAPA 4 DE 5: Nível de Detalhe e Profundidade do Mapa */}
              {quizStep === 4 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent  text-primary  border border-primary/60  text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Passo 4 de 5 • Precisão do Mapa
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground  mb-1.5">
                    Como você prefere o nível de detalhe das etapas?
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground  mb-5 leading-relaxed">
                    Defina como o assistente e o planejador devem desdobrar o seu caminho operacional.
                  </p>

                  <div className="space-y-3 mb-6">
                    {STYLES.map(st => {
                      const isSelected = responseStyle === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            playSelectSound();
                            setResponseStyle(st.id as any);
                          }}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer text-left active:scale-[0.99] min-h-[52px] ${
                            isSelected
                              ? 'border-primary  bg-accent/80  shadow-xs ring-1 ring-primary/50 '
                              : 'border-border/90  hover:border-border  bg-card  hover:bg-card/70 '
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-primary ' : 'text-foreground '}`}>
                              {st.title}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-primary  text-primary-foreground' : 'bg-muted  text-muted-foreground '
                            }`}>
                              {st.badge}
                            </span>
                          </div>
                          <p className={`text-[11px] sm:text-xs leading-relaxed ${isSelected ? 'text-muted-foreground ' : 'text-muted-foreground '}`}>
                            {st.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Sticky Actions */}
                  <div className="delux-wizard-actions sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-3 sm:p-0 sm:pt-4 bg-card/95  backdrop-blur-md border-t border-border  sm:border-0 rounded-b-2xl sm:rounded-none flex justify-between items-center z-20">
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(3);
                      }}
                      className="h-11 px-4 rounded-xl border border-border  hover:bg-card  text-muted-foreground  text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(5);
                      }}
                      className="h-12 px-6 sm:px-7 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary hover:opacity-95 active:scale-[0.98] text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
                    >
                      <span>Avançar para Bloqueios</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* QUIZ ETAPA 5 DE 5: Superação de Bloqueios & Obstáculos */}
              {quizStep === 5 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent  text-primary  border border-primary/60  text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Passo 5 de 5 • Remoção de Bloqueios
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground  mb-1.5">
                    Qual atrito mais costuma atrapalhar seus projetos?
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground  mb-5 leading-relaxed">
                    Mapeamos essa barreira com antecedência para que o roteiro já inclua contramedidas práticas.
                  </p>

                  <div className="space-y-2 mb-6">
                    {OBSTACLES.map((obs, idx) => {
                      const isSelected = primaryObstacle === obs;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            playSelectSound();
                            setPrimaryObstacle(obs);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-2xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] min-h-[50px] ${
                            isSelected
                              ? 'border-primary  bg-accent/80  text-primary  font-bold shadow-2xs ring-1 ring-primary/50 '
                              : 'border-border/80  text-foreground  hover:border-border  bg-card  hover:bg-card/70 '
                          }`}
                        >
                          <span className="pr-3 leading-snug">{obs}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary  stroke-[3] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile Sticky Actions */}
                  <div className="delux-wizard-actions sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-3 sm:p-0 sm:pt-4 bg-card/95  backdrop-blur-md border-t border-border  sm:border-0 rounded-b-2xl sm:rounded-none flex justify-between items-center z-20">
                    <button
                      type="button"
                      onClick={() => {
                        playStepSound();
                        setQuizStep(4);
                      }}
                      className="h-11 px-4 rounded-xl border border-border  hover:bg-card  text-muted-foreground  text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>
                    <button
                      type="button"
                      disabled={isFinishing}
                      onClick={handleFinishQuiz}
                      className="h-12 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary hover:opacity-95 active:scale-[0.98] text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
                    >
                      {isFinishing ? (
                        <div className="w-4 h-4 border-2 border-card/20 border-t-card rounded-full animate-spin" />
                      ) : (
                        <Route className="w-4 h-4" />
                      )}
                      <span>Construir Meu Mapa</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center text-[11px] text-muted-foreground  pt-2 pb-1 relative z-10">
        Delux • O Arquiteto de Sonhos em Passos Práticos
      </footer>
    </div>
  );
};
