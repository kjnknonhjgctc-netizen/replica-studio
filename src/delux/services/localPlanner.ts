export type LocalPlan = {
  goal_title: string;
  goal_description: string;
  category: string;
  desired_outcome: string;
  current_state: string;
  steps: { title: string; description: string; success_criteria: string }[];
  missions: { title: string; instructions: string; estimated_minutes: number; priority: 'high' | 'medium' | 'low'; day_offset: number; scheduled_time?: string; step_index: number }[];
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

export function buildLocalPlan(input: { title: string; current_state?: string | undefined; desired_outcome?: string | undefined; available_minutes?: number | undefined }): LocalPlan {
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
  const genericTasks: readonly (readonly [string, string, number])[] = [
    ['Definir o resultado e o primeiro passo', 'Escreva como será o sucesso e escolha uma ação que possa iniciar hoje.', 0],
    ['Preparar o ambiente e os recursos', 'Separe materiais, ferramentas e um local para reduzir o atrito de começar.', 0],
    ['Fazer a primeira sessão prática', 'Execute uma sessão curta focada no fundamento mais importante para seu objetivo.', 1],
    ['Repetir e registrar o progresso', 'Pratique novamente e anote o que ficou mais fácil e o que ainda exige atenção.', 1],
    ['Aplicar o que aprendeu', 'Faça uma pequena aplicação real e registre o resultado observado.', 2],
    ['Revisar e planejar o próximo marco', 'Revise o progresso, identifique o principal obstáculo e escolha a próxima ação.', 2],
  ];
  const categoryTasks: Record<string, readonly (readonly [string, string, number])[]> = {
    learning: [
      ['Definir o nível inicial e o material', 'Escolha um recurso adequado ao seu nível e identifique o primeiro fundamento a aprender.', 0],
      ['Preparar uma rotina curta de estudo', 'Deixe o material pronto e escolha uma sessão que caiba no tempo disponível.', 0],
      ['Praticar um fundamento essencial', 'Estude um único conceito ou habilidade e pratique ativamente, em vez de apenas consumir conteúdo.', 1],
      ['Revisar sem consultar o material', 'Tente explicar ou demonstrar o que aprendeu e anote as dúvidas que restaram.', 1],
      ['Aplicar a habilidade em um exercício real', 'Resolva um exercício, crie algo pequeno ou use a habilidade em uma situação prática.', 2],
      ['Avaliar e escolher o próximo conteúdo', 'Registre uma evidência do que já consegue fazer e selecione o próximo desafio.', 2],
    ],
    health: [
      ['Definir um ponto de partida seguro', 'Registre sua condição atual e escolha uma meta gradual e realista, respeitando seus limites.', 0],
      ['Preparar a rotina e o ambiente', 'Separe o que precisa e escolha uma versão simples da atividade para facilitar o começo.', 0],
      ['Realizar a primeira sessão leve', 'Faça uma sessão compatível com sua condição atual, sem tentar compensar tudo de uma vez.', 1],
      ['Repetir e registrar como se sentiu', 'Observe energia, esforço e recuperação para ajustar a intensidade com responsabilidade.', 1],
      ['Manter a prática em uma situação real', 'Repita a atividade em condições normais e priorize consistência em vez de intensidade.', 2],
      ['Revisar a rotina e ajustar a carga', 'Veja o que foi sustentável e ajuste a próxima semana; procure orientação profissional quando necessário.', 2],
    ],
    career: [
      ['Definir o resultado profissional desejado', 'Especifique o cargo, projeto ou competência que quer alcançar e como avaliará o progresso.', 0],
      ['Mapear requisitos e recursos', 'Liste as competências exigidas, o que já possui e as lacunas prioritárias.', 0],
      ['Trabalhar na competência prioritária', 'Reserve uma sessão para estudar ou praticar a habilidade mais importante para o objetivo.', 1],
      ['Produzir uma evidência de capacidade', 'Crie uma pequena entrega, projeto, estudo de caso ou registro concreto da sua evolução.', 1],
      ['Buscar feedback ou uma oportunidade', 'Apresente seu trabalho a alguém confiável ou dê um passo real em direção à oportunidade.', 2],
      ['Revisar lacunas e definir a próxima ação', 'Compare os requisitos com suas evidências e escolha a próxima melhoria de maior impacto.', 2],
    ],
    finance: [
      ['Registrar a situação financeira atual', 'Anote valores relevantes e defina um objetivo mensurável sem assumir riscos desnecessários.', 0],
      ['Organizar receitas, gastos e prazos', 'Reúna os dados essenciais e identifique gastos ou compromissos que merecem atenção.', 0],
      ['Escolher uma ação financeira viável', 'Defina uma ação prudente, como revisar uma despesa ou automatizar uma pequena reserva.', 1],
      ['Registrar a ação e seu efeito', 'Atualize os números e observe o impacto real sem depender de estimativas otimistas.', 1],
      ['Revisar o resultado da semana', 'Compare o resultado com a meta e identifique o que está sob seu controle.', 2],
      ['Ajustar o próximo passo', 'Atualize o plano com base nos números reais; busque aconselhamento qualificado para decisões complexas.', 2],
    ],
    organization: [
      ['Escolher uma área prioritária', 'Defina um espaço, rotina ou processo específico para melhorar, sem tentar reorganizar tudo.', 0],
      ['Listar pendências e preparar materiais', 'Reúna o que precisa ser resolvido e deixe os materiais necessários à mão.', 0],
      ['Resolver a primeira pequena pendência', 'Trabalhe em uma única tarefa concreta durante uma sessão curta.', 1],
      ['Criar um sistema simples de manutenção', 'Defina um gatilho ou horário recorrente para manter o avanço sem depender da memória.', 1],
      ['Testar o sistema na rotina real', 'Use o processo em um dia normal e observe onde ainda existe atrito.', 2],
      ['Revisar e simplificar', 'Mantenha o que ajudou, retire etapas desnecessárias e escolha a próxima melhoria.', 2],
    ],
  };
  const tasks = categoryTasks[category] || genericTasks;
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
      step_index,
    })),
  };
}

export type AssistantActionKind = 'rebalance' | 'complete_next' | 'postpone_next' | null;

export function resolveAssistantAction(message: string): AssistantActionKind {
  const t = message.toLocaleLowerCase('pt-BR');
  if (/(reorganiz|redistribu|rebalance)/.test(t)) return 'rebalance';
  if (/(conclu[ií]|terminei|finalizei|marque|marcar).*(pr[oó]xima|miss[aã]o|tarefa)/.test(t)) return 'complete_next';
  if (/(adi[ae]r?|adie|adiar|empurr).*(pr[oó]xima|miss[aã]o|tarefa)/.test(t)) return 'postpone_next';
  return null;
}

export function localAssistantReply(message: string, goals: any[] = [], missions: any[] = [], _today?: string): string {
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
