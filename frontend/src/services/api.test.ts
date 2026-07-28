import { fetchReminders, createReminder, updateReminder, deleteReminder } from './api';
import { API_BASE } from '../constants';

jest.mock('../constants', () => ({
  API_BASE: 'http://test-api/reminders',
}));

describe('API Service', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock)?.mockClear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetchReminders returns array on success', async () => {
    const mockReminders = [{ id: 1, title: 'Test' }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockReminders),
    });
    const result = await fetchReminders(1);
    expect(result).toEqual(mockReminders);
    expect(fetch).toHaveBeenCalledWith('http://test-api/reminders?userId=1');
  });

  test('fetchReminders does not append category when value is "all"', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });
    await fetchReminders(1, 'all');
    expect(fetch).toHaveBeenCalledWith('http://test-api/reminders?userId=1');
  });

  test('fetchReminders throws error when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });
    await expect(fetchReminders(1)).rejects.toThrow('Failed to fetch reminders');
  });

  test('createReminder posts data and returns created reminder', async () => {
    const newReminder = { id: 2, userId: 1, title: 'New', category: 'birthday' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(newReminder),
    });
    const data = { userId: 1, title: 'New', category: 'birthday' };
    const result = await createReminder(data);
    expect(result).toEqual(newReminder);
    expect(fetch).toHaveBeenCalledWith('http://test-api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });

  test('updateReminder throws error on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });
    await expect(updateReminder(1, { title: 'Update' })).rejects.toThrow('Failed to update reminder');
  });

  test('deleteReminder resolves successfully on OK response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });
    await expect(deleteReminder(1)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith('http://test-api/reminders/1', {
      method: 'DELETE',
    });
  });
});