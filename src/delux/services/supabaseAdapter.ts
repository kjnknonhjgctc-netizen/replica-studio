import { generateAi } from '../ai.functions';
import { buildAssistantContext, recentConversation } from '../ai/context';
import { requestsSavedPlan, resolveNavigationIntent } from '../ai/intent';

type SessionUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: SessionUser;
};
const SESSION_KEY = 'delux_supabase_session';
const WEEKDAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DEFAULT_NOTIFICATION_PREFERENCES = {
  missions_reminders: true,
  weekly_digest: true,
  achievement_alerts: true,
  daily_start_reminder: true,
};

function config() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error('Supabase ainda não está configurado neste ambiente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis do Lovable.');
  }
  return { url, key };
}

function readSession(): Session | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Session;
    return parsed?.access_token && parsed?.refresh_token && parsed?.user?.id ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  // Remove the old demo API token too; passwords and profile data are never stored here.
  localStorage.removeItem('delux_auth_token');
}

function errorMessage(payload: any, fallback: string) {
  return payload?.msg || payload?.message || payload?.error_description || payload?.error || fallback;
}

async function parseResponse(response: Response, fallback: string) {
  const raw = await response.text();
  let value: any = null;
  if (raw) {
    try { value = JSON.parse(raw); } catch { value = { message: raw }; }
  }
  if (!response.ok) {
    throw new Error(errorMessage(value, fallback));
  }
  return value;
}

async function authRequest(path: string, body: unknown) {
  const { url, key } = config();
  const response = await fetch(url + '/auth/v1/' + path, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(response, 'Falha na autenticação do Supabase.');
}

function saveAuthSession(raw: any): Session {
  if (!raw?.access_token || !raw?.refresh_token || !raw?.user?.id) {
    throw new Error('O Supabase não retornou uma sessão ativa. Confira a confirmação de e-mail nas configurações de Auth.');
  }
  const session: Session = {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + Number(raw.expires_in || 3600),
    user: raw.user,
  };
  writeSession(session);
  return session;
}

async function currentSession(): Promise<Session> {
  const session = readSession();
  if (!session) throw new Error('Sessão encerrada. Entre novamente para continuar.');
  if (session.expires_at > Math.floor(Date.now() / 1000) + 60) return session;
  try {
    const refreshed = await authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
    return saveAuthSession(refreshed);
  } catch {
    clearSession();
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
}

async function authFetch(path: string, init: RequestInit = {}, authRequired = true) {
  const { url, key } = config();
  const session = authRequired ? await currentSession() : null;
  const headers = new Headers(init.headers || {});
  headers.set('apikey', key);
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) headers.set('Authorization', 'Bearer ' + session.access_token);
  else if (!headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + key);
  const response = await fetch(url + path, { ...init, headers });
  return parseResponse(response, 'Falha ao acessar o Supabase.');
}

function queryString(filters: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ select: '*', ...Object.fromEntries(Object.entries(filters).filter((entry) => entry[1] !== undefined)) });
  return params.toString();
}

async function selectRows(table: string, filters: Record<string, string | undefined> = {}, order?: string) {
  const params = new URLSearchParams(queryString(filters));
  if (order) params.set('order', order);
  return await authFetch('/rest/v1/' + table + '?' + params.toString()) as any[];
}

async function insertRows(table: string, values: any | any[]) {
  const data = await authFetch('/rest/v1/' + table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(values),
  });
  return Array.isArray(data) ? data : [];
}

async function upsertRows(table: string, values: any, onConflict: string) {
  const data = await authFetch('/rest/v1/' + table + '?on_conflict=' + encodeURIComponent(onConflict), {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(values),
  });
  return Array.isArray(data) ? data : [];
}

async function updateRows(table: string, filters: Record<string, string>, values: any) {
  const params = new URLSearchParams({ select: '*', ...filters });
  const data = await authFetch('/rest/v1/' + table + '?' + params.toString(), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(values),
  });
  return Array.isArray(data) ? data : [];
}

async function deleteRows(table: string, filters: Record<string, string>) {
  const params = new URLSearchParams(filters);
  await authFetch('/rest/v1/' + table + '?' + params.toString(), { method: 'DELETE' });
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
}

