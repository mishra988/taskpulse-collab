import { Router } from 'express';
import { register, login, demoLogin, getMe, getAllUsers } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', authenticateToken, getMe);
router.get('/users', getAllUsers);

export default router;
