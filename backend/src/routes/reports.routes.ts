// @ts-nocheck
import { Router } from 'express';
import { getReports } from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getReports);

export default router;
