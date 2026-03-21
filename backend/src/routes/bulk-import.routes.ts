// @ts-nocheck
import { Router } from 'express';
import { createBulkImport } from '../controllers/bulk-import.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createBulkImport);

export default router;
