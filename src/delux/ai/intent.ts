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
