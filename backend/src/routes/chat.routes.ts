import { Router } from 'express';
import { getChannels, getMessages, sendMessage, reactToMessage, markAsRead, openDm, uploadAttachment } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/channels', getChannels);
router.post('/dm', openDm);
router.post('/upload', uploadAttachment);
router.get('/channels/:id/messages', getMessages);
router.post('/channels/:id/messages', sendMessage);
router.post('/channels/:id/reactions', reactToMessage);
router.post('/channels/:id/read', markAsRead);

export default router;
