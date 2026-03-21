// @ts-nocheck
import { Router } from 'express';
import { getActivities, createActivity } from '../controllers/activities.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getActivities);
router.post('/', createActivity);

export default router;
