// @ts-nocheck
import { Router } from 'express';
import { getWorkflows, createWorkflows } from '../controllers/workflows.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getWorkflows);
router.post('/', createWorkflows);

export default router;
