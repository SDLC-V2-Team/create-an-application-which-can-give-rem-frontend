import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import Reminders from './Reminders';
import api from '../services/api';

jest.mock('../services/api');
jest.mock('../components/ReminderForm', () => (props: any) => {
  (<any>global).__reminderFormProps = props;
  return <div data-testid="reminder-form" />;
});
jest.mock('../components/ReminderList', () => (props: any) => {
  (<any>global).__reminderListProps = props;
  return <div data-testid="reminder-list" />;
});

const mockApiGet = api.get as jest.Mock;

describe('Reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (<any>global).__reminderFormProps;
    delete (<any>global).__reminderListProps;
  });

  it('fetches reminders on mount and passes them to ReminderList', async () => {
    const mockReminders = [{ id: 1, title: 'Test' }];
    mockApiGet.mockResolvedValueOnce({ data: mockReminders });

    render(<Reminders />);

    // Title rendered
    expect(screen.getByText('Your Reminders')).toBeInTheDocument();

    // Wait for the async fetch to complete and state to update
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('/reminders');
    });

    // ReminderList should receive the fetched reminders
    const reminderListProps = (<any>global).__reminderListProps;
    expect(reminderListProps).toBeDefined();
    expect(reminderListProps.reminders).toEqual(mockReminders);
  });

  it('re-fetches reminders when ReminderForm calls onCreated', async () => {
    // Setup initial fetch
    const initialReminders = [{ id: 1, title: 'Initial' }];
    mockApiGet.mockResolvedValueOnce({ data: initialReminders });

    render(<Reminders />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });

    // Capture onCreated callback from ReminderForm
    const formProps = (<any>global).__reminderFormProps;
    expect(formProps).toBeDefined();
    expect(formProps.onCreated).toBeInstanceOf(Function);

    // Prepare new data for second fetch
    const newReminders = [{ id: 2, title: 'New' }];
    mockApiGet.mockResolvedValueOnce({ data: newReminders });

    // Simulate form submission
    await act(async () => {
      formProps.onCreated();
    });

    // Should have called api.get again
    expect(mockApiGet).toHaveBeenCalledTimes(2);

    // ReminderList should receive the new reminders after re-fetch
    await waitFor(() => {
      const reminderListProps = (<any>global).__reminderListProps;
      expect(reminderListProps.reminders).toEqual(newReminders);
    });
  });

  it('re-fetches reminders when ReminderList calls onDeleted', async () => {
    // Setup initial fetch
    const initialReminders = [{ id: 1, title: 'Initial' }];
    mockApiGet.mockResolvedValueOnce({ data: initialReminders });

    render(<Reminders />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });

    // Capture onDeleted callback from ReminderList
    const listProps = (<any>global).__reminderListProps;
    expect(listProps).toBeDefined();
    expect(listProps.onDeleted).toBeInstanceOf(Function);

    // New data after deletion
    const updatedReminders = [{ id: 2, title: 'Updated' }];
    mockApiGet.mockResolvedValueOnce({ data: updatedReminders });

    // Simulate deletion
    await act(async () => {
      listProps.onDeleted();
    });

    // Should have called api.get again
    expect(mockApiGet).toHaveBeenCalledTimes(2);

    // ReminderList should receive updated data
    await waitFor(() => {
      const listProps = (<any>global).__reminderListProps;
      expect(listProps.reminders).toEqual(updatedReminders);
    });
  });

  it('handles API failure gracefully and shows empty reminders', async () => {
    // Simulate API rejection
    mockApiGet.mockRejectedValueOnce(new Error('Network error'));

    render(<Reminders />);

    // Title should still render
    expect(screen.getByText('Your Reminders')).toBeInTheDocument();

    // Wait for the fetch (which will reject) to be attempted
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });

    // Component should not crash, and ReminderList receives initial empty array
    const listProps = (<any>global).__reminderListProps;
    expect(listProps).toBeDefined();
    expect(listProps.reminders).toEqual([]);

    // No error thrown to the user; console might show unhandled rejection but that's acceptable
  });
});