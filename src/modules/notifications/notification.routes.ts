import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth';
import {
  registerDeviceHandler,
  scheduleNotificationHandler,
  cancelNotificationHandler,
  updateSettingsHandler,
  getSettingsHandler,
} from './notification.controller';
import prisma from '../../shared/lib/prisma';

const router = Router();

// Rota de teste sem autenticação
router.get('/test', (req, res) => {
  res.json({ message: 'Notifications module is working', timestamp: new Date().toISOString() });
});

// Rota de teste com prisma
router.get('/test-db', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ message: 'Database working', userCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Todas as rotas de notificação requerem autenticação
router.use(authMiddleware);

// Registrar token do dispositivo
router.post('/register-device', registerDeviceHandler);

// Agendar notificação
router.post('/schedule', scheduleNotificationHandler);

// Cancelar notificação
router.delete('/cancel/:id', cancelNotificationHandler);

// Configurações de notificação
router.get('/settings', getSettingsHandler);
router.put('/settings', updateSettingsHandler);

export default router;
