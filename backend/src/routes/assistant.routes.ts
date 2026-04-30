import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { agentApp } from '../features/ai-agent/agent/graph';
import { HumanMessage } from "@langchain/core/messages";

const router = Router();
router.use(requireAuth);

router.post('/chat', async (req, res, next) => {
    try {
        const { moduleType, message, context, conversationId } = req.body;
        const uid = req.user!.uid;
        
        const threadId = conversationId || `${uid}_${Date.now()}`;
        const config = { configurable: { thread_id: threadId } };
        const intent = moduleType === 'find_bug' ? 'debug' : 'general';

        const result = await agentApp.invoke(
            { 
                messages: [new HumanMessage(message)], 
                context,
                intent
            },
            config
        );
        
        const reply = result.messages[result.messages.length - 1].content.toString();
        res.json({ success: true, data: { conversationId: threadId, reply } });
    } catch (e) { next(e); }
});

export default router;
