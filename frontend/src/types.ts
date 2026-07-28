export interface Reminder {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  category: string; // 'birthdays' | 'work' | 'casual' | 'other'
}
