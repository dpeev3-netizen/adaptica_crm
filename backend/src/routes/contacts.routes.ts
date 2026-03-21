// @ts-nocheck
import { Router } from 'express';
import { getContacts, createContact } from '../controllers/contacts.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getContacts);
router.post('/', createContact);

export default router;
