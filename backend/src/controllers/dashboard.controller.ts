import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/api-response';

export const dashboardController = {
  summary: async (req: Request, res: Response) => sendSuccess(res, await dashboardService.summary(req.user!.uid)),
  recommendations: async (req: Request, res: Response) =>
    sendSuccess(res, await dashboardService.recommendations(req.user!.uid)),
  notifications: async (req: Request, res: Response) =>
    sendSuccess(res, await dashboardService.notifications(req.user!.uid)),
};
