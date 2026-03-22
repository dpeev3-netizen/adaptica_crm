// @ts-nocheck
import { Router } from 'express';
import { getContacts, createContact, updateContact, bulkContacts } from '../controllers/contacts.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getContacts);
router.post('/', createContact);
router.patch('/:id', updateContact);
router.post('/bulk', bulkContacts);

export default router;
