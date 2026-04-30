import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(requireAuth);
router.get('/summary', asyncHandler(dashboardController.summary));
router.get('/recommendations', asyncHandler(dashboardController.recommendations));
router.get('/notifications', asyncHandler(dashboardController.notifications));

export default router;
