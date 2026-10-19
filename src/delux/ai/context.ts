import type { AssistantMessage, Goal, GoalDiagnostic, GoalStep, Mission, UserPreferences } from '../types';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export function recentConversation(messages: AssistantMessage[], userId: string, conversationId: string): ChatTurn[] {
  return messages.filter(m => m.user_id === userId && m.conversation_id === conversationId && (m.role === 'user' || m.role === 'assistant'))
    .slice(-12).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content.slice(0, 3000) }));
}

export function buildAssistantContext(data: {
  userId: string; timezone: string; preferences: UserPreferences | undefined;
  goals: Goal[]; diagnostics: GoalDiagnostic[]; steps: GoalStep[]; missions: Mission[];
}) {
  return {
    timezone: data.timezone,
    preferences: data.preferences,
    goals: data.goals.filter(g => g.user_id === data.userId && ['active', 'paused'].includes(g.status)).slice(0, 8).map(g => ({
      title: g.title, status: g.status, current_state: g.current_state, desired_outcome: g.desired_outcome,
      target_date: g.target_date, priority: g.priority,
      diagnostic: data.diagnostics.find(d => d.user_id === data.userId && d.goal_id === g.id),
      steps: data.steps.filter(s => s.user_id === data.userId && s.goal_id === g.id).map(s => ({ title: s.title, status: s.status, success_criteria: s.success_criteria })),
      completed_missions: data.missions.filter(m => m.user_id === data.userId && m.goal_id === g.id && m.status === 'completed').length,
    })),
    missions: data.missions.filter(m => m.user_id === data.userId && ['pending', 'in_progress', 'postponed'].includes(m.status))
      .sort((a, b) => (a.scheduled_date || '9999').localeCompare(b.scheduled_date || '9999')).slice(0, 20)
      .map(m => ({ title: m.title, status: m.status, estimated_minutes: m.estimated_minutes, scheduled_date: m.scheduled_date, scheduled_time: m.scheduled_time, note: m.note })),
  };
}