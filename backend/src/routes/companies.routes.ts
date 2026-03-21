// @ts-nocheck
import { Router } from 'express';
import { getCompanies, createCompanies } from '../controllers/companies.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getCompanies);
router.post('/', createCompanies);

export default router;
