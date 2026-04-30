import type { Request, Response } from 'express';
import { promptService } from '../services/prompt.service';
import { sendSuccess } from '../utils/api-response';

export const promptController = {
  generate: async (req: Request, res: Response) => sendSuccess(res, await promptService.generate(req.user!.uid, req.body)),
  improve: async (req: Request, res: Response) => sendSuccess(res, await promptService.improve(req.user!.uid, req.body)),
  rewrite: async (req: Request, res: Response) => sendSuccess(res, await promptService.rewrite(req.user!.uid, req.body)),
  history: async (req: Request, res: Response) => sendSuccess(res, await promptService.history(req.user!.uid)),
  save: async (req: Request, res: Response) => sendSuccess(res, await promptService.save(req.user!.uid, req.body), 201),
  remove: async (req: Request, res: Response) => sendSuccess(res, await promptService.remove(req.user!.uid, req.params.promptId)),
};
