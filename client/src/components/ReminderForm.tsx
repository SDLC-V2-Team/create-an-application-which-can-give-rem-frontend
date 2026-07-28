import { useState, FormEvent } from 'react';
import api from '../services/api';

interface Props {
  onCreated: () => void;
}

export default function ReminderForm({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [dueTime, setDueTime] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/reminders', {
      title,
      due_time: new Date(dueTime).toISOString(),
    });
    setTitle('');
    setDueTime('');
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Reminder title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="datetime-local"
        value={dueTime}
        onChange={(e) => setDueTime(e.target.value)}
        required
      />
      <button type="submit">Add Reminder</button>
    </form>
  );
}