function localDateString(date: Date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function nextAvailableDate(preferredDays: string[], startOffset = 0) {
  const allowed = preferredDays.length ? preferredDays : ['seg', 'ter', 'qua', 'qui', 'sex'];
  const target = Math.max(0, Math.min(370, Math.floor(Number(startOffset) || 0)));
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  let index = -1;
  for (let i = 0; i < 370; i++) {
    if (allowed.includes(WEEKDAY_KEYS[date.getDay()])) {
      index++;
      if (index === target) return localDateString(date);
    }
    date.setDate(date.getDate() + 1);
  }
  return localDateString(date);
}

async function getCurrentUser() {
  const session = await currentSession();
  const rows = await selectRows('profiles', { id: 'eq.' + session.user.id });
  let profile = rows[0];
  if (!profile) {
    const values = {
      id: session.user.id,
      email: session.user.email || '',
      full_name: String(session.user.user_metadata?.full_name || ''),
    };
    const created = await upsertRows('profiles', values, 'id');
    profile = created[0] || values;
  }
  return { session, user: profile };
}

async function getPreferencesFor(userId: string) {
  const rows = await selectRows('preferences', { user_id: 'eq.' + userId });
  if (rows[0]) return rows[0];
  const created = await upsertRows('preferences', { user_id: userId }, 'user_id');
  return created[0] || {
    user_id: userId,
    preferred_days: ['seg', 'ter', 'qua', 'qui', 'sex'],
    daily_available_minutes: 30,
    preferred_time: 'morning',
    notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
    assistant_response_style: 'progressive',
  };
}

async function listGoalRelations(goalIds?: string[]) {
  if (goalIds && goalIds.length === 0) return { diagnostics: [], steps: [], missions: [] };
  const filters = goalIds ? { goal_id: 'in.(' + goalIds.join(',') + ')' } : {};
  const [diagnostics, steps, missions] = await Promise.all([
    selectRows('goal_diagnostics', filters),
    selectRows('goal_steps', filters, 'position.asc'),
    selectRows('missions', filters, 'scheduled_date.asc,scheduled_time.asc,position.asc'),
  ]);
  return { diagnostics, steps, missions };
}

async function hydrateGoal(goal: any) {
  const relations = await listGoalRelations([goal.id]);
  return {
    ...goal,
    diagnostic: relations.diagnostics.find((x: any) => x.goal_id === goal.id),
    steps: relations.steps.filter((x: any) => x.goal_id === goal.id),
    missions: relations.missions.filter((x: any) => x.goal_id === goal.id),
  };
}

async function createGoal(payload: any, userId: string, preferredDays: string[] = ['seg', 'ter', 'qua', 'qui', 'sex']) {
  const title = String(payload?.title || '').trim();
  if (!title) throw new Error('O título do objetivo é obrigatório.');
  const now = new Date().toISOString();
  const createdRows = await insertRows('goals', [{
    user_id: userId,
    title: title.slice(0, 240),
    description: String(payload.description || '').trim(),
    category: payload.category || 'personal_dev',
    desired_outcome: String(payload.desired_outcome || title).trim(),
    current_state: String(payload.current_state || '').trim(),
    target_date: payload.target_date || null,
    priority: payload.priority || 'medium',
    status: payload.status || 'active',
    completed_at: payload.completed_at || null,
  }]);
  const goal = createdRows[0];
  if (!goal) throw new Error('O Supabase não confirmou a criação do objetivo.');

  if (payload.diagnostic) {
    const d = payload.diagnostic;
    await insertRows('goal_diagnostics', [{
      user_id: userId, goal_id: goal.id,
      current_situation: d.current_situation || payload.current_state || '',
      obstacles: d.obstacles || [],
      available_resources: d.available_resources || [],
      constraints: d.constraints || '',
      answers: d.answers || null,
    }]);
  }
  const createdSteps = Array.isArray(payload.steps) && payload.steps.length
    ? await insertRows('goal_steps', payload.steps.map((step: any, i: number) => ({
      user_id: userId, goal_id: goal.id,
      title: String(step.title || ('Etapa ' + (i + 1))).trim(),
      description: String(step.description || ''),
      position: i + 1,
      success_criteria: String(step.success_criteria || ''),
      status: i === 0 ? 'in_progress' : 'pending',
    })))
    : [];
  const activePrefs = await getPreferencesFor(userId);
  const capacity = Math.max(5, Number(activePrefs.daily_available_minutes) || 30);
  const planned: Record<string, number> = {};
  const requestedMissions = Array.isArray(payload.missions) ? payload.missions : [];
  const createdMissions = [];
  for (let i = 0; i < requestedMissions.length; i++) {
    const m = requestedMissions[i] || {};
    const stepIndex = Number.isInteger(Number(m.step_index)) ? Number(m.step_index) : 0;
    const step = createdSteps[stepIndex] || createdSteps[0];
    const minutes = Math.max(5, Math.min(180, capacity, Number(m.estimated_minutes) || capacity));
    let offset = Math.max(0, Number(m.day_offset) || i);
    let date = m.scheduled_date || nextAvailableDate(preferredDays, offset);
    let tries = 0;
    while (!m.scheduled_date && (planned[date] || 0) + minutes > capacity && tries < 35) {
      offset++;
      date = nextAvailableDate(preferredDays, offset);
      tries++;
    }
    planned[date] = (planned[date] || 0) + minutes;
    const inserted = await insertRows('missions', [{
      user_id: userId,
      goal_id: goal.id,
      goal_step_id: m.goal_step_id || step?.id || null,
      title: String(m.title || ('Tarefa ' + (i + 1))).trim(),
      instructions: String(m.instructions || ''),
      estimated_minutes: minutes,
      scheduled_date: date,
      scheduled_time: m.scheduled_time || '09:00',
      priority: ['low', 'medium', 'high'].includes(m.priority) ? m.priority : 'medium',
      status: 'pending',
      position: i + 1,
    }]);
    if (inserted[0]) createdMissions.push(inserted[0]);
  }
  await insertRows('activity_events', [{
    user_id: userId, goal_id: goal.id, event_type: 'goal_created', metadata: { title: goal.title },
  }]);
  return { ...goal, diagnostic: payload.diagnostic, steps: createdSteps, missions: createdMissions };
}

function cleanObject(value: any, forbidden: string[] = ['id', 'user_id', 'created_at', 'updated_at']) {
  const result: Record<string, any> = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (!forbidden.includes(key) && item !== undefined) result[key] = item;
  }
  return result;
}

