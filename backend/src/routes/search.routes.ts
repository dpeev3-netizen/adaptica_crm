// @ts-nocheck
import { Router } from 'express';
import { getSearch } from '../controllers/search.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getSearch);

export default router;
