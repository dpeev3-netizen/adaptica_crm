// @ts-nocheck
import { Router } from 'express';
import { getDashboard, updateTargets } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getDashboard);
router.put('/targets', updateTargets);

export default router;
