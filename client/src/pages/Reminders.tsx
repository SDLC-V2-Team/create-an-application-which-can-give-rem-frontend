import { useState, useEffect } from 'react';
import ReminderForm from '../components/ReminderForm';
import ReminderList from '../components/ReminderList';
import api from '../services/api';

export default function Reminders() {
  const [reminders, setReminders] = useState<any[]>([]);

  const fetchReminders = async () => {
    const res = await api.get('/reminders');
    setReminders(res.data);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  return (
    <div>
      <h1>Your Reminders</h1>
      <ReminderForm onCreated={fetchReminders} />
      <ReminderList reminders={reminders} onDeleted={fetchReminders} />
    </div>
  );
}
