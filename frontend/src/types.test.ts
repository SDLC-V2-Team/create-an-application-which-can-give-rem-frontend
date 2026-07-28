import { Reminder } from './types';

function isValidReminder(obj: unknown): obj is Reminder {
  if (typeof obj !== 'object' || obj === null) return false;
  const maybe = obj as any;
  return (
    typeof maybe.id === 'number' &&
    typeof maybe.userId === 'number' &&
    typeof maybe.title === 'string' &&
    (maybe.description === null || typeof maybe.description === 'string') &&
    (maybe.dueDate === null || typeof maybe.dueDate === 'string') &&
    typeof maybe.createdAt === 'string' &&
    typeof maybe.updatedAt === 'string' &&
    typeof maybe.category === 'string'
  );
}

describe('Reminder type', () => {
  const validBase = () => ({
    id: 1,
    userId: 100,
    title: 'Test',
    description: 'desc',
    dueDate: '2025-03-01T00:00:00Z',
    createdAt: '2025-02-25T12:00:00Z',
    updatedAt: '2025-02-25T12:00:00Z',
    category: 'birthdays',
  });

  it('should accept a valid full Reminder object', () => {
    const reminder = validBase();
    expect(isValidReminder(reminder)).toBe(true);
  });

  it('should accept Reminder with null optional fields', () => {
    const reminder = { ...validBase(), description: null, dueDate: null };
    expect(isValidReminder(reminder)).toBe(true);
  });

  it('should accept expected category values', () => {
    const categories = ['birthdays', 'work', 'casual', 'other'];
    for (const cat of categories) {
      const reminder = { ...validBase(), category: cat };
      expect(isValidReminder(reminder)).toBe(true);
      expect(reminder.category).toBe(cat);
    }
  });

  it('should accept any string as category (loose typing)', () => {
    const reminder = { ...validBase(), category: 'custom_label' };
    expect(isValidReminder(reminder)).toBe(true);
  });

  it('should reject objects missing required fields', () => {
    const invalid1 = { userId: 1, title: 'No id' };
    const invalid2 = { id: 1, title: 'No userId' };
    const invalid3 = { id: 1, userId: 1, description: 'No title' };
    expect(isValidReminder(invalid1)).toBe(false);
    expect(isValidReminder(invalid2)).toBe(false);
    expect(isValidReminder(invalid3)).toBe(false);
  });
});