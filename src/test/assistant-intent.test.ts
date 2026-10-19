import { describe, expect, it } from 'vitest';
import { requestsSavedPlan, resolveNavigationIntent } from '../delux/ai/intent';

describe('Assistant action intent', () => {
  it('answers a question without creating goals or tasks', () => {
    expect(requestsSavedPlan('Tenho uma dúvida de matemática: preciso economizar R$ 1200 em 8 semanas. Quanto por semana?')).toBe(false);
  });
  it('recognizes an explicit plan creation request', () => {
    expect(requestsSavedPlan('Crie um plano de estudos para aprender inglês')).toBe(true);
    expect(requestsSavedPlan('Quero um plano de estudos')).toBe(true);
    expect(requestsSavedPlan('Preciso de um plano para economizar')).toBe(true);
    expect(requestsSavedPlan('Quero entender um plano de estudos')).toBe(false);
    expect(requestsSavedPlan('Não quero que você crie um plano')).toBe(false);
    expect(requestsSavedPlan('Não quero um plano agora')).toBe(false);
  });
  it('does not navigate when the user explicitly says not to', () => {
    expect(resolveNavigationIntent('Não quero acessar o planejamento')).toBeNull();
    expect(resolveNavigationIntent('Não quero que você abra o planejamento')).toBeNull();
    expect(resolveNavigationIntent('Abra o planejamento')).toEqual({
      type: 'navigate',
      path: '/app/planejamento',
      label: 'Planejamento',
    });
  });

  it('respects a request not to save or create a plan', () => {
    expect(requestsSavedPlan('Quero entender um plano, sem criar tarefas')).toBe(false);
    expect(requestsSavedPlan('Não quero criar tarefas, só entender como funciona')).toBe(false);
    expect(requestsSavedPlan('Não crie um plano, só me explique')).toBe(false);
    expect(requestsSavedPlan('Não precisa montar um cronograma agora')).toBe(false);
  });
});