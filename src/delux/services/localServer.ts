// @ts-nocheck -- ported as-is from the original project
// Browser-side port of the original Express server. Data persists in localStorage;
// AI calls go through a server function.
import { generateAi } from '@/delux/ai.functions';
import { buildAssistantContext, recentConversation } from '../ai/context';
import { requestsSavedPlan, resolveNavigationIntent } from '../ai/intent';
import {
  Goal, GoalDiagnostic, GoalStep, Mission, UserProfile, UserPreferences, ActivityEvent,
  AssistantConversation, AssistantMessage, AppNotification, Subscription
} from '../types';

type Request = any;
type Response = any;
type Handler = (req: any, res: any, next: () => void) => any;
const routes: { method: string; parts: string[]; handlers: Handler[] }[] = [];
const reg = (method: string) => (path: string, ...handlers: Handler[]) => {
  routes.push({ method, parts: path.split('/').filter(Boolean), handlers });
};
const app = { get: reg('GET'), post: reg('POST'), put: reg('PUT'), delete: reg('DELETE') };

const genAI = {
  models: {
    async generateContent(opts: any): Promise<{ text: string }> {
      const prompt = opts.contents.map((c: any) => c.parts.map((p: any) => p.text).join('\n')).join('\n');
      const r = await generateAi({ data: { prompt, json: opts.config?.responseMimeType === 'application/json', history: opts.history || [], context: opts.context || '' } });
      return { text: r.text };
    }
  }
};

export async function handleLocalRequest(method: string, url: string, body: any, token: string | null) {
  const u = new URL(url, 'http://local');
  const parts = u.pathname.split('/').filter(Boolean);
  for (const r of routes) {
    if (r.method !== method || r.parts.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    r.parts.forEach((rp, i) => {
      if (rp.startsWith(':')) params[rp.slice(1)] = decodeURIComponent(parts[i]);
      else if (rp !== parts[i]) ok = false;
    });
    if (!ok) continue;
    let status = 200;
    let payload: any = undefined;
    const res = { status(c: number) { status = c; return res; }, json(d: any) { payload = d; return res; } };
    const req: any = { params, body: body || {}, query: Object.fromEntries(u.searchParams), headers: { authorization: token ? `Bearer ${token}` : undefined } };
    let i = 0;
    const run = async (): Promise<void> => { const h = r.handlers[i++]; if (h) await h(req, res, () => { void 0; }) ; };
    // run middleware chain sequentially
    for (i = 0; i < r.handlers.length; ) {
      const h = r.handlers[i++];
      let called = false;
      await h(req, res, () => { called = true; });
      if (!called) break;
    }
    void run;
    return { status, payload };
  }
  return { status: 404, payload: { error: 'Rota não encontrada.' } };
}

const DB_KEY = 'delux_database';

// Database schema definition
interface DatabaseSchema {
  profiles: UserProfile[];
  passwords: Record<string, string>; // user_id -> password
  preferences: UserPreferences[];
  goals: Goal[];
  diagnostics: GoalDiagnostic[];
  steps: GoalStep[];
  missions: Mission[];
  activity_events: ActivityEvent[];
  conversations: AssistantConversation[];
  messages: AssistantMessage[];
  notifications: AppNotification[];
  subscriptions: Subscription[];
}

const defaultUser: UserProfile = {
  id: 'usr_demo_1',
  email: 'usuario@delux.app',
  full_name: '',
  timezone: 'America/Sao_Paulo',
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const defaultPreferences: UserPreferences = {
  user_id: 'usr_demo_1',
  preferred_days: ['seg', 'ter', 'qua', 'qui', 'sex'],
  daily_available_minutes: 45,
  preferred_time: 'morning',
  notification_preferences: {
    missions_reminders: true,
    weekly_digest: true,
    achievement_alerts: true,
    daily_start_reminder: true
  },
  assistant_response_style: 'progressive',
  updated_at: new Date().toISOString()
};

const defaultGoal: Goal = {
  id: 'goal_demo_1',
  user_id: 'usr_demo_1',
  title: 'Dominar Comunicação e Conversação em Inglês',
  description: 'Atingir fluência prática para reuniões profissionais e viagens sem travar.',
  category: 'learning',
  desired_outcome: 'Falar com confiança por 30 minutos em reuniões e entender podcasts sem legenda.',
  current_state: 'Consigo ler textos básicos, mas travo na conversação e não entendo nativos falando rápido.',
  target_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
  priority: 'high',
  status: 'active',
  created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  updated_at: new Date().toISOString()
};

const defaultDiagnostic: GoalDiagnostic = {
  id: 'diag_demo_1',
  goal_id: 'goal_demo_1',
  user_id: 'usr_demo_1',
  current_situation: 'Vocabulário passivo intermediário, porém grande insegurança ao falar e falta de rotina estruturada.',
  obstacles: ['Medo de errar pronúncia', 'Falta de tempo consistente', 'Materiais dispersos'],
  available_resources: ['45 minutos diários de manhã', 'Acesso a podcasts e aplicativo de repetição'],
  constraints: 'Dias úteis pela manhã',
  created_at: new Date(Date.now() - 7 * 86400000).toISOString()
};

const defaultSteps: GoalStep[] = [
  {
    id: 'step_demo_1',
    goal_id: 'goal_demo_1',
    user_id: 'usr_demo_1',
    title: 'Fundação de Escuta e Vocabulário Ativo',
    description: 'Imersão auditiva diária com shadowing e retenção dos 500 verbos mais usados.',
    position: 1,
    success_criteria: 'Compreender 80% do podcast The Daily sem pausas e anotar termos-chave.',
    status: 'in_progress',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'step_demo_2',
    goal_id: 'goal_demo_1',
    user_id: 'usr_demo_1',
    title: 'Simulações de Conversação Guiada',
    description: 'Gravar respostas estruturadas de 2 minutos sobre tópicos do dia a dia e trabalho.',
    position: 2,
    success_criteria: 'Completar 10 simulações completas sem consultar dicionário.',
    status: 'pending',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'step_demo_3',
    goal_id: 'goal_demo_1',
    user_id: 'usr_demo_1',
    title: 'Fluência em Reuniões Profissionais',
    description: 'Apresentar um projeto de 15 minutos em inglês e manter debate de perguntas e respostas.',
    position: 3,
    success_criteria: 'Conduzir reunião sem interrupções para tradução mental.',
    status: 'pending',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const defaultMissions: Mission[] = [
  {
    id: 'mis_demo_1',
    goal_id: 'goal_demo_1',
    goal_step_id: 'step_demo_1',
    user_id: 'usr_demo_1',
    title: 'Shadowing com Episódio de Podcast (15 min)',
    instructions: 'Escolha 3 minutos de áudio nativo e repita em voz alta imediatamente após o narrador, imitando ritmo e entonação.',
    estimated_minutes: 20,
    scheduled_date: todayStr,
    scheduled_time: '08:00',
    priority: 'high',
    status: 'pending',
    position: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mis_demo_2',
    goal_id: 'goal_demo_1',
    goal_step_id: 'step_demo_1',
    user_id: 'usr_demo_1',
    title: 'Registro de 10 Frases Contextualizadas de Trabalho',
    instructions: 'Crie frases úteis que você usaria na sua rotina profissional hoje e leia em voz alta 3 vezes.',
    estimated_minutes: 20,
    scheduled_date: todayStr,
    scheduled_time: '08:30',
    priority: 'medium',
    status: 'pending',
    position: 2,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mis_demo_3',
    goal_id: 'goal_demo_1',
    goal_step_id: 'step_demo_1',
    user_id: 'usr_demo_1',
    title: 'Diagnóstico de Vocabulário Passivo vs Ativo',
    instructions: 'Revisão das expressões anotadas nos últimos dias e teste de recordação ativa.',
    estimated_minutes: 25,
    scheduled_date: yesterdayStr,
    scheduled_time: '08:00',
    priority: 'medium',
    status: 'completed',
    completed_at: new Date(Date.now() - 86400000).toISOString(),
    position: 1,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mis_demo_4',
    goal_id: 'goal_demo_1',
    goal_step_id: 'step_demo_1',
    user_id: 'usr_demo_1',
    title: 'Gravação de Áudio: Resumo do Dia em 2 Minutos',
    instructions: 'Sem ler nenhum roteiro, descreva como foi seu dia e os desafios superados em inglês no gravador do celular.',
    estimated_minutes: 15,
    scheduled_date: tomorrowStr,
    scheduled_time: '08:00',
    priority: 'high',
    status: 'pending',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const defaultActivityEvents: ActivityEvent[] = [
  {
    id: 'evt_demo_1',
    user_id: 'usr_demo_1',
    goal_id: 'goal_demo_1',
    mission_id: 'mis_demo_3',
    event_type: 'mission_completed',
    metadata: { title: 'Diagnóstico de Vocabulário Passivo vs Ativo' },
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'evt_demo_2',
    user_id: 'usr_demo_1',
    goal_id: 'goal_demo_1',
    event_type: 'goal_created',
    metadata: { title: 'Dominar Comunicação e Conversação em Inglês' },
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  }
];

const defaultNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    user_id: 'usr_demo_1',
    type: 'milestone',
    title: 'Bem-vindo ao Delux',
    body: 'Sua rotina está pronta. Comece pela primeira missão do dia para construir consistência.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const defaultSubscription: Subscription = {
  id: 'sub_demo_1',
  user_id: 'usr_demo_1',
  provider: 'delux_billing',
  status: 'active',
  price_amount: 29.90,
  currency: 'BRL',
  current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  updated_at: new Date().toISOString()
};

function initDb(): DatabaseSchema {
  const content = localStorage.getItem(DB_KEY);
  if (content) {
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading database, creating fresh one:', e);
    }
  }

  const initialData: DatabaseSchema = {
    profiles: [defaultUser],
    passwords: { usr_demo_1: '123456' },
    preferences: [defaultPreferences],
    goals: [],
    diagnostics: [],
    steps: [],
    missions: [],
    activity_events: [],
    conversations: [],
    messages: [],
    notifications: [],
    subscriptions: [defaultSubscription]
  };

  saveDb(initialData);
  return initialData;
}

function saveDb(data: DatabaseSchema) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error persisting database:', err);
  }
}

let db = initDb();

// Availability helpers: never schedule a mission on a day the user marked unavailable.
const WEEKDAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
function getPreferredDays(userId: string): string[] {
  const pref = db.preferences.find(p => p.user_id === userId);
  const days = Array.isArray(pref?.preferred_days)
    ? pref.preferred_days.map((day: any) => String(day).toLowerCase().slice(0, 3))
      .filter((day: string) => WEEKDAY_KEYS.includes(day))
    : [];
  return days.length ? days : ['seg', 'ter', 'qua', 'qui', 'sex'];
}
function localDateString(date: Date): string {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
/**
 * day_offset indexes available workdays, not calendar days.
 * This prevents offsets 0 and 1 from collapsing onto the same Monday when today is Sunday.
 */
function nextAvailableDate(userId: string, startOffset = 0): string {
  const allowed = getPreferredDays(userId);
  const targetIndex = Math.max(0, Math.floor(Number(startOffset) || 0));
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  let availableIndex = -1;
  for (let i = 0; i < 35; i++) {
    if (allowed.includes(WEEKDAY_KEYS[date.getDay()])) {
      availableIndex++;
      if (availableIndex === targetIndex) return localDateString(date);
    }
    date.setDate(date.getDate() + 1);
  }
  return localDateString(date);
}

// Authentication middleware helper
function getUserFromRequest(req: Request): UserProfile | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '');
  if (!token) return null;
  const profile = db.profiles.find(p => p.id === token);
  return profile || null;
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão não autorizada ou expirada.' });
  }
  (req as any).user = user;
  next();
}

