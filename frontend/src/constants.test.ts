import { CATEGORY_COLORS, API_BASE } from './constants';

describe('CATEGORY_COLORS', () => {
  it('should define colors for birthdays, work, casual, and other', () => {
    expect(CATEGORY_COLORS.birthdays).toBe('#FF69B4');
    expect(CATEGORY_COLORS.work).toBe('#4A90E2');
    expect(CATEGORY_COLORS.casual).toBe('#50C878');
    expect(CATEGORY_COLORS.other).toBe('#A9A9A9');
  });

  it('should only contain expected categories (birthdays, work, casual, other)', () => {
    const keys = Object.keys(CATEGORY_COLORS);
    expect(keys).toHaveLength(4);
    expect(keys).toEqual(expect.arrayContaining(['birthdays', 'work', 'casual', 'other']));
  });

  it('should have valid hex color values', () => {
    Object.values(CATEGORY_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });
  });
});

describe('API_BASE', () => {
  it('should be "/api/reminders"', () => {
    expect(API_BASE).toBe('/api/reminders');
  });
});