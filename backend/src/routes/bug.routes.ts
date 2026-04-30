import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';
import { runCode, getChallenges, getChallengeById, getHints, saveProgress, submitSolution, getCategories } from '../controllers/bug.controller';

const router = Router();

router.get('/categories', getCategories);
router.get('/challenges', getChallenges);
router.get('/challenges/:id', optionalAuth, getChallengeById);
router.get('/challenges/:id/hints', getHints);

router.post('/run', optionalAuth, runCode);

router.use(requireAuth);
router.post('/save', saveProgress);
router.post('/submit', submitSolution);

export default router;
