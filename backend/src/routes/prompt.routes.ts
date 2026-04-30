import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { askOpenAI } from '../integrations/openai/client';

const router = Router();
router.use(requireAuth);

router.post('/improve', async (req, res, next) => {
    try {
        const { prompt, goal, role, detailLevel } = req.body;
        const result = await askOpenAI(`Goal: ${goal}, Role: ${role}, Level: ${detailLevel}, Prompt: ${prompt}`, "You are a prompt engineer.");
        res.json({ success: true, data: { improvedPrompt: result, rationale: "Improved based on guidelines." } });
    } catch (e) { next(e); }
});

export default router;
