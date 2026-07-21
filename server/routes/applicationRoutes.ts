import { Router, Response } from 'express';
import { ApplicationService } from '../services/applicationService.js';
import { authenticateToken, requireRecruiterOrAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// List Applications
router.get('/', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId, candidateId, stage, page, pageSize } = req.query;
    const result = ApplicationService.listApplications({
      jobId: jobId as string,
      candidateId: candidateId as string,
      stage: stage as any,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 10,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching applications' });
  }
});

// Create Application (Link Candidate ↔ Job)
router.post('/', authenticateToken, requireRecruiterOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { candidateId, jobId } = req.body;
    if (!candidateId || !jobId) {
      return res.status(400).json({ message: 'Both candidateId and jobId are required' });
    }
    const newApp = await ApplicationService.createApplication(candidateId, jobId, req.user!);
    res.status(201).json(newApp);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error creating application' });
  }
});

// Recompute AI Match Score for Application
router.post('/:id/rescore', authenticateToken, requireRecruiterOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rescored = await ApplicationService.recomputeMatchScore(req.params.id, req.user!);
    res.json(rescored);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error recomputing AI match score' });
  }
});

// Get Recommended Unassigned Candidates for a Job
router.get('/recommended/:jobId', authenticateToken, requireRecruiterOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const recommendations = await ApplicationService.getRecommendedCandidatesForJob(req.params.jobId, limit);
    res.json(recommendations);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error fetching recommended candidates' });
  }
});

// Update Pipeline Stage
router.patch('/:id/stage', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { stage, notes } = req.body;
    if (!stage) {
      return res.status(400).json({ message: 'Target pipeline stage is required' });
    }
    const updated = ApplicationService.advanceStage(req.params.id, stage, req.user!, notes);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error advancing pipeline stage' });
  }
});

export default router;
