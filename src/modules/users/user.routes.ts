import { Router } from 'express';
import {
  createUserHandler,
  getUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
  loginUserHandler,
  registerHandler,
  loginHandler,
  getCurrentUserHandler,
} from './user.controller';
import { authMiddleware } from '../../shared/middlewares/auth';
import { authRateLimit } from '../../shared/middlewares/rate-limit';

const router = Router();

// Auth routes (não precisam de autenticação) - com rate limiting restritivo
router.post('/register', authRateLimit, registerHandler);
router.post('/login', authRateLimit, loginHandler);

// User CRUD routes (precisam de autenticação)
router.use(authMiddleware);
router.get('/me', getCurrentUserHandler);
router.get('/', getUsersHandler);
router.get('/:id', getUserByIdHandler);
router.post('/', createUserHandler);
router.post('/login', loginUserHandler);
router.put('/:id', updateUserHandler);
router.delete('/:id', deleteUserHandler);

export default router;
