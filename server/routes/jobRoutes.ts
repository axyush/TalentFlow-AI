import { Router, Response } from 'express';
import { JobService } from '../services/jobService.js';
import { authenticateToken, requireRecruiterOrAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// List Jobs (Search, filter by skill, client, status, experience, jobType, paginate)
router.get('/', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, skill, clientId, status, experienceLevel, jobType, page, pageSize, sortBy, sortOrder } = req.query;
    const result = JobService.listJobs({
      search: search as string,
      skill: skill as string,
      clientId: clientId as string,
      status: status as any,
      experienceLevel: experienceLevel as any,
      jobType: jobType as any,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 10,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching job postings' });
  }
});

// Get Job by ID
router.get('/:id', authenticateToken, requireRecruiterOrAdmin, (req, res) => {
  const job = JobService.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job posting not found' });
  }
  res.json(job);
});

// Create Job
router.post('/', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, requiredSkills, experienceLevel, jobType, clientId, location, salaryRange } = req.body;
    if (!title || !description || !clientId || !experienceLevel) {
      return res.status(400).json({ message: 'Missing required job fields (title, description, clientId, experienceLevel)' });
    }
    const newJob = JobService.createJob(
      {
        title,
        description,
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
        experienceLevel,
        jobType: jobType || 'Full-time',
        clientId,
        location: location || 'Remote',
        salaryRange,
      },
      req.user!
    );
    res.status(201).json(newJob);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error posting job' });
  }
});

// Update Job
router.put('/:id', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = JobService.updateJob(req.params.id, req.body, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error updating job posting' });
  }
});

// Toggle Job Status (OPEN/CLOSED)
router.patch('/:id/toggle-status', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = JobService.toggleJobStatus(req.params.id, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error toggling job status' });
  }
});

export default router;
