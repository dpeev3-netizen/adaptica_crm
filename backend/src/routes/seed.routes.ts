// @ts-nocheck
import { Router } from 'express';
import { getSeed } from '../controllers/seed.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getSeed);

export default router;
