// @ts-nocheck
import { Router } from 'express';
import { createCustomFieldValues } from '../controllers/custom-field-values.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createCustomFieldValues);

export default router;
