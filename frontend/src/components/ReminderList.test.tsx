import React from 'react';
import { render, screen } from '@testing-library/react';
import ReminderList from './ReminderList';
import { CATEGORY_COLORS } from '../constants';
import { Reminder } from '../types';

// Mock the constants to have predictable colors for testing
jest.mock('../constants', () => ({
  CATEGORY_COLORS: {
    work: '#ff0000',
    personal: '#00ff00',
  },
}));

describe('ReminderList', () => {
  const mockReminders: Reminder[] = [
    {
      id: '1',
      title: 'Meeting with team',
      description: 'Discuss project progress',
      dueDate: new Date('2025-03-20').toISOString(),
    },
    {
      id: '2',
      title: 'Buy groceries',
      description: undefined,
      dueDate: undefined,
    },
  ];

  test('renders reminders with all fields when they exist (happy path)', () => {
    render(<ReminderList category="work" reminders={mockReminders} />);

    // Section should be visible
    expect(screen.getByText('Work')).toBeInTheDocument();
    // Count badge showing number of reminders
    expect(screen.getByText('2')).toBeInTheDocument();
    // First reminder with all details
    expect(screen.getByText('Meeting with team')).toBeInTheDocument();
    expect(screen.getByText('Discuss project progress')).toBeInTheDocument();
    // Due date formatting
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  test('returns null when reminders array is empty', () => {
    const { container } = render(<ReminderList category="work" reminders={[]} />);
    expect(container.innerHTML).toBe('');
  });

  test('does not render description or due date if missing', () => {
    const reminderWithoutOptionals: Reminder = {
      id: '3',
      title: 'Simple task',
    };
    render(<ReminderList category="personal" reminders={[reminderWithoutOptionals]} />);

    expect(screen.getByText('Simple task')).toBeInTheDocument();
    // The description should not be rendered
    expect(screen.queryByText('Discuss project progress')).not.toBeInTheDocument();
    // There should be no due date text
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  test('uses fallback color (#999) for unknown category', () => {
    render(<ReminderList category="unknown" reminders={[mockReminders[0]]} />);
    const section = screen.getByText('Meeting with team').closest('.reminder-section');
    expect(section).toHaveStyle({ borderLeft: '4px solid #999' });
  });

  test('capitalizes the category name', () => {
    render(<ReminderList category="work" reminders={[mockReminders[0]]} />);
    const header = screen.getByText('Work');
    expect(header).toBeInTheDocument();
    // Ensure it's rendered as text content, not lowercased
    expect(header.tagName).toBe('H2');
  });
});