// @ts-nocheck
import { Router } from 'express';
import { getDeals, createDeals } from '../controllers/deals.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getDeals);
router.post('/', createDeals);

export default router;