async function generatePlan(title: string, current_state?: string, desired_outcome?: string, available_minutes?: number) {
  if (!title?.trim()) throw new Error('Título do objetivo é obrigatório.');
  const prompt = 'Crie um plano de ação estruturado para o objetivo "' + title.trim() + '".\n' +
    'Contexto atual: "' + (current_state || 'Iniciante') + '".\n' +
    'Resultado almejado: "' + (desired_outcome || title) + '".\n' +
    'Tempo disponível por dia: ' + (available_minutes || 30) + ' minutos.\n' +
    'Responda somente JSON: {"steps":[{"title":"...","description":"...","success_criteria":"..."}],"missions":[{"title":"...","instructions":"...","estimated_minutes":25,"priority":"high|medium|low"}]}. Exatamente 3 etapas e 3 missões concretas.';
  const response = await generateAi({ data: { prompt, json: true, history: [], context: '' } });
  const parsed = JSON.parse(response.text);
  if (!Array.isArray(parsed.steps) || !Array.isArray(parsed.missions)) throw new Error('A resposta do assistente não veio em um formato válido.');
  return { steps: parsed.steps, missions: parsed.missions };
}

async function sendChatMessage(message: string, conversationId?: string) {
  const text = String(message || '').trim();
  if (!text) throw new Error('Mensagem vazia.');
  const { user } = await getCurrentUser();
  const [preferences, goals, missions, diagnostics, steps, conversations] = await Promise.all([
    getPreferencesFor(user.id),
    selectRows('goals', {}, 'created_at.desc'),
    selectRows('missions', {}, 'scheduled_date.asc,scheduled_time.asc'),
    selectRows('goal_diagnostics'),
    selectRows('goal_steps', {}, 'position.asc'),
    conversationId ? selectRows('assistant_conversations', { id: 'eq.' + conversationId }) : Promise.resolve([]),
  ]);

  let conversation = conversations[0];
  if (conversation && conversation.user_id !== user.id) throw new Error('Conversa não encontrada.');
  if (!conversation) {
    const rows = await insertRows('assistant_conversations', [{
      user_id: user.id,
      title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
    }]);
    conversation = rows[0];
  } else {
    const changed = await updateRows('assistant_conversations', { id: 'eq.' + conversation.id, user_id: 'eq.' + user.id }, { updated_at: new Date().toISOString() });
    conversation = changed[0] || conversation;
  }
  if (!conversation) throw new Error('Não foi possível abrir a conversa.');

  const insertedUserMessage = await insertRows('assistant_messages', [{
    conversation_id: conversation.id, user_id: user.id, role: 'user', content: text,
  }]);
  const userMessage = insertedUserMessage[0];
  if (!userMessage) throw new Error('Não foi possível salvar sua mensagem.');
  let assistantContent = '';
  let action: { type: 'navigate'; path: string; label: string } | null = null;

  const relevantGoals = goals.filter((g: any) => ['active', 'paused'].includes(g.status));
  const relevantMissions = missions.filter((m: any) => ['pending', 'in_progress', 'postponed'].includes(m.status));
  const context = JSON.stringify(buildAssistantContext({
    userId: user.id, timezone: user.timezone || 'America/Sao_Paulo', preferences,
    goals, diagnostics, steps, missions,
  })).slice(0, 20000);
  const priorRows = await selectRows('assistant_messages', {
    conversation_id: 'eq.' + conversation.id,
  }, 'created_at.asc');
  const history = recentConversation(priorRows.filter((m: any) => m.id !== userMessage.id), user.id, conversation.id);

  try {
    const navigation = resolveNavigationIntent(text);
    if (navigation) {
      action = navigation;
      assistantContent = 'Claro — abrindo ' + navigation.label + ' agora.';
    } else if (requestsSavedPlan(text)) {
      const prompt = 'Transforme o pedido abaixo em um plano REALISTA para salvar no Delux.\nPedido: "' + text + '"\n' +
        'Tempo diário: ' + (preferences.daily_available_minutes || 30) + ' minutos.\n' +
        'Horário preferido: ' + (preferences.preferred_time || 'flexible') + '.\n' +
        'Dias disponíveis: ' + (preferences.preferred_days || ['seg', 'ter', 'qua', 'qui', 'sex']).join(', ') + '.\n' +
        'Metas existentes: ' + relevantGoals.map((g: any) => g.title).join('; ') + '.\n' +
        'day_offset é o índice de dias DISPONÍVEIS, não dias corridos. Responda somente JSON: ' +
        '{"goal_title":"...","goal_description":"...","category":"health|learning|career|finance|organization|personal_dev|other","desired_outcome":"...","current_state":"...","steps":[{"title":"...","description":"...","success_criteria":"..."}],"missions":[{"title":"...","instructions":"...","estimated_minutes":25,"priority":"high|medium|low","day_offset":0,"scheduled_time":"09:00","step_index":0}]}. Inclua 3 etapas e 5 a 7 missões.';
      const ai = await generateAi({ data: { prompt, json: true, history, context } });
      const plan = JSON.parse(ai.text);
      if (!Array.isArray(plan.steps) || !Array.isArray(plan.missions) || !plan.missions.length) throw new Error('O assistente não gerou um plano válido.');
      const goal = await createGoal({
        title: plan.goal_title || text.slice(0, 120),
        description: plan.goal_description || 'Plano criado a partir de: ' + text,
        category: plan.category || 'personal_dev',
        desired_outcome: plan.desired_outcome || plan.goal_title || text,
        current_state: plan.current_state || '',
        diagnostic: { current_situation: plan.current_state || '', obstacles: [], available_resources: [], constraints: '' },
        steps: plan.steps,
        missions: plan.missions,
      }, user.id, preferences.preferred_days || ['seg', 'ter', 'qua', 'qui', 'sex']);
      const daySummary = goal.missions.map((m: any) => m.scheduled_date + ' ' + (m.scheduled_time || '') + ' — ' + m.title + ' (' + m.estimated_minutes + ' min)').join('\n');
      assistantContent = 'Plano salvo no Delux! Criei o objetivo **"' + goal.title + '"**, ' + goal.steps.length + ' etapas e ' + goal.missions.length + ' tarefas no Planejamento.\n\n' + daySummary;
    } else {
      const ai = await generateAi({ data: { prompt: text, json: false, history, context } });
      assistantContent = ai.text || 'Estou à disposição para apoiar seus objetivos no Delux. Como posso ajudar com sua próxima missão?';
    }
  } catch (error) {
    await deleteRows('assistant_messages', { id: 'eq.' + userMessage.id, user_id: 'eq.' + user.id });
    throw error;
  }

  const insertedAssistant = await insertRows('assistant_messages', [{
    conversation_id: conversation.id, user_id: user.id, role: 'assistant', content: assistantContent,
  }]);
  const assistantMessage = insertedAssistant[0];
  return { conversation, userMessage, assistantMessage, action };
}

