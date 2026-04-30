import { Router } from 'express';
import { helpController } from '../controllers/help.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/faq', asyncHandler(helpController.faq));

export default router;
