import { Router } from 'express';
import { getNotifications, patchNotifications } from '../controllers/notifications.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read', patchNotifications);

export default router;
