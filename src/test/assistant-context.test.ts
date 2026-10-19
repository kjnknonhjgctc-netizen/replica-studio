import { describe, expect, it } from 'vitest';
import { buildAssistantContext, recentConversation } from '../delux/ai/context';
import type { AssistantMessage, Goal, GoalDiagnostic, Mission, UserPreferences } from '../delux/types';

describe('Personalized assistant context', () => {
  it('keeps the previous answer and user constraints in a follow-up without mixing accounts', () => {
    const messages = [
      { user_id: 'u1', conversation_id: 'c1', role: 'user', content: 'Tenho 20 minutos por dia.' },
      { user_id: 'u1', conversation_id: 'c1', role: 'assistant', content: 'Comece com uma sessão de 20 minutos.' },
      { user_id: 'u2', conversation_id: 'c1', role: 'user', content: 'Informação de outra conta' },
      { user_id: 'u1', conversation_id: 'c2', role: 'user', content: 'Outra conversa' },
    ] as AssistantMessage[];
    expect(recentConversation(messages, 'u1', 'c1')).toEqual([
      { role: 'user', content: 'Tenho 20 minutos por dia.' },
      { role: 'assistant', content: 'Comece com uma sessão de 20 minutos.' },
    ]);
  });

  it('grounds goal advice in obstacles, availability and completed progress', () => {
    const result = buildAssistantContext({
      userId: 'u1', timezone: 'America/Sao_Paulo',
      preferences: { daily_available_minutes: 20, preferred_days: ['seg', 'qua'] } as UserPreferences,
      goals: [{ id: 'g1', user_id: 'u1', title: 'Aprender inglês', status: 'active', current_state: 'Iniciante', desired_outcome: 'Conversar' }, { id: 'g2', user_id: 'u2', title: 'Privada', status: 'active' }] as Goal[],
      diagnostics: [{ user_id: 'u1', goal_id: 'g1', obstacles: ['Medo de falar'] }] as GoalDiagnostic[],
      steps: [], missions: [{ user_id: 'u1', goal_id: 'g1', status: 'completed' }, { user_id: 'u2', goal_id: 'g1', status: 'completed' }] as Mission[],
    });
    expect(result.preferences?.daily_available_minutes).toBe(20);
    expect(result.preferences?.preferred_days).toEqual(['seg', 'qua']);
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0]?.diagnostic?.obstacles).toEqual(['Medo de falar']);
    expect(result.goals[0]?.completed_missions).toBe(1);
  });
});