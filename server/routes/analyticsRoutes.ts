import { Router, Response } from 'express';
import { authenticateToken, requireRecruiterOrAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { ApplicationService } from '../services/applicationService.js';
import { db } from '../db/store.js';

const router = Router();

// GET Executive Recruitment Analytics Metrics & AI Insights
router.get('/dashboard', authenticateToken, requireRecruiterOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await AnalyticsService.getPipelineMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching analytics metrics' });
  }
});

// GET Interview Success Predictions for all active applications
router.get('/predictions', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const predictions = db.applications.map((app) => AnalyticsService.predictSuccess(app));
    res.json(predictions);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error calculating predictions' });
  }
});

// GET Interview Success Prediction for specific application
router.get('/predictions/:appId', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const app = db.applications.find((a) => a.id === req.params.appId);
    if (!app) {
      return res.status(404).json({ message: 'Application record not found' });
    }
    const prediction = AnalyticsService.predictSuccess(app);
    res.json(prediction);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error calculating prediction' });
  }
});

export default router;
