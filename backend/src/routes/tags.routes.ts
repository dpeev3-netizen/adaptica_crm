// @ts-nocheck
import { Router } from 'express';
import { getTags, createTags } from '../controllers/tags.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getTags);
router.post('/', createTags);

export default router;
