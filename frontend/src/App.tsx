import { useState, useEffect, useMemo } from 'react';
import ReminderList from './components/ReminderList';
import { fetchReminders, createReminder, updateReminder, deleteReminder } from './services/api';
import { Reminder } from './types';
import './App.css';

function App() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await fetchReminders(1); // hardcoded userId=1 for simplicity
      setReminders(data);
    } catch (err) {
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const filteredReminders = useMemo(() => {
    if (activeCategory === 'all') return reminders;
    return reminders.filter((r) => r.category === activeCategory);
  }, [reminders, activeCategory]);

  const groupedReminders = useMemo(() => {
    return filteredReminders.reduce((acc, reminder) => {
      const cat = reminder.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(reminder);
      return acc;
    }, {} as Record<string, Reminder[]>);
  }, [filteredReminders]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="app">
      <h1>My Reminders</h1>
      <div className="filter-bar">
        <button
          className={activeCategory === 'all' ? 'active' : ''}
          onClick={() => handleCategoryChange('all')}
        >
          All
        </button>
        <button
          className={activeCategory === 'birthdays' ? 'active' : ''}
          onClick={() => handleCategoryChange('birthdays')}
        >
          🎂 Birthdays
        </button>
        <button
          className={activeCategory === 'work' ? 'active' : ''}
          onClick={() => handleCategoryChange('work')}
        >
          💼 Work
        </button>
        <button
          className={activeCategory === 'casual' ? 'active' : ''}
          onClick={() => handleCategoryChange('casual')}
        >
          🎉 Casual
        </button>
        <button
          className={activeCategory === 'other' ? 'active' : ''}
          onClick={() => handleCategoryChange('other')}
        >
          📌 Other
        </button>
      </div>
      {Object.entries(groupedReminders).map(([category, catReminders]) => (
        <ReminderList
          key={category}
          category={category}
          reminders={catReminders}
        />
      ))}
    </div>
  );
}

export default App;
