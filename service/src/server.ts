import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startBackgroundJob } from './services/background';

const PORT = process.env.PORT || 4000;

startBackgroundJob();

app.listen(PORT, () => {
  console.log(`Reminder service running on port ${PORT}`);
});
