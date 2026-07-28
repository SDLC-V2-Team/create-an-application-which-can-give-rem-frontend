import { Reminder } from '../types';
import { API_BASE } from '../constants';

export async function fetchReminders(userId: number, category?: string): Promise<Reminder[]> {
  const params = new URLSearchParams({ userId: userId.toString() });
  if (category && category !== 'all') {
    params.append('category', category);
  }
  const response = await fetch(`${API_BASE}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch reminders');
  return response.json();
}

export async function createReminder(data: Partial<Reminder> & { userId: number; title: string }): Promise<Reminder> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create reminder');
  return response.json();
}

export async function updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update reminder');
  return response.json();
}

export async function deleteReminder(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete reminder');
}
