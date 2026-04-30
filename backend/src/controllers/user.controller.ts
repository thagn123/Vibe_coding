import type { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/api-response';

export const userController = {
  profile: async (req: Request, res: Response) => sendSuccess(res, await userService.getProfile(req.user!.uid)),
  updateProfile: async (req: Request, res: Response) =>
    sendSuccess(res, await userService.updateProfile(req.user!.uid, req.body)),
  progress: async (req: Request, res: Response) => sendSuccess(res, await userService.getProgress(req.user!.uid)),
  history: async (req: Request, res: Response) => sendSuccess(res, await userService.getHistory(req.user!.uid)),
  achievements: async (req: Request, res: Response) =>
    sendSuccess(res, await userService.getAchievements(req.user!.uid)),
};
