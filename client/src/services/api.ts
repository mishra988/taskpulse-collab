import { ITask, IProject, IActivity, IUser } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const getHeaders = () => {
  const token = localStorage.getItem('taskflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Tasks
  async getTasks(projectId: string = 'proj_main'): Promise<ITask[]> {
    const res = await fetch(`${API_BASE}/tasks?projectId=${encodeURIComponent(projectId)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load tasks');
    return res.json();
  },

  async createTask(taskData: Partial<ITask>): Promise<ITask> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(taskId: string, updates: Partial<ITask>): Promise<ITask> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async moveTask(taskId: string, status: string, order: number = 0): Promise<ITask> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/move`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, order }),
    });
    if (!res.ok) throw new Error('Failed to move task');
    return res.json();
  },

  async deleteTask(taskId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async addComment(taskId: string, content: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  // Projects
  async getProjects(): Promise<IProject[]> {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load projects');
    return res.json();
  },

  async getActivities(projectId: string = 'proj_main'): Promise<IActivity[]> {
    const res = await fetch(`${API_BASE}/projects/activities?projectId=${encodeURIComponent(projectId)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load activities');
    return res.json();
  },

  // Auth & Team
  async getUsers(): Promise<IUser[]> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async demoLogin(userId: string): Promise<{ user: IUser; token: string }> {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to switch demo account');
    return res.json();
  },
};
