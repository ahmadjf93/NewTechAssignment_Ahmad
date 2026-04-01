import { Team, User } from './types';

// Use env-configured API base when available, default to local server.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Shared request helper with JSON handling and error propagation.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message || res.statusText;
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Teams endpoints.
export async function createTeam(payload: { name: string; parentId?: number | null }): Promise<Team> {
  return request<Team>('/teams', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTeam(id: number, payload: { name?: string; parentId?: number | null }): Promise<Team> {
  return request<Team>(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function getTeams(name?: string): Promise<Team[]> {
  const query = name ? `?name=${encodeURIComponent(name)}` : '';
  return request<Team[]>(`/teams${query}`);
}

export async function getTeam(id: number): Promise<Team> {
  return request<Team>(`/teams/${id}`);
}

export async function deleteTeam(id: number): Promise<void> {
  await request<void>(`/teams/${id}`, { method: 'DELETE' });
}

// Users endpoints.
export async function createUser(payload: { name: string; teamIds: number[] }): Promise<User> {
  return request<User>('/users', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateUser(id: number, payload: { name?: string; teamIds?: number[] }): Promise<User> {
  return request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function getUsers(name?: string): Promise<User[]> {
  const query = name ? `?name=${encodeURIComponent(name)}` : '';
  return request<User[]>(`/users${query}`);
}

export async function getUser(id: number): Promise<User> {
  return request<User>(`/users/${id}`);
}

export async function deleteUser(id: number): Promise<void> {
  await request<void>(`/users/${id}`, { method: 'DELETE' });
}