export async function handleSupabaseRequest(method: string, endpoint: string, body: any): Promise<any> {
  const url = new URL(endpoint, 'http://delux.local');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  const [root, area, actionOrId, nested, nestedId] = segments;

  if (root !== 'api') throw new Error('Endpoint não reconhecido.');
  const payload = body || {};

  if (area === 'auth' && actionOrId === 'login' && method === 'POST') {
    const raw = await authRequest('token?grant_type=password', { email: payload.email, password: payload.password });
    const session = saveAuthSession(raw);
    const { user } = await getCurrentUser();
    return { token: session.access_token, user };
  }
  if (area === 'auth' && actionOrId === 'register' && method === 'POST') {
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    if (!email || !password) throw new Error('Informe e-mail e senha para criar sua conta.');
    if (password.length < 8) throw new Error('A senha deve ter no mínimo 8 caracteres.');
    const raw = await authRequest('signup', { email, password, data: { full_name: String(payload.full_name || '').trim() } });
    if (!raw?.access_token) {
      throw new Error('Conta criada. Confirme seu e-mail pelo link enviado e depois entre no Delux. Se nenhum e-mail chegar, confira SMTP e as configurações de Auth do Supabase.');
    }
    const session = saveAuthSession(raw);
    const { user } = await getCurrentUser();
    return { token: session.access_token, user };
  }
  if (area === 'auth' && actionOrId === 'me' && method === 'GET') {
    const { user } = await getCurrentUser();
    return { user };
  }
  if (area === 'auth' && actionOrId === 'complete-onboarding' && method === 'POST') {
    const { user } = await getCurrentUser();
    const data = { onboarding_completed: true } as any;
    if (payload.name || payload.full_name) data.full_name = String(payload.name || payload.full_name).trim();
    const updated = await updateRows('profiles', { id: 'eq.' + user.id }, data);
    const prefs = payload.preferences || {};
    await upsertRows('preferences', {
      user_id: user.id,
      preferred_days: prefs.preferred_days || ['seg', 'ter', 'qua', 'qui', 'sex'],
      daily_available_minutes: prefs.daily_available_minutes || 30,
      preferred_time: prefs.preferred_time || 'morning',
      notification_preferences: prefs.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
      assistant_response_style: prefs.assistant_response_style || 'progressive',
    }, 'user_id');
    if (payload.firstGoal?.title) {
      const pref = await getPreferencesFor(user.id);
      await createGoal(payload.firstGoal, user.id, pref.preferred_days);
    }
    return { success: true, user: updated[0] || { ...user, ...data } };
  }
  if (area === 'auth' && actionOrId === 'profile' && method === 'PUT') {
    const { user } = await getCurrentUser();
    const data = cleanObject(payload, ['id', 'email', 'onboarding_completed', 'created_at', 'updated_at', 'user_id']);
    const updated = await updateRows('profiles', { id: 'eq.' + user.id }, data);
    return { user: updated[0] || { ...user, ...data } };
  }
  if (area === 'auth' && actionOrId === 'forgot-password' && method === 'POST') {
    if (!payload.email) throw new Error('Informe o e-mail da sua conta.');
    const { url } = config();
    const response = await fetch(url + '/auth/v1/recover', {
      method: 'POST',
      headers: { apikey: config().key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(payload.email).trim().toLowerCase(), redirect_to: window.location.origin }),
    });
    await parseResponse(response, 'Não foi possível solicitar a recuperação de senha.');
    return { success: true, message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.' };
  }

  if (area === 'preferences') {
    const { user } = await getCurrentUser();
    if (method === 'GET') return { preferences: await getPreferencesFor(user.id) };
    if (method === 'PUT') {
      const existing = await getPreferencesFor(user.id);
      const data = cleanObject(payload, ['user_id', 'created_at', 'updated_at']);
      const changed = await upsertRows('preferences', { ...existing, ...data, user_id: user.id, updated_at: new Date().toISOString() }, 'user_id');
      return { preferences: changed[0] || { ...existing, ...data } };
    }
  }

  if (area === 'goals') {
    const { user } = await getCurrentUser();
    if (method === 'GET' && !actionOrId) {
      const goals = await selectRows('goals', {}, 'created_at.desc');
      const relations = await listGoalRelations(goals.map((g: any) => g.id));
      return { goals: goals.map((g: any) => ({
        ...g,
        diagnostic: relations.diagnostics.find((d: any) => d.goal_id === g.id),
        steps: relations.steps.filter((s: any) => s.goal_id === g.id),
        missions: relations.missions.filter((m: any) => m.goal_id === g.id),
      })) };
    }
    if (method === 'GET' && actionOrId && !nested) {
      const rows = await selectRows('goals', { id: 'eq.' + actionOrId });
      if (!rows[0]) throw new Error('Objetivo não encontrado.');
      return { goal: await hydrateGoal(rows[0]) };
    }
    if (method === 'POST' && !actionOrId) {
      const preferences = await getPreferencesFor(user.id);
      return { goal: await createGoal(payload, user.id, preferences.preferred_days) };
    }
    if (method === 'PUT' && actionOrId && !nested) {
      const data = cleanObject(payload, ['id', 'user_id', 'created_at', 'updated_at', 'diagnostic', 'steps', 'missions']);
      if (data.status === 'completed' && !payload.completed_at) data.completed_at = new Date().toISOString();
      const updated = await updateRows('goals', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id }, data);
      if (!updated[0]) throw new Error('Objetivo não encontrado.');
      if (data.status === 'completed') await insertRows('activity_events', [{ user_id: user.id, goal_id: actionOrId, event_type: 'goal_completed', metadata: { title: updated[0].title } }]);
      return { goal: updated[0] };
    }
    if (method === 'DELETE' && actionOrId && !nested) {
      const existing = await selectRows('goals', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id });
      if (!existing[0]) throw new Error('Objetivo não encontrado.');
      await deleteRows('goals', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id });
      return { success: true, message: 'Objetivo excluído com sucesso.' };
    }
    if (method === 'POST' && actionOrId && nested === 'steps') {
      const rows = await selectRows('goals', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id });
      if (!rows[0]) throw new Error('Objetivo não encontrado.');
      if (!payload.title) throw new Error('Título da etapa é obrigatório.');
      const previous = await selectRows('goal_steps', { goal_id: 'eq.' + actionOrId }, 'position.asc');
      const created = await insertRows('goal_steps', [{
        user_id: user.id, goal_id: actionOrId, title: String(payload.title).trim(),
        description: payload.description || '', position: previous.length + 1,
        success_criteria: payload.success_criteria || '', status: previous.length ? 'pending' : 'in_progress',
      }]);
      return { step: created[0] };
    }
  }

  if (area === 'steps' && method === 'PUT' && actionOrId) {
    const { user } = await getCurrentUser();
    const data = cleanObject(payload, ['id', 'user_id', 'goal_id', 'created_at', 'updated_at']);
    if (data.status === 'completed' && !payload.completed_at) data.completed_at = new Date().toISOString();
    const updated = await updateRows('goal_steps', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id }, data);
    if (!updated[0]) throw new Error('Etapa não encontrada.');
    if (data.status === 'completed') await insertRows('activity_events', [{ user_id: user.id, goal_id: updated[0].goal_id, event_type: 'step_completed', metadata: { title: updated[0].title } }]);
    return { step: updated[0] };
  }

  if (area === 'missions') {
    const { user } = await getCurrentUser();
    if (method === 'GET' && !actionOrId) {
      const filters: Record<string, string> = {};
      const date = url.searchParams.get('date');
      const status = url.searchParams.get('status');
      const goalId = url.searchParams.get('goal_id');
      if (date) filters.scheduled_date = 'eq.' + date;
      if (status) filters.status = 'eq.' + status;
      if (goalId) filters.goal_id = 'eq.' + goalId;
      return { missions: await selectRows('missions', filters, 'scheduled_date.asc,scheduled_time.asc,position.asc') };
    }
    if (method === 'POST' && !actionOrId) {
      if (!payload.title) throw new Error('Título da missão é obrigatório.');
      if (!payload.goal_id) throw new Error('Selecione o objetivo da missão.');
      const values = {
        user_id: user.id, goal_id: payload.goal_id, goal_step_id: payload.goal_step_id || null,
        title: String(payload.title).trim(), instructions: payload.instructions || '',
        estimated_minutes: Math.max(1, Number(payload.estimated_minutes) || 30),
        scheduled_date: payload.scheduled_date || localDateString(new Date()),
        scheduled_time: payload.scheduled_time || null, priority: payload.priority || 'medium', status: 'pending', position: 1,
      };
      const rows = await insertRows('missions', [values]);
      return { mission: rows[0] };
    }
    if (method === 'PUT' && actionOrId) {
      const oldRows = await selectRows('missions', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id });
      if (!oldRows[0]) throw new Error('Missão não encontrada.');
      const data = cleanObject(payload, ['id', 'user_id', 'goal_id', 'goal_step_id', 'created_at', 'updated_at']);
      if (data.status === 'completed' && oldRows[0].status !== 'completed') data.completed_at = new Date().toISOString();
      const updated = await updateRows('missions', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id }, data);
      if (data.status === 'completed' && oldRows[0].status !== 'completed') {
        await insertRows('activity_events', [{ user_id: user.id, goal_id: oldRows[0].goal_id, mission_id: oldRows[0].id, event_type: 'mission_completed', metadata: { title: updated[0].title } }]);
      } else if (data.status === 'postponed' && oldRows[0].status !== 'postponed') {
        await insertRows('activity_events', [{ user_id: user.id, goal_id: oldRows[0].goal_id, mission_id: oldRows[0].id, event_type: 'mission_postponed', metadata: { title: updated[0].title } }]);
      }
      return { mission: updated[0] };
    }
    if (method === 'POST' && actionOrId && nested === 'toggle') {
      const oldRows = await selectRows('missions', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id });
      if (!oldRows[0]) throw new Error('Missão não encontrada.');
      const completed = oldRows[0].status !== 'completed';
      const changes: any = { status: completed ? 'completed' : 'pending', completed_at: completed ? new Date().toISOString() : null };
      const updated = await updateRows('missions', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id }, changes);
      if (completed) await insertRows('activity_events', [{ user_id: user.id, goal_id: oldRows[0].goal_id, mission_id: oldRows[0].id, event_type: 'mission_completed', metadata: { title: oldRows[0].title } }]);
      return { mission: updated[0] };
    }
    if (method === 'DELETE' && actionOrId) {
      const existing = await selectRows('missions', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id });
      if (!existing[0]) throw new Error('Missão não encontrada.');
      await deleteRows('missions', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id });
      return { success: true };
    }
  }

  if (area === 'planner') {
    const { user } = await getCurrentUser();
    const preferences = await getPreferencesFor(user.id);
    const goals = await selectRows('goals', {}, 'created_at.desc');
    if (method === 'GET') {
      const missions = await selectRows('missions', {}, 'scheduled_date.asc,scheduled_time.asc');
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date();
        day.setDate(day.getDate() + i);
        const date = localDateString(day);
        const dayMissions = missions.filter((m: any) => m.scheduled_date === date);
        const totalMinutes = dayMissions.reduce((sum: number, m: any) => sum + (Number(m.estimated_minutes) || 0), 0);
        const completedMinutes = dayMissions.filter((m: any) => m.status === 'completed').reduce((sum: number, m: any) => sum + (Number(m.estimated_minutes) || 0), 0);
        days.push({
          date, dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()],
          dayNumber: day.getDate(), isToday: i === 0, missions: dayMissions,
          totalMinutes, completedMinutes, availableMinutes: preferences.daily_available_minutes,
          hasConflict: totalMinutes > preferences.daily_available_minutes * 1.5,
        });
      }
      return { days, goals, preferences };
    }
    if (method === 'POST' && actionOrId === 'rebalance') {
      const today = localDateString(new Date());
      const missions = await selectRows('missions', { status: 'eq.pending' }, 'scheduled_date.asc,scheduled_time.asc');
      const overdue = missions.filter((m: any) => m.scheduled_date && m.scheduled_date < today);
      const allowed = preferences.preferred_days || ['seg', 'ter', 'qua', 'qui', 'sex'];
      const byDate: Record<string, number> = {};
      missions.forEach((m: any) => {
        if (m.scheduled_date && ['pending', 'in_progress', 'postponed'].includes(m.status)) byDate[m.scheduled_date] = (byDate[m.scheduled_date] || 0) + (Number(m.estimated_minutes) || 0);
      });
      let rescheduledCount = 0;
      for (let i = 0; i < overdue.length; i++) {
        const m = overdue[i];
        let offset = i;
        let target = nextAvailableDate(allowed, offset);
        let tries = 0;
        while ((byDate[target] || 0) + (Number(m.estimated_minutes) || 0) > (Number(preferences.daily_available_minutes) || 30) && tries < 35) {
          offset++;
          target = nextAvailableDate(allowed, offset);
          tries++;
        }
        const updated = await updateRows('missions', { id: 'eq.' + m.id, user_id: 'eq.' + user.id }, { scheduled_date: target });
        if (updated[0]) {
          byDate[target] = (byDate[target] || 0) + (Number(m.estimated_minutes) || 0);
          rescheduledCount++;
        }
      }
      if (rescheduledCount) await insertRows('activity_events', [{ user_id: user.id, event_type: 'plan_adapted', metadata: { rescheduledCount } }]);
      return { success: true, rescheduledCount, message: rescheduledCount + ' missões redistribuídas com equilíbrio pela sua semana.' };
    }
  }

  if (area === 'activity' && method === 'GET') {
    const { user } = await getCurrentUser();
    const [events, missions, goals] = await Promise.all([
      selectRows('activity_events', {}, 'created_at.desc'),
      selectRows('missions'),
      selectRows('goals'),
    ]);
    const completedMissions = missions.filter((m: any) => m.status === 'completed');
    return {
      events: events.slice(0, 50),
      metrics: {
        totalMissions: missions.length,
        completedMissions: completedMissions.length,
        pendingMissions: missions.filter((m: any) => m.status === 'pending').length,
        completionRate: missions.length ? Math.round(completedMissions.length / missions.length * 100) : 0,
        activeGoals: goals.filter((g: any) => g.status === 'active').length,
        completedGoals: goals.filter((g: any) => g.status === 'completed').length,
        daysActiveCount: new Set(completedMissions.filter((m: any) => m.completed_at).map((m: any) => String(m.completed_at).split('T')[0])).size,
      },
    };
  }

  if (area === 'notifications') {
    const { user } = await getCurrentUser();
    if (method === 'GET') return { notifications: await selectRows('notifications', {}, 'created_at.desc') };
    if (method === 'POST' && actionOrId && nested === 'read') {
      await updateRows('notifications', { id: 'eq.' + actionOrId, user_id: 'eq.' + user.id }, { read_at: new Date().toISOString() });
      return { success: true };
    }
  }

  if (area === 'assistant' && actionOrId === 'conversations' && method === 'GET') {
    return { conversations: await selectRows('assistant_conversations', {}, 'updated_at.desc') };
  }
  if (area === 'assistant' && actionOrId === 'conversations' && nested && nestedId === 'messages' && method === 'GET') {
    const { user } = await getCurrentUser();
    const rows = await selectRows('assistant_conversations', { id: 'eq.' + nested });
    if (!rows[0] || rows[0].user_id !== user.id) throw new Error('Conversa não encontrada.');
    const messages = await selectRows('assistant_messages', { conversation_id: 'eq.' + nested }, 'created_at.asc');
    return { conversation: rows[0], messages };
  }
  if (area === 'assistant' && actionOrId === 'conversations' && nested && method === 'DELETE') {
    const { user } = await getCurrentUser();
    const rows = await selectRows('assistant_conversations', { id: 'eq.' + nested, user_id: 'eq.' + user.id });
    if (!rows[0]) throw new Error('Conversa não encontrada.');
    await deleteRows('assistant_conversations', { id: 'eq.' + nested, user_id: 'eq.' + user.id });
    return { success: true };
  }
  if (area === 'assistant' && actionOrId === 'chat' && method === 'POST') {
    return sendChatMessage(payload.message, payload.conversation_id);
  }
  if (area === 'assistant' && actionOrId === 'generate-plan' && method === 'POST') {
    return generatePlan(payload.title, payload.current_state, payload.desired_outcome, payload.available_minutes);
  }

  throw new Error('Operação não reconhecida no serviço Supabase: ' + method + ' ' + path);
}
