export function requestsSavedPlan(message: string) {
  const text = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(?:nao|nunca)\s+(?:(?:quero|preciso|vou|precisa|deve|deveria|pode|poderia)\s+(?:que\s+(?:voce\s+)?)?)?(?:crie|criar|cria|salve|salvar|salva|registre|registrar|registra|monte|montar|monta|gere|gerar|gera|faca|fazer|planeje|planejar|organize|organizar|execute|executar)\b/.test(text)) return false;
  if (/\b(?:nao|nunca)\s+(?:quero|preciso)\s+(?:de\s+)?(?:um|uma|meu|minha)\s+(?:plano|planejamento|cronograma|rotina|agenda|missoes?|tarefas)\b/.test(text)) return false;
  if (/\bsem\s+(?:criar|salvar|registrar|montar|gerar|fazer|planejar|organizar)\b/.test(text)) return false;
  return /\b(crie|cria|criar|monte|monta|montar|faca|faz|fazer|planeje|planeja|planejar|organize|organiza|organizar|estruture|estrutura|estruturar|gere|gera|gerar|prepare|prepara|preparar)\b.{0,70}\b(plano|planejamento|cronograma|rotina|agenda|missoes?|tarefas)\b/.test(text)
    || /\b(?:quero|preciso)\s+(?:de\s+)?(?:um|uma|minha|meu)\s+(?:plano|planejamento|cronograma|rotina|agenda|missoes?|tarefas)\b/.test(text)
    || /\b(?:organize|organiza|organizar|planeje|planeja|planejar)\b.{0,30}\b(minha semana|meu dia)\b/.test(text);
}

/**
 * Resolve explicit requests to navigate the Delux UI.
 * Keep this deterministic: navigation should not depend on the language model guessing.
 */
export function resolveNavigationIntent(message: string): { type: 'navigate'; path: string; label: string } | null {
  const text = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (/\b(?:nao|nunca)\s+(?:(?:quero|preciso|vou|deve|deveria|pode|poderia)\s+(?:que\s+(?:voce\s+)?)?)?(?:abre|abrir|abra|mostra|mostrar|vai|ir|va|acessa|acessar|entrar|navega|navegar|leva|levar|volta|voltar|manda|muda|mudar|troca|trocar|coloca|colocar)\b/.test(text)) return null;
  const asksToNavigate = /\b(abre|abrir|abra|mostra|mostrar|vai|ir|va|acessa|acessar|entrar|navega|navegar|leva|levar|volta|voltar|manda|muda|mudar|troca|trocar|coloca|colocar|quero ver|quero acessar|me leva|me manda|me coloca)\b/.test(text);
  if (!asksToNavigate) return null;

  if (/\b(assinatura|premium|mensalidade|pagamento|cobranca|plano pago|meu plano atual)\b/.test(text)) {
    return { type: 'navigate', path: '/assinatura', label: 'Assinatura e plano Premium' };
  }
  if (/\b(novo objetivo|nova meta|criar objetivo|criar meta)\b/.test(text)) {
    return { type: 'navigate', path: '/app/objetivos/novo', label: 'Novo objetivo' };
  }
  if (/\b(planejamento|planos?|agenda|cronograma|tarefas|missoes?)\b/.test(text)) {
    return { type: 'navigate', path: '/app/planejamento', label: 'Planejamento' };
  }
  if (/\b(objetivos|metas|mapas)\b/.test(text)) {
    return { type: 'navigate', path: '/app/objetivos', label: 'Objetivos' };
  }
  if (/\b(perfil|rotina|preferencias|configuracoes|conta)\b/.test(text)) {
    return { type: 'navigate', path: '/app/perfil', label: 'Perfil e rotina' };
  }
  if (/\b(inicio|home|pagina inicial|dashboard)\b/.test(text)) {
    return { type: 'navigate', path: '/app/inicio', label: 'Início' };
  }
  if (/\b(assistente|chat)\b/.test(text)) {
    return { type: 'navigate', path: '/app/assistente', label: 'Assistente' };
  }
  return null;
}


const WEEKDAY_ALIASES: Record<string, string[]> = {
  dom: ['domingo', 'dom'],
  seg: ['segunda-feira', 'segunda', 'seg'],
  ter: ['terca-feira', 'terca', 'ter'],
  qua: ['quarta-feira', 'quarta', 'qua'],
  qui: ['quinta-feira', 'quinta', 'qui'],
  sex: ['sexta-feira', 'sexta', 'sex'],
  sab: ['sabado', 'sab'],
};

const WEEKDAY_ORDER = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function normalizeDayText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function dayPattern() {
  return '(domingo|dom|segunda-feira|segunda|seg|terca-feira|terca|ter|quarta-feira|quarta|qua|quinta-feira|quinta|qui|sexta-feira|sexta|sex|sabado|sab)';
}

function canonicalDay(value: string | undefined) {
  const normalized = normalizeDayText(value ?? '');
  return WEEKDAY_ORDER.find((key) => WEEKDAY_ALIASES[key]?.includes(normalized)) || null;
}

/**
 * Resolve explicit weekday constraints from a plan request.
 * Ranges such as "segunda a quinta" override the default preference list;
 * explicit exclusions such as "não sexta" are then removed.
 */
export function resolvePreferredDaysFromRequest(message: string, preferredDays: string[] = ['seg', 'ter', 'qua', 'qui', 'sex']): string[] {
  const text = normalizeDayText(message);
  const range = new RegExp('(?:de\\s+)?' + dayPattern() + '\\s+(?:a|ate|para)\\s+' + dayPattern()).exec(text);
  let days: string[];

  if (range) {
    const start = canonicalDay(range[1]);
    const end = canonicalDay(range[2]);
    const startIndex = WEEKDAY_ORDER.indexOf(start || '');
    const endIndex = WEEKDAY_ORDER.indexOf(end || '');
    days = [];
    if (startIndex >= 0 && endIndex >= 0) {
      for (let i = startIndex, count = 0; count < WEEKDAY_ORDER.length; count++, i = (i + 1) % WEEKDAY_ORDER.length) {
        const day = WEEKDAY_ORDER[i];
        if (!day) break;
        days.push(day);
        if (i === endIndex) break;
      }
    }
  } else {
    const mentions = [...text.matchAll(new RegExp('\\b' + dayPattern() + '\\b', 'g'))];
    const excluded = new Set<string>();
    const positive: string[] = [];
    for (const match of mentions) {
      const day = canonicalDay(match[1]);
      if (!day) continue;
      const prefix = text.slice(Math.max(0, (match.index || 0) - 32), match.index || 0);
      if (/(?:nao|sem|exceto|menos|evitar|excluir|fora de|nao incluir|nao quero|nao posso)\s+(?:(?:a|o|os|as)\s+)?$/.test(prefix)) excluded.add(day);
      else positive.push(day);
    }
    days = positive.length ? [...new Set(positive)] : [...preferredDays];
  }

  const excluded = new Set<string>();
  for (const match of text.matchAll(new RegExp('(?:nao|sem|exceto|menos|evitar|excluir|fora de|nao incluir|nao quero|nao posso)\\s+(?:(?:a|o|os|as)\\s+)?' + dayPattern(), 'g'))) {
    const day = canonicalDay(match[1]);
    if (day) excluded.add(day);
  }

  const result = days.filter((day) => !excluded.has(day) && WEEKDAY_ORDER.includes(day));
  return [...new Set(result)];
}
