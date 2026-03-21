// @ts-nocheck
import { Router } from 'express';
import { getWebhooks, createWebhooks } from '../controllers/webhooks.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getWebhooks);
router.post('/', createWebhooks);

export default router;
