import { Router, Response } from 'express';
import { ActivityService } from '../services/activityService.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;
    const activities = ActivityService.getRecentActivities(limit);
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching activity feed' });
  }
});

export default router;
