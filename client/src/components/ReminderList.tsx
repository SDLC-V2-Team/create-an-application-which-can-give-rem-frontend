import api from '../services/api';

interface Reminder {
  id: number;
  title: string;
  due_time: string;
  notified: boolean;
}

interface Props {
  reminders: Reminder[];
  onDeleted: () => void;
}

export default function ReminderList({ reminders, onDeleted }: Props) {
  const handleDelete = async (id: number) => {
    await api.delete(`/reminders/${id}`);
    onDeleted();
  };

  return (
    <ul>
      {reminders.map((r) => (
        <li key={r.id}>
          <span>{r.title}</span>
          <span>{new Date(r.due_time).toLocaleString()}</span>
          <span>{r.notified ? 'Notified' : 'Pending'}</span>
          <button onClick={() => handleDelete(r.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
