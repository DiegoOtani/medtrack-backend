import app from './app';
import { jobScheduler } from './jobs/scheduler';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0'; // Aceita conexões de qualquer IP

const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Also accessible at http://localhost:${PORT}`);

  // Iniciar jobs em background
  jobScheduler.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  jobScheduler.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  jobScheduler.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