// ========================
// AUTH ROUTES
// ========================
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha para criar sua conta.' });
  }

  if (typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 4 caracteres.' });
  }

  const existing = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Já existe uma conta com este e-mail. Faça login.' });
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newProfile: UserProfile = {
    id: userId,
    email: email.trim().toLowerCase(),
    full_name: (full_name || '').trim(),
    timezone: 'America/Sao_Paulo',
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const newPref: UserPreferences = {
    user_id: userId,
    preferred_days: ['seg', 'ter', 'qua', 'qui', 'sex'],
    daily_available_minutes: 30,
    preferred_time: 'morning',
    notification_preferences: {
      missions_reminders: true,
      weekly_digest: true,
      achievement_alerts: true,
      daily_start_reminder: true
    },
    assistant_response_style: 'progressive',
    updated_at: new Date().toISOString()
  };

  const newSub: Subscription = {
    id: `sub_${userId}`,
    user_id: userId,
    provider: 'delux_billing',
    status: 'trial',
    price_amount: 29.90,
    currency: 'BRL',
    trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.profiles.push(newProfile);
  db.passwords[userId] = password;
  db.preferences.push(newPref);
  db.subscriptions.push(newSub);
  saveDb(db);

  return res.json({
    token: userId,
    user: newProfile
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const profile = db.profiles.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
  if (!profile || db.passwords[profile.id] !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
  }

  return res.json({
    token: profile.id,
    user: profile
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  return res.json({ user });
});

app.post('/api/auth/complete-onboarding', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { preferences, firstGoal, name, full_name } = req.body;

  user.onboarding_completed = true;
  if (name || full_name) {
    user.full_name = (name || full_name).trim();
  }
  user.updated_at = new Date().toISOString();

  if (preferences) {
    let pref = db.preferences.find(p => p.user_id === user.id);
    if (!pref) {
      pref = {
        user_id: user.id,
        preferred_days: preferences.preferred_days || ['seg', 'ter', 'qua', 'qui', 'sex'],
        daily_available_minutes: preferences.daily_available_minutes || 30,
        preferred_time: preferences.preferred_time || 'morning',
        notification_preferences: {
          missions_reminders: true,
          weekly_digest: true,
          achievement_alerts: true,
          daily_start_reminder: true
        },
        assistant_response_style: preferences.assistant_response_style || 'progressive',
        updated_at: new Date().toISOString()
      };
      db.preferences.push(pref);
    } else {
      Object.assign(pref, preferences, { updated_at: new Date().toISOString() });
    }
  }

  if (firstGoal && firstGoal.title) {
    const goalId = `goal_${Date.now()}`;
    const newGoal: Goal = {
      id: goalId,
      user_id: user.id,
      title: firstGoal.title,
      description: firstGoal.description || '',
      category: firstGoal.category || 'personal_dev',
      desired_outcome: firstGoal.desired_outcome || firstGoal.title,
      current_state: firstGoal.current_state || '',
      priority: firstGoal.priority || 'high',
      status: 'active',
      target_date: firstGoal.target_date || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.goals.push(newGoal);

    // Diagnostic
    const diagnostic: GoalDiagnostic = {
      id: `diag_${Date.now()}`,
      goal_id: goalId,
      user_id: user.id,
      current_situation: firstGoal.current_state || 'Iniciando trajetória',
      obstacles: firstGoal.obstacles || ['Constância na rotina'],
      available_resources: [`${preferences?.daily_available_minutes || 30} minutos/dia`],
      constraints: firstGoal.constraints || 'Horário de estudos/prática',
      answers: firstGoal.answers,
      created_at: new Date().toISOString()
    };
    db.diagnostics.push(diagnostic);

    // Initial steps
    const step1: GoalStep = {
      id: `step_${Date.now()}_1`,
      goal_id: goalId,
      user_id: user.id,
      title: 'Etapa 1: Diagnóstico e Fundação',
      description: 'Estabelecer os primeiros hábitos essenciais e fundamentos da prática.',
      position: 1,
      success_criteria: 'Completar os primeiros 7 dias de execução consistente.',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const step2: GoalStep = {
      id: `step_${Date.now()}_2`,
      goal_id: goalId,
      user_id: user.id,
      title: 'Etapa 2: Aprofundamento Prático',
      description: 'Elevar a complexidade das tarefas e validar evolução.',
      position: 2,
      success_criteria: 'Superar os principais obstáculos identificados no diagnóstico.',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.steps.push(step1, step2);

    // Initial missions
    const mission1: Mission = {
      id: `mis_${Date.now()}_1`,
      goal_id: goalId,
      goal_step_id: step1.id,
      user_id: user.id,
      title: `Iniciar primeiro bloco prático: ${firstGoal.title}`,
      instructions: 'Dedique o tempo estipulado sem distrações. Anote as sensações e os pontos de melhora.',
      estimated_minutes: preferences?.daily_available_minutes || 30,
      scheduled_date: nextAvailableDate(user.id),
      scheduled_time: '09:00',
      priority: 'high',
      status: 'pending',
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.missions.push(mission1);

    db.activity_events.push({
      id: `evt_${Date.now()}`,
      user_id: user.id,
      goal_id: goalId,
      event_type: 'goal_created',
      metadata: { title: newGoal.title },
      created_at: new Date().toISOString()
    });
  }

  saveDb(db);
  return res.json({ success: true, user });
});

// Update profile
app.put('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { full_name, timezone } = req.body;
  if (full_name) user.full_name = full_name.trim();
  if (timezone) user.timezone = timezone;
  user.updated_at = new Date().toISOString();
  saveDb(db);
  return res.json({ user });
});

// Forgot password mock/token
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const exists = db.profiles.some(p => p.email.toLowerCase() === (email || '').trim().toLowerCase());
  return res.json({
    success: true,
    message: exists
      ? 'Um link de recuperação seguro foi enviado para seu e-mail (em ambiente de teste, sua senha provisória é 123456).'
      : 'Se o e-mail estiver cadastrado, as instruções serão encaminhadas.'
  });
});

// ========================
// PREFERENCES ROUTES
// ========================
app.get('/api/preferences', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  let pref = db.preferences.find(p => p.user_id === user.id);
  if (!pref) {
    pref = {
      user_id: user.id,
      preferred_days: ['seg', 'ter', 'qua', 'qui', 'sex'],
      daily_available_minutes: 30,
      preferred_time: 'morning',
      notification_preferences: {
        missions_reminders: true,
        weekly_digest: true,
        achievement_alerts: true,
        daily_start_reminder: true
      },
      assistant_response_style: 'progressive',
      updated_at: new Date().toISOString()
    };
    db.preferences.push(pref);
    saveDb(db);
  }
  return res.json({ preferences: pref });
});

app.put('/api/preferences', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  let pref = db.preferences.find(p => p.user_id === user.id);
  if (!pref) {
    pref = {
      user_id: user.id,
      preferred_days: req.body.preferred_days || ['seg', 'ter', 'qua', 'qui', 'sex'],
      daily_available_minutes: req.body.daily_available_minutes || 30,
      preferred_time: req.body.preferred_time || 'morning',
      notification_preferences: req.body.notification_preferences || {
        missions_reminders: true,
        weekly_digest: true,
        achievement_alerts: true,
        daily_start_reminder: true
      },
      assistant_response_style: req.body.assistant_response_style || 'progressive',
      updated_at: new Date().toISOString()
    };
    db.preferences.push(pref);
  } else {
    Object.assign(pref, req.body, { updated_at: new Date().toISOString() });
  }
  saveDb(db);
  return res.json({ preferences: pref });
});

// ========================
// GOALS ROUTES
// ========================
app.get('/api/goals', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const userGoals = db.goals.filter(g => g.user_id === user.id);

  // Hydrate with steps, diagnostics, missions
  const populated = userGoals.map(g => {
    const diagnostic = db.diagnostics.find(d => d.goal_id === g.id);
    const steps = db.steps.filter(s => s.goal_id === g.id).sort((a, b) => a.position - b.position);
    const missions = db.missions.filter(m => m.goal_id === g.id);
    return {
      ...g,
      diagnostic,
      steps,
      missions
    };
  });

  return res.json({ goals: populated });
});

app.get('/api/goals/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const goal = db.goals.find(g => g.id === req.params.id && g.user_id === user.id);
  if (!goal) {
    return res.status(404).json({ error: 'Objetivo não encontrado.' });
  }

  const diagnostic = db.diagnostics.find(d => d.goal_id === goal.id);
  const steps = db.steps.filter(s => s.goal_id === goal.id).sort((a, b) => a.position - b.position);
  const missions = db.missions.filter(m => m.goal_id === goal.id);

  return res.json({
    goal: {
      ...goal,
      diagnostic,
      steps,
      missions
    }
  });
});

