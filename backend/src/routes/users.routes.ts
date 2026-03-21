// @ts-nocheck
import { Router } from 'express';
import { getUsers } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getUsers);

export default router;
