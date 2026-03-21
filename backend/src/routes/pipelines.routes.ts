// @ts-nocheck
import { Router } from 'express';
import { getPipelines, createPipelines } from '../controllers/pipelines.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getPipelines);
router.post('/', createPipelines);

export default router;
