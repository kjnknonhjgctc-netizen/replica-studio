import { describe, expect, it } from 'vitest';
import { buildLocalPlan, localAssistantReply, resolveAssistantAction } from '../delux/services/localPlanner';

describe('local planning without generative AI', () => {
  it('turns a natural-language request into the actual goal rather than keeping the command text', () => {
    expect(buildLocalPlan({ title: 'Quero criar um plano para aprender violão' }).goal_title).toBe('Aprender violão');
    expect(buildLocalPlan({ title: 'Crie um plano de estudos para aprender inglês' }).goal_title).toBe('Aprender inglês');
  });

  it('creates actionable missions that fit the configured daily time limit', () => {
    const plan = buildLocalPlan({ title: 'Aprender inglês', available_minutes: 20 });
    expect(plan.steps).toHaveLength(3);
    expect(plan.missions).toHaveLength(6);
    expect(plan.missions.every((mission) => mission.estimated_minutes <= 20)).toBe(true);
    expect(plan.missions.every((mission) => mission.title.trim().length > 0 && mission.instructions.includes('Aprender inglês'))).toBe(true);
  });

  it('recognizes supported assistant actions deterministically', () => {
    expect(resolveAssistantAction('Concluí a próxima missão')).toBe('complete_next');
    expect(resolveAssistantAction('Adiar a próxima tarefa')).toBe('postpone_next');
    expect(resolveAssistantAction('Reorganize meu planejamento')).toBe('rebalance');
  });

  it('responds using real progress counts when available', () => {
    const reply = localAssistantReply('Como está meu progresso?', [{ id: 'g1' }], [
      { status: 'completed' },
      { status: 'pending' },
    ]);
    expect(reply).toContain('1 objetivo(s)');
    expect(reply).toContain('1 missão(ões) concluída(s)');
    expect(reply).toContain('1 pendente(s)');
  });
});
