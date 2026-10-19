export function requestsSavedPlan(message: string) {
  const text = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(nao|sem)\s+(criar|salvar|registrar|montar)\b/.test(text)) return false;
  return /\b(crie|cria|criar|monte|monta|montar|faca|faz|fazer|planeje|planeja|planejar|organize|organiza|organizar|estruture|estrutura|estruturar|gere|gera|gerar|prepare|prepara|preparar|quero|preciso)\b.{0,70}\b(plano|planejamento|cronograma|rotina|agenda|missoes?|tarefas)\b/.test(text)
    || /\b(organize|organiza|organizar|planeje|planeja|planejar)\b.{0,30}\b(minha semana|meu dia)\b/.test(text);
}