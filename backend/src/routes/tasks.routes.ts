// @ts-nocheck
import { Router } from 'express';
import { getTasks, createTasks } from '../controllers/tasks.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getTasks);
router.post('/', createTasks);

export default router;
