import type { Request, Response } from 'express';
import { helpService } from '../services/help.service';
import { sendSuccess } from '../utils/api-response';

export const helpController = {
  faq: async (_req: Request, res: Response) => sendSuccess(res, await helpService.faq()),
};
