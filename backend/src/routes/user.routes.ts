import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { userController } from '../controllers/user.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
router.use(requireAuth);

router.get('/profile', asyncHandler(userController.profile));
router.put('/profile', asyncHandler(userController.updateProfile));
router.get('/progress', asyncHandler(userController.progress));
router.get('/history', asyncHandler(userController.history));
router.get('/achievements', asyncHandler(userController.achievements));

export default router;
