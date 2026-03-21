// @ts-nocheck
import { Router } from 'express';
import { getExport } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getExport);

export default router;
