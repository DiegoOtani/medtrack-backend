import { Router } from 'express';
import medicationRoutes from './modules/medications/medication.routes';
import userRoutes from './modules/users/user.routes';
import schedulesRoutes from './modules/schedules/schedules.routes';
import historyRoutes from './modules/history/history.routes';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

router.use('/medications', medicationRoutes);
router.use('/users', userRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/history', historyRoutes);

export default router;
