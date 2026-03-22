// @ts-nocheck
import { Router } from 'express';
import { getDeals, createDeals, updateDeal, deleteDeal } from '../controllers/deals.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getDeals);
router.post('/', createDeals);
router.patch('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;
