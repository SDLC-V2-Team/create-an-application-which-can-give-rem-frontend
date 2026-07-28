import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReminderForm from './ReminderForm';
import api from '../services/api';

jest.mock('../services/api', () => ({
  post: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('ReminderForm', () => {
  const onCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with title input, datetime input and submit button', () => {
    const { container } = render(<ReminderForm onCreated={onCreated} />);
    expect(screen.getByPlaceholderText('Reminder title')).toBeInTheDocument();
    expect(container.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Reminder' })).toBeInTheDocument();
  });

  it('submits the form, calls api with correct data, clears inputs and calls onCreated', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1 } });
    const user = userEvent.setup();
    const { container } = render(<ReminderForm onCreated={onCreated} />);

    const titleInput = screen.getByPlaceholderText('Reminder title');
    const dueInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Add Reminder' });

    await user.clear(titleInput);
    await user.type(titleInput, 'Test Reminder');
    await user.clear(dueInput);
    await user.type(dueInput, '2025-03-15T10:00');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/reminders', {
        title: 'Test Reminder',
        due_time: new Date('2025-03-15T10:00').toISOString(),
      });
    });

    expect(titleInput).toHaveValue('');
    expect(dueInput).toHaveValue('');
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it('does not clear inputs nor call onCreated when api request fails', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    const { container } = render(<ReminderForm onCreated={onCreated} />);

    const titleInput = screen.getByPlaceholderText('Reminder title');
    const dueInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Add Reminder' });

    await user.type(titleInput, 'Test Reminder');
    await user.type(dueInput, '2025-03-15T10:00');

    await expect(user.click(submitButton)).rejects.toThrow('Network error');

    expect(titleInput).toHaveValue('Test Reminder');
    expect(dueInput).toHaveValue('2025-03-15T10:00');
    expect(onCreated).not.toHaveBeenCalled();
    expect(mockApi.post).toHaveBeenCalledTimes(1);
  });
});