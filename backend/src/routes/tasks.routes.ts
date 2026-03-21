// @ts-nocheck
import { Router } from 'express';
import { getTasks, createTasks, updateTask, deleteTask } from '../controllers/tasks.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getTasks);
router.post('/', createTasks);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
