import type { Request, Response } from 'express';
import { assistantService } from '../services/assistant.service';
import { sendSuccess } from '../utils/api-response';

export const assistantController = {
  chat: async (req: Request, res: Response) => sendSuccess(res, await assistantService.chat(req.user!.uid, req.body)),
  history: async (req: Request, res: Response) =>
    sendSuccess(res, await assistantService.history(req.user!.uid, req.query.moduleType as never)),
  summarize: async (req: Request, res: Response) =>
    sendSuccess(res, await assistantService.summarize(req.user!.uid, req.body.conversationId)),
};
