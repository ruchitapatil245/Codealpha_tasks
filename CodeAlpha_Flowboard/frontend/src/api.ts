const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(typeof err.error === 'string' ? err.error : 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (data: { email: string; name: string; password: string }) =>
    request<{ user: import('./types').User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ user: import('./types').User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<import('./types').User>('/auth/me'),

  searchUsers: (q: string) =>
    request<import('./types').User[]>(`/auth/search?q=${encodeURIComponent(q)}`),

  getProjects: () => request<import('./types').Project[]>('/projects'),

  createProject: (data: { name: string; description?: string }) =>
    request<import('./types').Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProject: (id: string) => request<import('./types').Project>(`/projects/${id}`),

  addMember: (projectId: string, userId: string) =>
    request(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  removeMember: (projectId: string, userId: string) =>
    request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),

  createColumn: (projectId: string, title: string) =>
    request<import('./types').Column>(`/projects/${projectId}/columns`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  createTask: (columnId: string, data: Partial<import('./types').Task>) =>
    request<import('./types').Task>(`/columns/${columnId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTask: (taskId: string) => request<import('./types').TaskDetail>(`/tasks/${taskId}`),

  updateTask: (taskId: string, data: Record<string, unknown>) =>
    request<import('./types').Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTask: (taskId: string) =>
    request(`/tasks/${taskId}`, { method: 'DELETE' }),

  addComment: (taskId: string, content: string) =>
    request<import('./types').Comment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getNotifications: () => request<import('./types').Notification[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PATCH' }),
};

export function getSocketUrl() {
  return import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;
}
