// @ts-nocheck
import { Router } from 'express';
import { getCustomFields, createCustomFields } from '../controllers/custom-fields.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getCustomFields);
router.post('/', createCustomFields);

export default router;
