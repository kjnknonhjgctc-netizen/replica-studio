export type LocalPlan = {
  goal_title: string;
  goal_description: string;
  category: string;
  desired_outcome: string;
  current_state: string;
  steps: { title: string; description: string; success_criteria: string }[];
  missions: { title: string; instructions: string; estimated_minutes: number; priority: 'high' | 'medium' | 'low'; day_offset: number; scheduled_time: string; step_index: number }[];
};

function categoryFor(text: string): string {
  const value = text.toLocaleLowerCase('pt-BR');
  if (/corr(er|ida)|academia|muscula|sa[uú]de|peso|dieta|exerc[ií]cio|medita/.test(value)) return 'health';
  if (/dinheiro|econom|guardar|poupar|invest|d[ií]vida|finance/.test(value)) return 'finance';
  if (/emprego|carreira|trabalho|neg[oó]cio|empresa|empreender|promo[cç][aã]o/.test(value)) return 'career';
  if (/organiza|casa|rotina|planej/.test(value)) return 'organization';
  if (/estudar|aprender|idioma|ingl[eê]s|viol[aã]o|programa[cç][aã]o|ler|curso|prova/.test(value)) return 'learning';
  return 'personal_dev';
}

function cleanGoalTitle(input: string): string {
  let title = input.trim()
    .replace(/^(por favor[, ]*)?(eu quero|quero|gostaria de|me ajuda a|ajude-me a|preciso|quero muito|meu sonho [eé]?)\s+/i, '')
    .replace(/^(criar|montar|fazer|construir|alcan[cç]ar|come[cç]ar a)\s+/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  if (!title) title = input.trim();
  return title.charAt(0).toLocaleUpperCase('pt-BR') + title.slice(1);
}

export function buildLocalPlan(input: { title: string; current_state?: string; desired_outcome?: string; available_minutes?: number }): LocalPlan {
  const rawTitle = input.title.trim();
  if (!rawTitle) throw new Error('Escreva o objetivo que deseja alcançar.');
  const title = cleanGoalTitle(rawTitle).slice(0, 120);
  const category = categoryFor(rawTitle + ' ' + (input.desired_outcome || ''));
  const minutes = Math.max(5, Math.min(180, Number(input.available_minutes) || 30));
  const steps = [
    { title: 'Preparar a base', description: 'Defina o ponto de partida, reúna os recursos necessários e torne fácil começar.', success_criteria: 'Ter um primeiro passo claro, materiais preparados e uma rotina possível.' },
    { title: 'Praticar e ganhar consistência', description: 'Trabalhe em pequenas sessões regulares e aumente a dificuldade gradualmente conforme o progresso.', success_criteria: 'Concluir pelo menos 4 sessões e registrar o que aprendeu ou avançou.' },
    { title: 'Aplicar e avaliar o resultado', description: 'Use o que praticou em uma situação real, avalie o resultado e escolha o próximo marco.', success_criteria: 'Produzir uma evidência concreta de progresso e definir a próxima etapa.' },
  ];
  const tasks = [
    ['Definir o resultado e o primeiro passo', 'Escreva como será o sucesso e escolha uma ação que possa iniciar hoje.', 0],
    ['Preparar o ambiente e os recursos', 'Separe materiais, ferramentas e um local para reduzir o atrito de começar.', 0],
    ['Fazer a primeira sessão prática', 'Execute uma sessão curta focada no fundamento mais importante para seu objetivo.', 1],
    ['Repetir e registrar o progresso', 'Pratique novamente e anote o que ficou mais fácil e o que ainda exige atenção.', 1],
    ['Aplicar o que aprendeu', 'Faça uma pequena aplicação real e registre o resultado observado.', 2],
    ['Revisar e planejar o próximo marco', 'Revise o progresso, identifique o principal obstáculo e escolha a próxima ação.', 2],
  ] as const;
  return {
    goal_title: title,
    goal_description: 'Plano progressivo criado pelo Método Delux. Comece com ações pequenas, acompanhe evidências reais e ajuste o ritmo conforme sua rotina.',
    category,
    desired_outcome: input.desired_outcome?.trim() || 'Avançar de forma consistente em: ' + title,
    current_state: input.current_state?.trim() || 'Ponto de partida ainda não detalhado; comece pelo nível atual e ajuste após a primeira semana.',
    steps,
    missions: tasks.map(([taskTitle, instructions, step_index], i) => ({
      title: taskTitle,
      instructions: instructions + ' Objetivo: ' + title + '.',
      estimated_minutes: Math.min(minutes, i < 2 ? Math.min(15, minutes) : minutes),
      priority: i === 0 ? 'high' : i === 5 ? 'medium' : 'medium',
      day_offset: i,
      scheduled_time: '09:00',
      step_index,
    })),
  };
}

export function localAssistantReply(message: string, goals: any[] = [], missions: any[] = []): string {
  const text = message.toLocaleLowerCase('pt-BR');
  const pending = missions.filter((m) => ['pending', 'in_progress', 'postponed'].includes(m.status));
  const done = missions.filter((m) => m.status === 'completed');
  if (/\b(hoje|prioridade|priorizar|agora)\b/.test(text)) {
    const next = pending[0];
    return next
      ? 'Vamos manter o foco em uma ação de cada vez.\n\n**Próximo passo:** ' + next.title + '\n' + (next.instructions || 'Faça o primeiro passo possível.') + '\n\nReserve ' + (next.estimated_minutes || 15) + ' minutos e, ao terminar, marque a missão como concluída no Delux.'
      : 'Não encontrei missões pendentes no seu contexto atual. Abra Planejamento para organizar a próxima ação ou crie um objetivo para começar.';
  }
  if (/\b(progresso|evolu[cç][aã]o|como estou|resultado)\b/.test(text)) {
    return 'Seu progresso deve ser medido por ações e evidências, não só por dias perfeitos.\n\nVocê tem ' + goals.length + ' objetivo(s), ' + done.length + ' missão(ões) concluída(s) e ' + pending.length + ' pendente(s). Revise o que avançou, o que travou e escolha um ajuste pequeno para a próxima sessão.';
  }
  if (/\b(desist|falh|atras|perdi|procrastin|desmotiva|cansad)\w*/.test(text)) {
    return 'Você não precisa compensar tudo de uma vez. Retome com uma versão menor da tarefa: faça apenas 5 minutos, registre o que conseguiu e reorganize o restante nos dias disponíveis. Um plano bom se adapta à vida real — não transforma um dia difícil em fracasso.';
  }
  if (/\b(objetiv|meta|sonho|plano|come[cç]ar)\b/.test(text)) {
    return 'Vamos transformar isso em uma próxima ação concreta. Defina: **1)** o resultado que quer alcançar; **2)** como saberá que conseguiu; **3)** quanto tempo pode dedicar por dia; **4)** quais dias estão disponíveis. Você também pode criar o objetivo em Objetivos: o Delux gera uma rota inicial e distribui as missões conforme sua disponibilidade.';
  }
  return 'Posso ajudar com orientação estruturada, mesmo sem IA generativa. Posso indicar como priorizar, retomar após um atraso e revisar seu progresso com base nos dados do Delux. Para transformar um sonho em um plano salvo, diga “criar um plano para…” ou use a área Objetivos.';
}
