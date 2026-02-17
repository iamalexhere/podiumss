// Use same-origin in production (when served by backend)
// Use localhost:8080 in development (when Vite dev server runs separately)
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:8080' : '');

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}/api${path}`, config);
  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data.data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) => 
      request<{ token: string; user: { id: number; email: string; name: string } }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    me: () => 
      request<{ id: number; email: string; name: string }>('/auth/me', { auth: true }),
  },

  events: {
    list: () => 
      request<Array<{ id: number; name: string; slug: string; status: string }>>('/events'),
    getBySlug: (slug: string) => 
      request<{ id: number; name: string; slug: string; description: string; status: string }>(`/events/${slug}`),
    leaderboard: (slug: string) => 
      request<Array<{ group_id: number; group_name: string; group_color: string; total_score: number }>>(`/events/${slug}/leaderboard`),
    groups: (slug: string) => 
      request<Array<{ id: number; name: string; color: string; participants: Array<{ id: number; name: string }> }>>(`/events/${slug}/groups`),
    games: (slug: string) => 
      request<Array<{ id: number; name: string; status: string; scoring_mode: string; description?: string; sort_order: number }>>(`/events/${slug}/games`),
    scores: (slug: string) => 
      request<Array<{ id: number; game_id: number; group_id: number; value: number; note?: string; created_at?: string; group?: { id: number; name: string; color?: string } }>>(`/events/${slug}/scores`),
  },

  admin: {
    events: {
      list: () => 
        request<Array<{ id: number; name: string; slug: string; status: string; description?: string }>>('/admin/events', { auth: true }),
      create: (data: { name: string; description?: string; status?: string }) => 
        request<{ id: number; name: string; slug: string }>('/admin/events', { method: 'POST', body: data, auth: true }),
      update: (id: number, data: { name?: string; description?: string; status?: string }) => 
        request<{ id: number; name: string }>(`/admin/events/${id}`, { method: 'PUT', body: data, auth: true }),
      delete: (id: number) => 
        request<{ message: string }>(`/admin/events/${id}`, { method: 'DELETE', auth: true }),
    },

    groups: {
      create: (eventId: number, data: { name: string; color?: string; sort_order?: number }) => 
        request<{ id: number; name: string }>(`/admin/events/${eventId}/groups`, { method: 'POST', body: data, auth: true }),
      update: (id: number, data: { name?: string; color?: string; sort_order?: number }) => 
        request<{ id: number; name: string }>(`/admin/groups/${id}`, { method: 'PUT', body: data, auth: true }),
      delete: (id: number) => 
        request<{ message: string }>(`/admin/groups/${id}`, { method: 'DELETE', auth: true }),
    },

    participants: {
      create: (groupId: number, name: string) => 
        request<{ id: number; name: string }>(`/admin/groups/${groupId}/participants`, { method: 'POST', body: { name }, auth: true }),
      delete: (id: number) => 
        request<{ message: string }>(`/admin/participants/${id}`, { method: 'DELETE', auth: true }),
    },

    games: {
      create: (eventId: number, data: { name: string; description?: string; scoring_mode?: string; status?: string; sort_order?: number }) => 
        request<{ id: number; name: string }>(`/admin/events/${eventId}/games`, { method: 'POST', body: data, auth: true }),
      update: (id: number, data: { name?: string; description?: string; status?: string; sort_order?: number }) => 
        request<{ id: number; name: string }>(`/admin/games/${id}`, { method: 'PUT', body: data, auth: true }),
      delete: (id: number) => 
        request<{ message: string }>(`/admin/games/${id}`, { method: 'DELETE', auth: true }),
    },

    scores: {
      create: (gameId: number, data: { group_id: number; value: number; note?: string }) => 
        request<{ id: number; value: number }>(`/admin/games/${gameId}/scores`, { method: 'POST', body: data, auth: true }),
      update: (id: number, data: { group_id?: number; value?: number; note?: string }) => 
        request<{ id: number; value: number }>(`/admin/scores/${id}`, { method: 'PUT', body: data, auth: true }),
      delete: (id: number) => 
        request<{ message: string }>(`/admin/scores/${id}`, { method: 'DELETE', auth: true }),
    },

    users: {
      list: () => 
        request<Array<{ id: number; email: string; name: string }>>('/admin/users', { auth: true }),
      create: (data: { email: string; password: string; name?: string }) => 
        request<{ id: number; email: string; name: string }>('/admin/users', { method: 'POST', body: data, auth: true }),
      resetPassword: (id: number, password: string) => 
        request<{ message: string }>(`/admin/users/${id}/password`, { method: 'PUT', body: { password }, auth: true }),
      delete: (id: number) => 
        request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE', auth: true }),
    },
  },

  websocket: (slug: string): WebSocket => {
    const wsUrl = API_URL.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/api/events/${slug}/ws`);
  },
};

export default api;