app.post('/api/goals', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { title, description, category, desired_outcome, current_state, target_date, priority, diagnostic, steps, missions } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'O título do objetivo é obrigatório.' });
  }

  const goalId = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newGoal: Goal = {
    id: goalId,
    user_id: user.id,
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category || 'personal_dev',
    desired_outcome: desired_outcome ? desired_outcome.trim() : title.trim(),
    current_state: current_state ? current_state.trim() : '',
    target_date: target_date || undefined,
    priority: priority || 'medium',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.goals.push(newGoal);

  // Diagnostic
  if (diagnostic) {
    const newDiag: GoalDiagnostic = {
      id: `diag_${Date.now()}`,
      goal_id: goalId,
      user_id: user.id,
      current_situation: diagnostic.current_situation || current_state || '',
      obstacles: diagnostic.obstacles || [],
      available_resources: diagnostic.available_resources || [],
      constraints: diagnostic.constraints || '',
      answers: diagnostic.answers,
      created_at: new Date().toISOString()
    };
    db.diagnostics.push(newDiag);
  }

  // Steps
  if (Array.isArray(steps) && steps.length > 0) {
    steps.forEach((st: any, idx: number) => {
      const stepId = `step_${Date.now()}_${idx}`;
      db.steps.push({
        id: stepId,
        goal_id: goalId,
        user_id: user.id,
        title: st.title,
        description: st.description || '',
        position: idx + 1,
        success_criteria: st.success_criteria || '',
        status: idx === 0 ? 'in_progress' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  }

  // Initial missions if provided
  if (Array.isArray(missions) && missions.length > 0) {
    missions.forEach((m: any, idx: number) => {
      const missionId = `mis_${Date.now()}_${idx}`;
      db.missions.push({
        id: missionId,
        goal_id: goalId,
        goal_step_id: m.goal_step_id || undefined,
        user_id: user.id,
        title: m.title,
        instructions: m.instructions || '',
        estimated_minutes: m.estimated_minutes || 30,
        scheduled_date: m.scheduled_date || new Date().toISOString().split('T')[0],
        scheduled_time: m.scheduled_time || '09:00',
        priority: m.priority || 'medium',
        status: 'pending',
        position: idx + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  }

  db.activity_events.push({
    id: `evt_${Date.now()}`,
    user_id: user.id,
    goal_id: goalId,
    event_type: 'goal_created',
    metadata: { title: newGoal.title },
    created_at: new Date().toISOString()
  });

  saveDb(db);

  return res.json({
    goal: {
      ...newGoal,
      diagnostic: db.diagnostics.find(d => d.goal_id === goalId),
      steps: db.steps.filter(s => s.goal_id === goalId),
      missions: db.missions.filter(m => m.goal_id === goalId)
    }
  });
});

app.put('/api/goals/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const goal = db.goals.find(g => g.id === req.params.id && g.user_id === user.id);
  if (!goal) return res.status(404).json({ error: 'Objetivo não encontrado.' });

  const { title, description, category, desired_outcome, current_state, target_date, priority, status } = req.body;
  if (title) goal.title = title.trim();
  if (description !== undefined) goal.description = description.trim();
  if (category) goal.category = category;
  if (desired_outcome) goal.desired_outcome = desired_outcome.trim();
  if (current_state !== undefined) goal.current_state = current_state.trim();
  if (target_date !== undefined) goal.target_date = target_date;
  if (priority) goal.priority = priority;
  if (status) {
    goal.status = status;
    if (status === 'completed') {
      goal.completed_at = new Date().toISOString();
      db.activity_events.push({
        id: `evt_${Date.now()}`,
        user_id: user.id,
        goal_id: goal.id,
        event_type: 'goal_completed',
        metadata: { title: goal.title },
        created_at: new Date().toISOString()
      });
    }
  }
  goal.updated_at = new Date().toISOString();

  saveDb(db);
  return res.json({ goal });
});

app.delete('/api/goals/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const goalIndex = db.goals.findIndex(g => g.id === req.params.id && g.user_id === user.id);
  if (goalIndex === -1) return res.status(404).json({ error: 'Objetivo não encontrado.' });

  const goalId = db.goals[goalIndex].id;
  db.goals.splice(goalIndex, 1);
  db.diagnostics = db.diagnostics.filter(d => d.goal_id !== goalId);
  db.steps = db.steps.filter(s => s.goal_id !== goalId);
  db.missions = db.missions.filter(m => m.goal_id !== goalId);
  saveDb(db);

  return res.json({ success: true, message: 'Objetivo excluído com sucesso.' });
});

// Steps endpoints
app.post('/api/goals/:id/steps', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const goal = db.goals.find(g => g.id === req.params.id && g.user_id === user.id);
  if (!goal) return res.status(404).json({ error: 'Objetivo não encontrado.' });

  const { title, description, success_criteria } = req.body;
  if (!title) return res.status(400).json({ error: 'Título da etapa é obrigatório.' });

  const currentSteps = db.steps.filter(s => s.goal_id === goal.id);
  const newStep: GoalStep = {
    id: `step_${Date.now()}`,
    goal_id: goal.id,
    user_id: user.id,
    title: title.trim(),
    description: description || '',
    position: currentSteps.length + 1,
    success_criteria: success_criteria || '',
    status: currentSteps.length === 0 ? 'in_progress' : 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.steps.push(newStep);
  saveDb(db);
  return res.json({ step: newStep });
});

app.put('/api/steps/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const step = db.steps.find(s => s.id === req.params.id && s.user_id === user.id);
  if (!step) return res.status(404).json({ error: 'Etapa não encontrada.' });

  const { title, description, success_criteria, status, position } = req.body;
  if (title) step.title = title.trim();
  if (description !== undefined) step.description = description;
  if (success_criteria !== undefined) step.success_criteria = success_criteria;
  if (position !== undefined) step.position = position;
  if (status) {
    step.status = status;
    if (status === 'completed') {
      step.completed_at = new Date().toISOString();
      db.activity_events.push({
        id: `evt_${Date.now()}`,
        user_id: user.id,
        goal_id: step.goal_id,
        event_type: 'step_completed',
        metadata: { title: step.title },
        created_at: new Date().toISOString()
      });
    }
  }
  step.updated_at = new Date().toISOString();
  saveDb(db);
  return res.json({ step });
});

// ========================
// MISSIONS ROUTES
// ========================
app.get('/api/missions', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { date, status, goal_id } = req.query;

  let filtered = db.missions.filter(m => m.user_id === user.id);
  if (date) {
    filtered = filtered.filter(m => m.scheduled_date === date);
  }
  if (status) {
    filtered = filtered.filter(m => m.status === status);
  }
  if (goal_id) {
    filtered = filtered.filter(m => m.goal_id === goal_id);
  }

  // Sort by date, time, and position
  filtered.sort((a, b) => {
    if (a.scheduled_date && b.scheduled_date) {
      if (a.scheduled_date !== b.scheduled_date) return a.scheduled_date.localeCompare(b.scheduled_date);
    }
    if (a.scheduled_time && b.scheduled_time) {
      return a.scheduled_time.localeCompare(b.scheduled_time);
    }
    return a.position - b.position;
  });

  return res.json({ missions: filtered });
});

app.post('/api/missions', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { goal_id, goal_step_id, title, instructions, estimated_minutes, scheduled_date, scheduled_time, priority } = req.body;

  if (!title) return res.status(400).json({ error: 'Título da missão é obrigatório.' });
  if (!goal_id) return res.status(400).json({ error: 'Selecione o objetivo da missão.' });

  const newMission: Mission = {
    id: `mis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    goal_id,
    goal_step_id: goal_step_id || undefined,
    user_id: user.id,
    title: title.trim(),
    instructions: instructions || '',
    estimated_minutes: estimated_minutes ? parseInt(estimated_minutes, 10) : 30,
    scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
    scheduled_time: scheduled_time || undefined,
    priority: priority || 'medium',
    status: 'pending',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.missions.push(newMission);
  saveDb(db);
  return res.json({ mission: newMission });
});

app.put('/api/missions/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const mission = db.missions.find(m => m.id === req.params.id && m.user_id === user.id);
  if (!mission) return res.status(404).json({ error: 'Missão não encontrada.' });

  const { title, instructions, estimated_minutes, scheduled_date, scheduled_time, priority, status, note } = req.body;

  if (title) mission.title = title.trim();
  if (instructions !== undefined) mission.instructions = instructions;
  if (estimated_minutes !== undefined) mission.estimated_minutes = parseInt(estimated_minutes, 10);
  if (scheduled_date !== undefined) mission.scheduled_date = scheduled_date;
  if (scheduled_time !== undefined) mission.scheduled_time = scheduled_time;
  if (priority) mission.priority = priority;
  if (note !== undefined) mission.note = note;

  if (status && status !== mission.status) {
    mission.status = status;
    if (status === 'completed') {
      mission.completed_at = new Date().toISOString();
      db.activity_events.push({
        id: `evt_${Date.now()}`,
        user_id: user.id,
        goal_id: mission.goal_id,
        mission_id: mission.id,
        event_type: 'mission_completed',
        metadata: { title: mission.title },
        created_at: new Date().toISOString()
      });
    } else if (status === 'postponed') {
      db.activity_events.push({
        id: `evt_${Date.now()}`,
        user_id: user.id,
        goal_id: mission.goal_id,
        mission_id: mission.id,
        event_type: 'mission_postponed',
        metadata: { title: mission.title },
        created_at: new Date().toISOString()
      });
    }
  }

  mission.updated_at = new Date().toISOString();
  saveDb(db);
  return res.json({ mission });
});

app.delete('/api/missions/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const index = db.missions.findIndex(m => m.id === req.params.id && m.user_id === user.id);
  if (index === -1) return res.status(404).json({ error: 'Missão não encontrada.' });

  db.missions.splice(index, 1);
  saveDb(db);
  return res.json({ success: true });
});

// Toggle complete shortcut
app.post('/api/missions/:id/toggle', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const mission = db.missions.find(m => m.id === req.params.id && m.user_id === user.id);
  if (!mission) return res.status(404).json({ error: 'Missão não encontrada.' });

  if (mission.status === 'completed') {
    mission.status = 'pending';
    mission.completed_at = undefined;
  } else {
    mission.status = 'completed';
    mission.completed_at = new Date().toISOString();
    db.activity_events.push({
      id: `evt_${Date.now()}`,
      user_id: user.id,
      goal_id: mission.goal_id,
      mission_id: mission.id,
      event_type: 'mission_completed',
      metadata: { title: mission.title },
      created_at: new Date().toISOString()
    });
  }

  mission.updated_at = new Date().toISOString();
  saveDb(db);
  return res.json({ mission });
});

// ========================
// WEEKLY PLANNER & ADAPTATION
// ========================
app.get('/api/planner', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const userPreferences = db.preferences.find(p => p.user_id === user.id) || defaultPreferences;
  const userMissions = db.missions.filter(m => m.user_id === user.id);
  const userGoals = db.goals.filter(g => g.user_id === user.id);

  // Group by date for next 7 days
  const today = new Date();
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = localDateString(d);
    const dayMissions = userMissions.filter(m => m.scheduled_date === dateStr);
    const totalMinutes = dayMissions.reduce((acc, m) => acc + (m.estimated_minutes || 0), 0);
    const completedMinutes = dayMissions.filter(m => m.status === 'completed').reduce((acc, m) => acc + (m.estimated_minutes || 0), 0);
    const hasConflict = totalMinutes > userPreferences.daily_available_minutes * 1.5;

    days.push({
      date: dateStr,
      dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
      dayNumber: d.getDate(),
      isToday: i === 0,
      missions: dayMissions,
      totalMinutes,
      completedMinutes,
      availableMinutes: userPreferences.daily_available_minutes,
      hasConflict
    });
  }

  return res.json({
    days,
    goals: userGoals,
    preferences: userPreferences
  });
});

app.post('/api/planner/rebalance', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const userPreferences = db.preferences.find(p => p.user_id === user.id) || defaultPreferences;
  const todayStr = localDateString(new Date());

  // Find pending missions scheduled before today or over capacity today
  const overdueMissions = db.missions.filter(
    m => m.user_id === user.id && m.status === 'pending' && m.scheduled_date && m.scheduled_date < todayStr
  );

  let rescheduledCount = 0;
  // Redistribute evenly across the next 3 days
  overdueMissions.forEach((m, idx) => {
    const targetOffset = (idx % 3);
    const targetDate = new Date();
    targetDate.setHours(12, 0, 0, 0);
    let moved = 0;
    while (moved <= targetOffset || !getPreferredDays(user.id).includes(WEEKDAY_KEYS[targetDate.getDay()])) {
      targetDate.setDate(targetDate.getDate() + 1);
      if (getPreferredDays(user.id).includes(WEEKDAY_KEYS[targetDate.getDay()])) moved++;
    }
    m.scheduled_date = localDateString(targetDate);
    m.updated_at = new Date().toISOString();
    rescheduledCount++;
  });

  if (rescheduledCount > 0) {
    db.activity_events.push({
      id: `evt_${Date.now()}`,
      user_id: user.id,
      event_type: 'plan_adapted',
      metadata: { rescheduledCount },
      created_at: new Date().toISOString()
    });
    saveDb(db);
  }

  return res.json({
    success: true,
    rescheduledCount,
    message: `${rescheduledCount} missões redistribuídas com equilíbrio pela sua semana.`
  });
});

// ========================
// ACTIVITY EVENTS & METRICS
// ========================
app.get('/api/activity', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const events = db.activity_events.filter(e => e.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Compute operational statistics
  const userMissions = db.missions.filter(m => m.user_id === user.id);
  const totalMissions = userMissions.length;
  const completedMissions = userMissions.filter(m => m.status === 'completed').length;
  const pendingMissions = userMissions.filter(m => m.status === 'pending').length;

  const userGoals = db.goals.filter(g => g.user_id === user.id);
  const activeGoals = userGoals.filter(g => g.status === 'active').length;
  const completedGoals = userGoals.filter(g => g.status === 'completed').length;

  // Consistency streak (days with completed missions)
  const completedDates = new Set(
    userMissions.filter(m => m.status === 'completed' && m.completed_at).map(m => m.completed_at!.split('T')[0])
  );

  return res.json({
    events: events.slice(0, 50),
    metrics: {
      totalMissions,
      completedMissions,
      pendingMissions,
      completionRate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
      activeGoals,
      completedGoals,
      daysActiveCount: completedDates.size
    }
  });
});

// ========================
// NOTIFICATIONS
// ========================
app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const userNotifs = db.notifications.filter(n => n.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return res.json({ notifications: userNotifs });
});

app.post('/api/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const notif = db.notifications.find(n => n.id === req.params.id && n.user_id === user.id);
  if (notif) {
    notif.read_at = new Date().toISOString();
    saveDb(db);
  }
  return res.json({ success: true });
});

// ========================
// SUBSCRIPTIONS
// ========================
app.get('/api/subscription', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  let sub = db.subscriptions.find(s => s.user_id === user.id);
  if (!sub) {
    sub = {
      id: `sub_${user.id}`,
      user_id: user.id,
      provider: 'delux_billing',
      status: 'active',
      price_amount: 29.90,
      currency: 'BRL',
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.subscriptions.push(sub);
    saveDb(db);
  }
  return res.json({ subscription: sub });
});

app.post('/api/subscription/toggle-status', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  let sub = db.subscriptions.find(s => s.user_id === user.id);
  if (!sub) {
    sub = {
      id: `sub_${user.id}`,
      user_id: user.id,
      provider: 'delux_billing',
      status: 'active',
      price_amount: 29.90,
      currency: 'BRL',
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.subscriptions.push(sub);
  } else {
    sub.status = sub.status === 'active' ? 'canceled' : 'active';
    sub.updated_at = new Date().toISOString();
  }
  saveDb(db);
  return res.json({ subscription: sub });
});

// ========================
// ASSISTANT & AI ROUTES
// ========================
app.get('/api/assistant/conversations', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const userConvs = db.conversations.filter(c => c.user_id === user.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return res.json({ conversations: userConvs });
});

app.get('/api/assistant/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const conv = db.conversations.find(c => c.id === req.params.id && c.user_id === user.id);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada.' });

  const messages = db.messages.filter(m => m.conversation_id === conv.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  return res.json({ conversation: conv, messages });
});

app.delete('/api/assistant/conversations/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const convIndex = db.conversations.findIndex(c => c.id === req.params.id && c.user_id === user.id);
  if (convIndex === -1) return res.status(404).json({ error: 'Conversa não encontrada.' });

  db.conversations.splice(convIndex, 1);
  db.messages = db.messages.filter(m => m.conversation_id !== req.params.id);
  saveDb(db);
  return res.json({ success: true });
});

// AI Chat endpoint
app.post('/api/assistant/chat', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as UserProfile;
  const { message, conversation_id } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mensagem vazia.' });
  }

  // Find or create conversation
  let conv = db.conversations.find(c => c.id === conversation_id && c.user_id === user.id);
  if (!conv) {
    const convId = `conv_${Date.now()}`;
    conv = {
      id: convId,
      user_id: user.id,
      title: message.slice(0, 32) + (message.length > 32 ? '...' : ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.conversations.push(conv);
  } else {
    conv.updated_at = new Date().toISOString();
  }

  // Save user message
  const userMsg: AssistantMessage = {
    id: `msg_${Date.now()}_u`,
    conversation_id: conv.id,
    user_id: user.id,
    role: 'user',
    content: message.trim(),
    created_at: new Date().toISOString()
  };
  db.messages.push(userMsg);

  // Gather context from DB
  const userGoals = db.goals.filter(g => g.user_id === user.id && g.status === 'active');
  const userMissions = db.missions.filter(m => m.user_id === user.id && m.status === 'pending');
  const userPrefs = db.preferences.find(p => p.user_id === user.id);

  let assistantContent = '';
  let action: { type: 'navigate'; path: string; label: string } | null = null;
  const goalsSummary = userGoals.map(g => '- [' + g.category + '] "' + g.title + '" (Resultado pretendido: ' + g.desired_outcome + ')').join('\n');
  const missionsSummary = userMissions.slice(0, 5).map(m => '- "' + m.title + '" (' + m.estimated_minutes + ' min, prioridade: ' + m.priority + ')').join('\n');
  const asksForPlan = requestsSavedPlan(message.trim());
  const navigation = resolveNavigationIntent(message.trim());

  const personalContext = JSON.stringify(buildAssistantContext({ userId: user.id, timezone: user.timezone, preferences: userPrefs, goals: db.goals, diagnostics: db.diagnostics, steps: db.steps, missions: db.missions })).slice(0, 20000);
  const history = recentConversation(db.messages.filter(m => m.id !== userMsg.id), user.id, conv.id);
  const failChat = (error: any) => {
    db.messages = db.messages.filter(m => m.id !== userMsg.id);
    saveDb(db);
    return res.status(502).json({ error: error?.message || 'Não foi possível obter a resposta do assistente.' });
  };

  if (navigation) {
    action = navigation;
    assistantContent = 'Claro — abrindo ' + navigation.label + ' agora.';
  } else if (asksForPlan) {
    const fallbackTitle = message.trim()
      .replace(/^(por favor[, ]*)?(quero|preciso|pode|poderia|me ajude a|me ajuda a)?\s*(criar|montar|fazer|planejar|organizar|estruturar)?\s*(um|uma|o|a)?\s*(plano|planejamento|cronograma|rotina|agenda)?\s*(de|do|da|para|pra)?\s*/i, '')
      .replace(/[?.!]+$/, '').trim().slice(0, 90) || 'Plano de ação personalizado';
    let plan: any = {
      goal_title: fallbackTitle,
      goal_description: 'Plano criado a partir do pedido: ' + message.trim(),
      category: 'personal_dev',
      desired_outcome: fallbackTitle,
      current_state: '',
      steps: [
        { title: 'Preparar e definir o foco', description: 'Separar os recursos e definir um resultado claro para a sessão.', success_criteria: 'Ambiente e próxima ação definidos.' },
        { title: 'Executar a prática principal', description: 'Realizar a atividade mais importante em um bloco de foco realista.', success_criteria: 'Atividade principal concluída e registrada.' },
        { title: 'Revisar e ajustar', description: 'Avaliar o que funcionou e preparar o próximo passo.', success_criteria: 'Progresso registrado e próxima ação definida.' }
      ],
      missions: [
        { title: 'Preparar materiais e ambiente', instructions: 'Organize os materiais necessários e deixe a primeira tarefa pronta.', estimated_minutes: 15, priority: 'high', day_offset: 0, scheduled_time: '09:00', step_index: 0 },
        { title: 'Executar a primeira sessão de foco', instructions: 'Trabalhe na atividade principal sem distrações e anote obstáculos.', estimated_minutes: 25, priority: 'high', day_offset: 1, scheduled_time: '09:00', step_index: 1 },
        { title: 'Praticar e consolidar', instructions: 'Repita a atividade principal e aplique o que aprendeu.', estimated_minutes: 25, priority: 'medium', day_offset: 2, scheduled_time: '09:00', step_index: 1 },
        { title: 'Aplicar em uma tarefa concreta', instructions: 'Use o que praticou em uma entrega pequena e verificável.', estimated_minutes: 25, priority: 'medium', day_offset: 3, scheduled_time: '09:00', step_index: 2 },
        { title: 'Revisar resultados e próximos passos', instructions: 'Revise o progresso e ajuste a próxima semana.', estimated_minutes: 15, priority: 'medium', day_offset: 4, scheduled_time: '09:00', step_index: 2 }
      ]
    };

    if (genAI) {
      try {
        const planPrompt = 'Transforme o pedido em um plano REALISTA para salvar no app Delux.\nPedido: "' + message.trim() + '"\n' +
          'Tempo diário disponível: ' + (userPrefs?.daily_available_minutes || 30) + ' minutos.\n' +
          'Horário preferido: ' + (userPrefs?.preferred_time || 'flexible') + '.\n' +
          'Dias DISPONÍVEIS do usuário: ' + getPreferredDays(user.id).join(', ') + '. Não agende tarefas em outros dias da semana; o código validará e moverá datas para dias disponíveis.\nMetas existentes:\n' + (goalsSummary || 'nenhuma') + '\n' +
          'Distribua tarefas pelos próximos dias disponíveis. day_offset é o índice do dia de trabalho disponível: 0 = primeiro dia disponível a partir de hoje, 1 = próximo dia disponível, 2 = seguinte, etc. NÃO trate day_offset como dias corridos; isso evita colocar tarefas em dias errados. Se o usuário pedir segunda a sexta, distribua as tarefas sequencialmente nesses dias úteis disponíveis. Horário HH:MM; respeite o tempo disponível. ' +
          'Se o pedido se refere claramente a uma meta existente, reutilize seu título; caso contrário, dê título curto e específico.\n' +
          'Responda SOMENTE JSON válido: {"goal_title":"...","goal_description":"...","category":"health|learning|career|finance|organization|personal_dev|other","desired_outcome":"...","current_state":"...","steps":[{"title":"...","description":"...","success_criteria":"..."}],"missions":[{"title":"...","instructions":"...","estimated_minutes":25,"priority":"high|medium|low","day_offset":0,"scheduled_time":"09:00","step_index":0}]}. ' +
          'Inclua 3 etapas e 5 a 7 tarefas concretas distribuídas em vários dias.';
        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: planPrompt }] }],
          context: personalContext, history,
          config: { responseMimeType: 'application/json' }
        });
        if (response.text) {
          const match = response.text.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(match ? match[0] : response.text);
          if (parsed && Array.isArray(parsed.steps) && parsed.steps.length && Array.isArray(parsed.missions) && parsed.missions.length) {
            plan = { ...plan, ...parsed };
          }
        }
      } catch (planErr) {
        return failChat(planErr);
      }
    }

    try {
      const allowedCategories = ['health', 'learning', 'career', 'finance', 'organization', 'personal_dev', 'other'];
      const safeCategory = allowedCategories.includes(plan.category) ? plan.category : 'personal_dev';
      const normalizedTitle = String(plan.goal_title || fallbackTitle).trim().toLocaleLowerCase('pt-BR');
      let goal = db.goals.find(g => g.user_id === user.id && g.title.trim().toLocaleLowerCase('pt-BR') === normalizedTitle);
      const now = new Date().toISOString();

      if (!goal) {
        goal = {
          id: 'goal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          user_id: user.id,
          title: String(plan.goal_title || fallbackTitle).trim().slice(0, 120),
          description: String(plan.goal_description || '').trim(),
          category: safeCategory,
          desired_outcome: String(plan.desired_outcome || plan.goal_title || fallbackTitle).trim(),
          current_state: String(plan.current_state || '').trim(),
          priority: 'medium',
          status: 'active',
          created_at: now,
          updated_at: now
        };
        db.goals.push(goal);
        db.activity_events.push({
          id: 'evt_' + Date.now() + '_goal',
          user_id: user.id,
          goal_id: goal.id,
          event_type: 'goal_created',
          metadata: { title: goal.title, source: 'assistant_plan' },
          created_at: now
        });
      } else {
        goal.updated_at = now;
        if (plan.goal_description) goal.description = String(plan.goal_description);
        if (plan.desired_outcome) goal.desired_outcome = String(plan.desired_outcome);
      }

      const existingStepCount = db.steps.filter(s => s.goal_id === goal.id && s.user_id === user.id).length;
      const createdSteps: GoalStep[] = (Array.isArray(plan.steps) ? plan.steps : []).slice(0, 5).map((st: any, idx: number) => ({
        id: 'step_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 5),
        goal_id: goal.id,
        user_id: user.id,
        title: String(st.title || ('Etapa ' + (idx + 1))).trim(),
        description: String(st.description || '').trim(),
        position: existingStepCount + idx + 1,
        success_criteria: String(st.success_criteria || '').trim(),
        status: existingStepCount === 0 && idx === 0 ? 'in_progress' : 'pending',
        created_at: now,
        updated_at: now
      }));
      db.steps.push(...createdSteps);

      const existingMissionCount = db.missions.filter(m => m.goal_id === goal.id && m.user_id === user.id).length;
      const createdMissions: Mission[] = (Array.isArray(plan.missions) ? plan.missions : []).slice(0, 14).map((m: any, idx: number) => {
        const stepIndex = Number.isInteger(Number(m.step_index)) ? Number(m.step_index) : 0;
        const step = createdSteps[stepIndex] || createdSteps[0];
        const duration = Math.max(5, Math.min(180, Number(m.estimated_minutes) || (userPrefs?.daily_available_minutes || 30)));
        const priority = ['low', 'medium', 'high'].includes(m.priority) ? m.priority : 'medium';
        const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(m.scheduled_time || '')) ? String(m.scheduled_time) : '09:00';
        return {
          id: 'mis_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 5),
          goal_id: goal.id,
          goal_step_id: step?.id,
          user_id: user.id,
          title: String(m.title || ('Tarefa ' + (idx + 1))).trim(),
          instructions: String(m.instructions || '').trim(),
          estimated_minutes: duration,
          scheduled_date: nextAvailableDate(user.id, Math.max(0, Math.min(6, Math.floor(Number(m.day_offset) || 0)))),
          scheduled_time: time,
          priority,
          status: 'pending',
          position: existingMissionCount + idx + 1,
          created_at: now,
          updated_at: now
        };
      });
      if (!createdMissions.length) throw new Error('O plano não contém tarefas válidas.');
      db.missions.push(...createdMissions);
      saveDb(db);
      const persistedDb = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
      if (!Array.isArray(persistedDb.missions) || !persistedDb.missions.some((item: Mission) => item.id === createdMissions[0].id)) {
        throw new Error('O armazenamento local não confirmou a gravação do plano.');
      }

      const dayLabel = (date: string) => {
        const d = new Date(date + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
      };
      const grouped: Record<string, Mission[]> = {};
      createdMissions.forEach(mission => {
        const date = mission.scheduled_date;
        if (!date) return;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(mission);
      });
      const scheduleSummary = Object.entries(grouped).map(([date, items]) =>
        '- ' + dayLabel(date) + ': ' + items.map(item => item.scheduled_time + ' — ' + item.title + ' (' + item.estimated_minutes + ' min)').join('; ')
      ).join('\n');
      assistantContent = 'Plano salvo no Delux! Criei/atualizei o objetivo **"' + goal.title + '"**, registrei ' + createdSteps.length + ' etapas e ' + createdMissions.length + ' tarefas com datas e horários no Planejamento.\n\n**Agenda registrada:**\n' + scheduleSummary + '\n\nVocê já pode abrir a aba **Planejamento** para ver e acompanhar as tarefas. Posso ajustar os dias, horários ou a carga diária.';
    } catch (persistErr) {
      console.error('Não foi possível salvar o plano no Delux:', persistErr);
      assistantContent = 'Consegui preparar uma sugestão, mas não consegui gravá-la no Planejamento. Não vou confirmar o salvamento. Tente novamente; se continuar, vamos investigar o erro.';
    }
  } else if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: message.trim() }] }],
        context: personalContext, history
      });
      assistantContent = response.text || 'Estou à disposição para apoiar seus objetivos no Delux. Como posso ajudar com sua próxima missão?';
    } catch (aiErr: any) {
      return failChat(aiErr);
    }
  } else {
    assistantContent = getDeterministicAssistantResponse(message.trim(), user.full_name, userGoals, userMissions);
  }

  const assistantMsg: AssistantMessage = {
    id: `msg_${Date.now()}_a`,
    conversation_id: conv.id,
    user_id: user.id,
    role: 'assistant',
    content: assistantContent,
    created_at: new Date().toISOString()
  };
  db.messages.push(assistantMsg);

  saveDb(db);

  return res.json({
    conversation: conv,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    action
  });
});

// Deterministic intelligent assistant fallback
function getDeterministicAssistantResponse(query: string, name: string, goals: Goal[], missions: Mission[]): string {
  const q = query.toLowerCase();

  if (q.includes('priorizar') || q.includes('hoje') || q.includes('começar')) {
    if (missions.length > 0) {
      const first = missions[0];
      return `Olá ${name}. Para hoje, a sua prioridade mais estratégica é:

**1. ${first.title}**
- Duração estimada: ${first.estimated_minutes} min.
- Recomendação: Reserve um bloco sem distrações no seu horário habitual. Complete essa etapa antes de abrir novas frentes.

Deseja que eu divida essa atividade em subtarefas de 10 minutos?`;
    }
    return `Olá ${name}. Atualmente você não possui missões agendadas para hoje. Recomendo escolher seu objetivo ativo mais importante e definir uma ação de até 25 minutos. Deseja criar uma nova missão agora?`;
  }

  if (q.includes('consistência') || q.includes('disciplina') || q.includes('dificuldade')) {
    return `Manter consistência é uma questão de atrito e dimensão de esforço, não apenas força de vontade.

Aqui estão 3 princípios Delux recomendados para você:
1. **Reduza a barreira de entrada**: Se a missão pede 40 minutos e você está exausto, cumpra apenas os primeiros 10 minutos. O compromisso é não quebrar o hábito.
2. **Âncora temporal fixa**: Execute sempre no mesmo horário pré-estabelecido.
3. **Sem compensações acumuladas**: Se perder um dia, não tente fazer o dobro no dia seguinte. Apenas retome o ritmo habitual.

Qual o maior obstáculo que tem dificultado sua rotina esta semana?`;
  }

  if (q.includes('organizar') || q.includes('plano') || q.includes('meta') || q.includes('objetivo')) {
    if (goals.length > 0) {
      const g = goals[0];
      return `Analisando seu objetivo principal **"${g.title}"**:

- **Foco atual**: Concentrar-se no próximo marco concreto.
- **Resultado esperado**: ${g.desired_outcome || 'Evolução mensurável com prática guiada'}.

Para acelerar sua clareza, sugiro revisar as etapas dentro da aba de Objetivos ou me dizer qual barreira técnica está encontrando.`;
    }
    return `Para construirmos um plano sólido, comece definindo:
1. Qual resultado tangível você quer ver em 30 a 90 dias?
2. Quantos minutos diários você consegue garantir com tranquilidade?

Me conte um objetivo que você quer transformar em plano agora!`;
  }

  return `Entendido, ${name}. Como assistente executivo do Delux, posso ajudar você a:
- Ajustar e redistribuir seu planejamento da semana
- Quebrar metas complexas em missões de 15 a 45 minutos
- Diagnosticar onde estão os gargalos de consistência

Como prefere avançar hoje?`;
}

// Generate smart plan API
app.post('/api/assistant/generate-plan', requireAuth, async (req: Request, res: Response) => {
  const user = req.user as UserProfile;
  const personalContext = JSON.stringify(buildAssistantContext({ userId: user.id, timezone: user.timezone, preferences: db.preferences.find(p => p.user_id === user.id), goals: db.goals, diagnostics: db.diagnostics, steps: db.steps, missions: db.missions })).slice(0, 20000);
  const { title, current_state, desired_outcome, available_minutes } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Título do objetivo é obrigatório.' });
  }

  let generatedSteps = [
    {
      title: 'Etapa 1: Diagnóstico e Primeiros Hábitos',
      description: 'Mapear a situação atual, eliminar barreiras e estabelecer rotina mínima.',
      success_criteria: 'Completar 7 dias de execução sem interrupção.'
    },
    {
      title: 'Etapa 2: Construção da Base Técnica',
      description: 'Praticar os fundamentos centrais com repetição deliberada.',
      success_criteria: 'Atingir 70% de domínio nas habilidades principais da meta.'
    },
    {
      title: 'Etapa 3: Aplicação em Projetos Reais',
      description: 'Executar simulações ou projetos práticos com validação de resultados.',
      success_criteria: 'Concluir a primeira entrega mensurável pretendida.'
    }
  ];

  let generatedMissions = [
    {
      title: `Sessão de Alinhamento Inicial: ${title}`,
      instructions: 'Definir o ambiente de prática, materiais necessários e horário reservado.',
      estimated_minutes: available_minutes || 30,
      priority: 'high'
    },
    {
      title: 'Prática Deliberada dos Primeiros Fundamentos',
      instructions: 'Realizar os primeiros exercícios concentrados anotando dúvidas.',
      estimated_minutes: available_minutes || 30,
      priority: 'medium'
    }
  ];

  if (genAI) {
    try {
      const prompt = `Crie um plano de ação estruturado para o objetivo "${title}".
Contexto atual informado: "${current_state || 'Iniciante'}".
Resultado almejado: "${desired_outcome || title}".
Tempo disponível diário: ${available_minutes || 30} minutos.

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "steps": [
    {
      "title": "string curto da etapa",
      "description": "explicação concisa de até 2 linhas",
      "success_criteria": "critério claro de conclusão"
    }
  ],
  "missions": [
    {
      "title": "nome da missão prática",
      "instructions": "instruções objetivas do que executar",
      "estimated_minutes": number,
      "priority": "high" | "medium" | "low"
    }
  ]
}
Forneça exatamente 3 etapas progressivas e 3 missões iniciais práticas.`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        context: personalContext,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.steps && Array.isArray(parsed.steps)) generatedSteps = parsed.steps;
        if (parsed.missions && Array.isArray(parsed.missions)) generatedMissions = parsed.missions;
      }
    } catch (e) {
      return res.status(502).json({ error: e?.message || 'Não foi possível gerar o plano.' });
    }
  }

  return res.json({
    steps: generatedSteps,
    missions: generatedMissions
  });
});

