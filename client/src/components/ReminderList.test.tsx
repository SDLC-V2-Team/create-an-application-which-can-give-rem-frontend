import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReminderList from './ReminderList';
import api from '../services/api';

jest.mock('../services/api', () => ({
  default: {
    delete: jest.fn(),
  },
}));

describe('ReminderList', () => {
  const mockOnDeleted = jest.fn();

  const sampleReminders = [
    { id: 1, title: 'Buy milk', due_time: '2025-04-14T10:00:00Z', notified: false },
    { id: 2, title: 'Call dentist', due_time: '2025-04-15T14:30:00Z', notified: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.removeAllListeners('unhandledRejection');
  });

  it('renders a list of reminders with title, formatted date, and status', () => {
    render(<ReminderList reminders={sampleReminders} onDeleted={mockOnDeleted} />);

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Call dentist')).toBeInTheDocument();

    // check formatted dates
    const date1 = new Date('2025-04-14T10:00:00Z').toLocaleString();
    const date2 = new Date('2025-04-15T14:30:00Z').toLocaleString();
    expect(screen.getByText(date1)).toBeInTheDocument();
    expect(screen.getByText(date2)).toBeInTheDocument();

    // check statuses
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Notified')).toBeInTheDocument();
  });

  it('shows "Notified" for notified:true and "Pending" for notified:false', () => {
    const reminders = [
      { id: 3, title: 'Task A', due_time: '2025-04-16T08:00:00Z', notified: true },
      { id: 4, title: 'Task B', due_time: '2025-04-17T09:00:00Z', notified: false },
    ];
    render(<ReminderList reminders={reminders} onDeleted={mockOnDeleted} />);

    expect(screen.getByText('Notified')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('calls api.delete and onDeleted when delete button is clicked', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);
    render(<ReminderList reminders={sampleReminders} onDeleted={mockOnDeleted} />);

    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/reminders/1');
      expect(mockOnDeleted).toHaveBeenCalledTimes(1);
    });
  });

  it('handles empty reminders array by rendering an empty list', () => {
    render(<ReminderList reminders={[]} onDeleted={mockOnDeleted} />);
    const list = screen.getByRole('list');
    expect(list).toBeEmptyDOMElement();
  });

  it('renders "Invalid Date" when due_time is an invalid date string', () => {
    const reminders = [{ id: 5, title: 'Invalid date entry', due_time: 'not-a-date', notified: false }];
    render(<ReminderList reminders={reminders} onDeleted={mockOnDeleted} />);

    expect(screen.getByText('Invalid Date')).toBeInTheDocument();
  });

  it('throws an unhandled rejection error if api.delete fails and does not call onDeleted', async () => {
    (api.delete as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));
    const unhandledRejectionHandler = jest.fn();
    process.on('unhandledRejection', unhandledRejectionHandler);

    render(<ReminderList reminders={sampleReminders} onDeleted={mockOnDeleted} />);
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(unhandledRejectionHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    expect(mockOnDeleted).not.toHaveBeenCalled();
  });
});