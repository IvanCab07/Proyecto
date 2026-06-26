import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getNotifications, getUnreadCount, markRead, markAllRead,
} from '../controllers/notifications.controller';

const router = Router();

router.use(verifyToken);

router.get('/',             asyncHandler(getNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.patch('/read-all',   asyncHandler(markAllRead));
router.patch('/:id/read',   asyncHandler(markRead));

export default router;
