import { Reminder } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface ReminderListProps {
  category: string;
  reminders: Reminder[];
}

function ReminderList({ category, reminders }: ReminderListProps) {
  const color = CATEGORY_COLORS[category] || '#999';

  if (reminders.length === 0) return null;

  return (
    <div className="reminder-section" style={{ borderLeft: `4px solid ${color}` }}>
      <h2 className="section-header" style={{ color }}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
        <span className="count-badge">{reminders.length}</span>
      </h2>
      <ul className="reminder-list">
        {reminders.map((reminder) => (
          <li key={reminder.id} className="reminder-item">
            <div className="reminder-title">{reminder.title}</div>
            {reminder.description && (
              <div className="reminder-description">{reminder.description}</div>
            )}
            {reminder.dueDate && (
              <div className="reminder-due">Due: {new Date(reminder.dueDate).toLocaleDateString()}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReminderList;
