// @ts-nocheck -- ported as-is from the original project
import React, { useState } from 'react';
import { useNavigate } from '@/delux/router';
import { api } from '../../services/api';
import { GoalCategory, GoalPriority } from '../../types';
import { PageHeader } from '../../components/common/CommonComponents';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { categoryIcons, categoryLabels } from '../../components/cards/Cards';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const NewGoalPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('learning');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [whatHasBeenTried, setWhatHasBeenTried] = useState('');
  const [obstaclesInput, setObstaclesInput] = useState('');
  const [resourcesInput, setResourcesInput] = useState('');
  const [constraints, setConstraints] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [priority, setPriority] = useState<GoalPriority>('high');

  // Generated steps & missions
  const [steps, setSteps] = useState<any[]>([
    {
      title: 'Etapa 1: Fundação & Hábito Inicial',
      description: 'Estabelecer rotina inicial e eliminar principais barreiras.',
      success_criteria: 'Completar 7 dias de prática sem interrupção.'
    },
    {
      title: 'Etapa 2: Aprofundamento Prático',
      description: 'Desenvolver a habilidade com exercícios deliberados.',
      success_criteria: 'Superar o nível básico e registrar primeiras vitórias.'
    },
    {
      title: 'Etapa 3: Domínio e Aplicação',
      description: 'Executar projetos reais ou situações reais de aplicação.',
      success_criteria: 'Atingir o resultado esperado com consistência.'
    }
  ]);

  const [missions, setMissions] = useState<any[]>([
    {
      title: 'Configurar espaço e materiais necessários',
      instructions: 'Deixar tudo preparado e sem atrito para a prática.',
      estimated_minutes: 20,
      priority: 'high'
    },
    {
      title: 'Primeira sessão focada de prática deliberada',
      instructions: 'Realizar o primeiro bloco completo no horário programado.',
      estimated_minutes: 30,
      priority: 'high'
    }
  ]);

  const handleStepAContinue = () => {
    if (!title.trim()) return;
    setStep('B');
  };

  const handleRunAIDiagnostic = async () => {
    setGeneratingAI(true);
    try {
      const result = await api.generatePlan({
        title,
        current_state: currentState || whatHasBeenTried,
        desired_outcome: desiredOutcome,
        available_minutes: dailyMinutes
      });
      if (result.steps && result.steps.length > 0) setSteps(result.steps);
      if (result.missions && result.missions.length > 0) setMissions(result.missions);
    } catch (err) {
      console.warn('Fallback to standard plan:', err);
    } finally {
      setGeneratingAI(false);
      setStep('F');
    }
  };

  const handleSaveGoal = async () => {
    setLoading(true);
    try {
      const obstacles = obstaclesInput
        .split('\n')
        .map(o => o.trim())
        .filter(Boolean);

      const resources = resourcesInput
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const res = await api.createGoal({
        title,
        description,
        category,
        desired_outcome: desiredOutcome || title,
        current_state: currentState,
        target_date: targetDate || undefined,
        priority,
        diagnostic: {
          current_situation: currentState,
          obstacles: obstacles.length > 0 ? obstacles : ['Manter constância diária'],
          available_resources: resources.length > 0 ? resources : [`${dailyMinutes} minutos/dia`],
          constraints
        },
        steps,
        missions: missions.map(m => ({
          ...m,
          scheduled_date: new Date().toISOString().split('T')[0]
        }))
      });

      navigate(`/app/objetivos/${res.goal.id}`);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar objetivo.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndicators = [
    { key: 'A', label: '1. Objetivo' },
    { key: 'B', label: '2. Resultado' },
    { key: 'C', label: '3. Contexto' },
    { key: 'D', label: '4. Obstáculos' },
    { key: 'E', label: '5. Rotina' },
    { key: 'F', label: '6. Diagnóstico & Plano' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Mapear Novo Sonho ou Objetivo"
        subtitle="Transforme qualquer meta ou sonho em um mapa de estações e passos práticos no mínimo detalhe."
        backAction={() => navigate('/app/objetivos')}
      />

      {/* Wizard Progress Stepper */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 border-b border-border ">
        {stepIndicators.map((s, idx) => (
          <div
            key={s.key}
            className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap py-1 px-2.5 rounded-lg transition-all ${
              step === s.key
                ? 'text-primary  bg-gradient-to-r from-primary/12 to-primary/12 border border-primary/30 font-bold'
                : 'text-muted-foreground '
            }`}
          >
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Container Card */}
      <div className="delux-section bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs transition-colors">
        {/* ETAPA A: DEFINIR O OBJETIVO */}
        {step === 'A' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground ">Etapa A: Definir o Objetivo</h2>
              <p className="text-xs text-muted-foreground  mt-1">
                Dê um título direto para a jornada que você deseja iniciar.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Título do objetivo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conversação Fluente em Inglês"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-card  border border-border  focus:border-primary rounded-xl text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Categoria
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(categoryLabels) as GoalCategory[]).map(catKey => {
                    const isSelected = category === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-accent  text-primary  font-semibold'
                            : 'border-border  text-muted-foreground  hover:border-border  bg-card '
                        }`}
                      >
                        {categoryIcons[catKey]}
                        <span className="truncate">{categoryLabels[catKey]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Breve descrição contextual (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Desenvolver habilidade para interagir em reuniões e viagens internacionais com naturalidade."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none resize-none transition-colors"
                />
              </div>
            </div>

            <div className="delux-wizard-actions flex justify-end pt-4 border-t border-border ">
              <PrimaryButton
                size="md"
                disabled={!title.trim()}
                onClick={handleStepAContinue}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Avançar: Resultado Desejado
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ETAPA B: RESULTADO DESEJADO */}
        {step === 'B' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground ">Etapa B: Resultado Desejado</h2>
              <p className="text-xs text-muted-foreground  mt-1">
                Como você vai medir se atingiu o sucesso? Metas claras facilitam missões diárias.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Resultado tangível almejado
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Conduzir uma reunião de 30 minutos em inglês com clientes sem usar tradutor ou hesitar."
                  value={desiredOutcome}
                  onChange={e => setDesiredOutcome(e.target.value)}
                  className="w-full p-3 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none resize-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Prazo estimado (opcional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full h-11 px-3.5 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="delux-wizard-actions flex justify-between items-center pt-4 border-t border-border ">
              <SecondaryButton size="sm" onClick={() => setStep('A')}>
                Voltar
              </SecondaryButton>
              <PrimaryButton size="md" onClick={() => setStep('C')}>
                Avançar: Contexto Atual
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ETAPA C: CONTEXTO ATUAL */}
        {step === 'C' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground ">Etapa C: Contexto Atual</h2>
              <p className="text-xs text-muted-foreground  mt-1">
                Entender seu ponto de partida evita planos excessivamente teóricos ou difíceis.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Qual é o seu nível atual nessa área?
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Leio textos razoavelmente bem, mas quase nunca tive oportunidade de falar com nativos."
                  value={currentState}
                  onChange={e => setCurrentState(e.target.value)}
                  className="w-full p-3 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none resize-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  O que você já tentou antes para alcançar essa meta?
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Aplicativos de gamificação como Duolingo e livros de gramática por 2 meses, mas parei por falta de aplicação prática."
                  value={whatHasBeenTried}
                  onChange={e => setWhatHasBeenTried(e.target.value)}
                  className="w-full p-3 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none resize-none transition-colors"
                />
              </div>
            </div>

            <div className="delux-wizard-actions flex justify-between items-center pt-4 border-t border-border ">
              <SecondaryButton size="sm" onClick={() => setStep('B')}>
                Voltar
              </SecondaryButton>
              <PrimaryButton size="md" onClick={() => setStep('D')}>
                Avançar: Dificuldades
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ETAPA D: DIFICULDADES E LIMITAÇÕES */}
        {step === 'D' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground ">Etapa D: Obstáculos e Recursos</h2>
              <p className="text-xs text-muted-foreground  mt-1">
                Identificar os atritos com antecedência é o segredo para manter a disciplina.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Quais obstáculos mais atrapalham sua consistência? (um por linha)
                </label>
                <textarea
                  rows={3}
                  placeholder="Cansaço mental ao final do dia&#10;Falta de um método claro&#10;Insegurança com pronúncia"
                  value={obstaclesInput}
                  onChange={e => setObstaclesInput(e.target.value)}
                  className="w-full p-3 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none resize-none font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Quais recursos você já tem disponíveis?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fone com cancelamento de ruído, 45 min livres pela manhã"
                  value={resourcesInput}
                  onChange={e => setResourcesInput(e.target.value)}
                  className="w-full h-11 px-3.5 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground  block mb-1">
                  Restrições importantes de horário ou energia
                </label>
                <input
                  type="text"
                  placeholder="Ex: Finais de semana dedicados à família"
                  value={constraints}
                  onChange={e => setConstraints(e.target.value)}
                  className="w-full h-11 px-3.5 bg-card  border border-border  focus:border-primary rounded-xl text-xs sm:text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="delux-wizard-actions flex justify-between items-center pt-4 border-t border-border ">
              <SecondaryButton size="sm" onClick={() => setStep('C')}>
                Voltar
              </SecondaryButton>
              <PrimaryButton size="md" onClick={() => setStep('E')}>
                Avançar: Disponibilidade
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ETAPA E: DISPONIBILIDADE E PRIORIDADE */}
        {step === 'E' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground ">Etapa E: Disponibilidade e Prioridade</h2>
              <p className="text-xs text-muted-foreground  mt-1">
                Ajuste o ritmo do plano para encaixar perfeitamente na sua rotina real.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-foreground ">
                    Tempo diário dedicado a este objetivo:
                  </label>
                  <span className="text-sm font-bold text-primary ">{dailyMinutes} min</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={dailyMinutes}
                  onChange={e => setDailyMinutes(parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground  block mb-2">
                  Nível de Prioridade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'low', label: 'Secundária' },
                    { id: 'medium', label: 'Equilibrada' },
                    { id: 'high', label: 'Prioridade Alta' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as any)}
                      className={`h-10 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        priority === p.id
                          ? 'border-primary bg-accent  text-primary '
                          : 'border-border  text-muted-foreground  hover:border-border  bg-card '
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="delux-wizard-actions flex justify-between items-center pt-4 border-t border-border ">
              <SecondaryButton size="sm" onClick={() => setStep('D')}>
                Voltar
              </SecondaryButton>
              <PrimaryButton
                size="md"
                loading={generatingAI}
                onClick={handleRunAIDiagnostic}
                icon={<Sparkles className="w-4 h-4 text-primary-foreground" />}
              >
                Gerar Diagnóstico & Plano
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ETAPA F: REVISÃO E PLANO DE AÇÃO */}
        {step === 'F' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground ">Etapa F: Plano de Ação Estruturado</h2>
                <p className="text-xs text-muted-foreground  mt-1">
                  Revise as etapas e primeiras missões sugeridas. Você poderá ajustá-las a qualquer momento.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-accent  text-primary  font-bold rounded-full">
                Diagnóstico Concluído
              </span>
            </div>

            {/* Stages / Steps */}
            <div>
              <span className="text-xs font-bold uppercase tracking-normal text-muted-foreground  block mb-2.5">
                Etapas do Plano
              </span>
              <div className="space-y-2.5">
                {steps.map((st, idx) => (
                  <div key={idx} className="p-3.5 bg-card  border border-border  rounded-2xl text-left">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-foreground ">{st.title}</span>
                      <span className="text-[10px] text-muted-foreground  font-semibold">Ordem {idx + 1}</span>
                    </div>
                    <p className="text-xs text-muted-foreground  mt-1">{st.description}</p>
                    {st.success_criteria && (
                      <p className="text-[11px] text-success  font-medium mt-1">
                        Critério: {st.success_criteria}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Initial Missions */}
            <div>
              <span className="text-xs font-bold uppercase tracking-normal text-muted-foreground  block mb-2.5">
                Primeiras Missões Práticas
              </span>
              <div className="space-y-2">
                {missions.map((m, idx) => (
                  <div key={idx} className="p-3 bg-card  border border-border  rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground ">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground ">{m.instructions}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary  shrink-0 ml-3">
                      {m.estimated_minutes} min
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="delux-wizard-actions flex justify-between items-center pt-4 border-t border-border ">
              <SecondaryButton size="sm" onClick={() => setStep('E')}>
                Voltar
              </SecondaryButton>
              <PrimaryButton
                size="md"
                loading={loading}
                onClick={handleSaveGoal}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Salvar e Iniciar Objetivo
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
