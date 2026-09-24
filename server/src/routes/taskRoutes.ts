import { Router } from 'express';
import { getTasks, createTask, updateTask, moveTask, deleteTask, addComment } from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Allow public read or demo access, but enrich with auth user if token exists
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/move', moveTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);

export default router;
