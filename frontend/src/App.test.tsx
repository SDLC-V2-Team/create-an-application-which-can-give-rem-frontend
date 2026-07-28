import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import { fetchReminders } from './services/api';
import { Reminder } from './types';

jest.mock('./services/api', () => ({
  fetchReminders: jest.fn(),
  createReminder: jest.fn(),
  updateReminder: jest.fn(),
  deleteReminder: jest.fn(),
}));

jest.mock('./components/ReminderList', () => ({
  default: ({ category, reminders }: { category: string; reminders: Reminder[] }) => (
    <div data-testid={`reminder-list-${category}`}>
      {reminders.map((r) => (
        <div key={r.id} data-testid={`reminder-${r.id}`}>{r.title}</div>
      ))}
    </div>
  ),
}));

const mockReminders: Reminder[] = [
  { id: 1, title: 'Mom bday', category: 'birthdays', date: '2023-01-01' },
  { id: 2, title: 'Meeting', category: 'work', date: '2023-02-02' },
  { id: 3, title: 'Lunch with friend', category: 'casual', date: '2023-03-03' },
  { id: 4, title: 'Grocery', category: 'other', date: '2023-04-04' },
];

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchReminders as jest.Mock).mockResolvedValue([]);
  });

  it('displays reminders grouped by category', async () => {
    (fetchReminders as jest.Mock).mockResolvedValue(mockReminders);
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    // Header and filter buttons present
    expect(screen.getByText('My Reminders')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('🎂 Birthdays')).toBeInTheDocument();
    // Every category has its own group because we're showing 'all'
    expect(screen.getByTestId('reminder-list-birthdays')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-list-work')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-list-casual')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-list-other')).toBeInTheDocument();
    // Check content inside a group
    expect(screen.getByTestId('reminder-1')).toHaveTextContent('Mom bday');
    expect(screen.getByTestId('reminder-2')).toHaveTextContent('Meeting');
    expect(screen.getByTestId('reminder-3')).toHaveTextContent('Lunch with friend');
    expect(screen.getByTestId('reminder-4')).toHaveTextContent('Grocery');
  });

  it('filters reminders by category when a filter button is clicked', async () => {
    (fetchReminders as jest.Mock).mockResolvedValue(mockReminders);
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    // Click birthday filter
    fireEvent.click(screen.getByText('🎂 Birthdays'));
    // Only birthdays group should appear
    expect(screen.getByTestId('reminder-list-birthdays')).toBeInTheDocument();
    expect(screen.queryByTestId('reminder-list-work')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reminder-list-casual')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reminder-list-other')).not.toBeInTheDocument();
    // Active class on the birthday button
    expect(screen.getByText('🎂 Birthdays').className).toContain('active');
    expect(screen.getByText('All').className).not.toContain('active');
  });

  it('shows error when fetch fails', async () => {
    (fetchReminders as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    const errorDiv = screen.getByText('Failed to load reminders');
    expect(errorDiv).toBeInTheDocument();
    expect(errorDiv).toHaveClass('error');
  });

  it('renders nothing for reminders when list is empty', async () => {
    (fetchReminders as jest.Mock).mockResolvedValue([]);
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    // No reminder list components should be rendered
    expect(screen.queryByTestId(/reminder-list-/)).not.toBeInTheDocument();
    // The header is still present
    expect(screen.getByText('My Reminders')).toBeInTheDocument();
  });
});