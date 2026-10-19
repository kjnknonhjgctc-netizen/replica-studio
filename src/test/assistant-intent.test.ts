import { describe, expect, it } from 'vitest';
import { requestsSavedPlan } from '../delux/ai/intent';

describe('Assistant action intent', () => {
  it('answers a question without creating goals or tasks', () => {
    expect(requestsSavedPlan('Tenho uma dúvida de matemática: preciso economizar R$ 1200 em 8 semanas. Quanto por semana?')).toBe(false);
  });
  it('recognizes an explicit plan creation request', () => {
    expect(requestsSavedPlan('Crie um plano de estudos para aprender inglês')).toBe(true);
  });
  it('respects a request not to save or create a plan', () => {
    expect(requestsSavedPlan('Quero entender um plano, sem criar tarefas')).toBe(false);
  });
});