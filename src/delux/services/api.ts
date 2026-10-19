import {
  UserProfile,
  UserPreferences,
  Goal,
  GoalStep,
  Mission,
  ActivityEvent,
  AssistantConversation,
  AssistantMessage,
  AppNotification,
  Subscription
} from '../types';

const TOKEN_KEY = 'delux_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    // Supabase session storage is independent from the legacy demo token.
    localStorage.removeItem('delux_supabase_session');
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : undefined;

    // Billing/subscription code is deliberately left on its existing legacy path.
    // The user-data API below no longer uses the browser-side demo server.
    if (endpoint.startsWith('/api/subscription')) {
      const token = this.getToken();
      const { handleLocalRequest } = await import('./localServer');
      const { status, payload } = await handleLocalRequest(method, endpoint, body, token);
      if (status >= 400) throw new Error(payload?.error || 'Erro na requisição.');
      return JSON.parse(JSON.stringify(payload));
    }

    const { handleSupabaseRequest } = await import('./supabaseAdapter');
    return await handleSupabaseRequest(method, endpoint, body) as T;
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const data = await this.request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return data;
  },

  async register(email: string, password: string, full_name: string = ''): Promise<{ token: string; user: UserProfile }> {
    const data = await this.request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name })
    });
    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>('/api/auth/me');
  },

  async completeOnboarding(data: { preferences: any; firstGoal?: any; full_name?: string; name?: string }): Promise<{ success: boolean; user: UserProfile }> {
    return this.request<{ success: boolean; user: UserProfile }>('/api/auth/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateProfile(profileData: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Preferences
  async getPreferences(): Promise<{ preferences: UserPreferences }> {
    return this.request<{ preferences: UserPreferences }>('/api/preferences');
  },

  async updatePreferences(pref: Partial<UserPreferences>): Promise<{ preferences: UserPreferences }> {
    return this.request<{ preferences: UserPreferences }>('/api/preferences', {
      method: 'PUT',
      body: JSON.stringify(pref)
    });
  },

  // Goals
  async getGoals(): Promise<{ goals: Goal[] }> {
    return this.request<{ goals: Goal[] }>('/api/goals');
  },

  async getGoal(id: string): Promise<{ goal: Goal }> {
    return this.request<{ goal: Goal }>(`/api/goals/${id}`);
  },

  async createGoal(payload: Omit<Partial<Goal>, 'diagnostic' | 'steps' | 'missions'> & { diagnostic?: any; steps?: any[]; missions?: any[] }): Promise<{ goal: Goal }> {
    return this.request<{ goal: Goal }>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateGoal(id: string, payload: Partial<Goal>): Promise<{ goal: Goal }> {
    return this.request<{ goal: Goal }>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteGoal(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/goals/${id}`, {
      method: 'DELETE'
    });
  },

  async createGoalStep(goalId: string, payload: { title: string; description?: string; success_criteria?: string }): Promise<{ step: GoalStep }> {
    return this.request<{ step: GoalStep }>(`/api/goals/${goalId}/steps`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateGoalStep(stepId: string, payload: Partial<GoalStep>): Promise<{ step: GoalStep }> {
    return this.request<{ step: GoalStep }>(`/api/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  // Missions
  async getMissions(params?: { date?: string; status?: string; goal_id?: string }): Promise<{ missions: Mission[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ missions: Mission[] }>(`/api/missions${query ? `?${query}` : ''}`);
  },

  async createMission(payload: Partial<Mission>): Promise<{ mission: Mission }> {
    return this.request<{ mission: Mission }>('/api/missions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateMission(id: string, payload: Partial<Mission>): Promise<{ mission: Mission }> {
    return this.request<{ mission: Mission }>(`/api/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async toggleMission(id: string): Promise<{ mission: Mission }> {
    return this.request<{ mission: Mission }>(`/api/missions/${id}/toggle`, {
      method: 'POST'
    });
  },

  async deleteMission(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/missions/${id}`, {
      method: 'DELETE'
    });
  },

  // Planner
  async getPlanner(): Promise<{ days: any[]; goals: Goal[]; preferences: UserPreferences }> {
    return this.request<{ days: any[]; goals: Goal[]; preferences: UserPreferences }>('/api/planner');
  },

  async rebalancePlanner(): Promise<{ success: boolean; rescheduledCount: number; message: string }> {
    return this.request<{ success: boolean; rescheduledCount: number; message: string }>('/api/planner/rebalance', {
      method: 'POST'
    });
  },

  // Activity & Metrics
  async getActivity(): Promise<{ events: ActivityEvent[]; metrics: any }> {
    return this.request<{ events: ActivityEvent[]; metrics: any }>('/api/activity');
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: AppNotification[] }> {
    return this.request<{ notifications: AppNotification[] }>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST'
    });
  },

  // Subscription
  async getSubscription(): Promise<{ subscription: Subscription }> {
    return this.request<{ subscription: Subscription }>('/api/subscription');
  },

  async toggleSubscription(): Promise<{ subscription: Subscription }> {
    return this.request<{ subscription: Subscription }>('/api/subscription/toggle-status', {
      method: 'POST'
    });
  },

  // Assistant
  async getConversations(): Promise<{ conversations: AssistantConversation[] }> {
    return this.request<{ conversations: AssistantConversation[] }>('/api/assistant/conversations');
  },

  async getMessages(conversationId: string): Promise<{ conversation: AssistantConversation; messages: AssistantMessage[] }> {
    return this.request<{ conversation: AssistantConversation; messages: AssistantMessage[] }>(`/api/assistant/conversations/${conversationId}/messages`);
  },

  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/assistant/conversations/${conversationId}`, {
      method: 'DELETE'
    });
  },

  async sendChatMessage(message: string, conversation_id?: string): Promise<{ conversation: AssistantConversation; userMessage: AssistantMessage; assistantMessage: AssistantMessage }> {
    return this.request<{ conversation: AssistantConversation; userMessage: AssistantMessage; assistantMessage: AssistantMessage }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id })
    });
  },

  async generatePlan(payload: { title: string; current_state?: string; desired_outcome?: string; available_minutes?: number }): Promise<{ steps: any[]; missions: any[] }> {
    return this.request<{ steps: any[]; missions: any[] }>('/api/assistant/generate-plan', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
