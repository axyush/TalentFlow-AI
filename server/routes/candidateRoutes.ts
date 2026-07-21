import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CandidateService } from '../services/candidateService.js';
import { authenticateToken, requireRecruiterOrAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Configure multer file upload for resumes
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `resume_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// List Candidates (Search, filter by skill, status, source, paginate)
router.get('/', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, skill, status, source, page, pageSize, sortBy, sortOrder } = req.query;
    const result = CandidateService.listCandidates({
      search: search as string,
      skill: skill as string,
      status: status as any,
      source: source as any,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 10,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching candidates' });
  }
});

// Get Candidate by ID
router.get('/:id', authenticateToken, requireRecruiterOrAdmin, (req, res) => {
  const candidate = CandidateService.getCandidateById(req.params.id);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  res.json(candidate);
});

// Create Candidate Manually
router.post('/', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, location, parsedSkills, parsedExperience, parsedEducation, source, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Missing required candidate fields (name, email)' });
    }
    const candidate = CandidateService.createCandidate(
      {
        name,
        email,
        phone: phone || '',
        location: location || '',
        parsedSkills: Array.isArray(parsedSkills) ? parsedSkills : [],
        parsedExperience,
        parsedEducation,
        source: source || 'Manual',
        notes,
      },
      req.user!
    );
    res.status(201).json(candidate);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error creating candidate' });
  }
});

// Check Duplicate Candidate before saving
router.post('/check-duplicate', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, skills, excludeId } = req.body;
    const result = CandidateService.checkDuplicates({ name, email, skills, excludeId });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error checking duplicates' });
  }
});

// AI Natural Language Candidate Search
router.post('/ai-search', authenticateToken, requireRecruiterOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query string is required' });
    }
    const result = await CandidateService.naturalLanguageSearch(query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error processing AI natural language search' });
  }
});

// Re-parse Candidate Resume using Gemini AI
router.post('/:id/reparse', authenticateToken, requireRecruiterOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = req.params.id;
    const updated = await CandidateService.parseCandidateResume(candidateId, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error re-parsing resume' });
  }
});

// Upload Resume for Candidate
router.post('/upload-resume', authenticateToken, requireRecruiterOrAdmin, upload.single('resume'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { candidateId, name, email, phone, location } = req.body;
    const resumeUrl = `/uploads/${req.file.filename}`;
    const resumeFileName = req.file.originalname;

    let candidate: any;

    if (candidateId) {
      // Attach to existing candidate
      candidate = CandidateService.updateCandidate(
        candidateId,
        { resumeUrl, resumeFileName, parseStatus: 'PENDING' },
        req.user!
      );
    } else {
      // Create candidate with resume attached
      const candidateName = name || req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const candidateEmail = email || `${req.file.filename.slice(0, 10)}@candidate.tmp`;

      candidate = CandidateService.createCandidate(
        {
          name: candidateName,
          email: candidateEmail,
          phone: phone || '',
          location: location || '',
          source: 'Upload',
          resumeUrl,
          resumeFileName,
          parsedSkills: [],
          parseStatus: 'PENDING',
        },
        req.user!
      );
    }

    // Trigger AI Resume Parsing directly
    const fileBuffer = fs.readFileSync(req.file.path);
    const parsedCandidate = await CandidateService.parseCandidateResume(
      candidate.id,
      req.user!,
      fileBuffer,
      req.file.mimetype
    );

    return res.status(200).json(parsedCandidate);
  } catch (err: any) {
    console.error('Upload resume error:', err);
    res.status(400).json({ message: err.message || 'Error uploading resume' });
  }
});

// Update Candidate Profile
router.put('/:id', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = CandidateService.updateCandidate(req.params.id, req.body, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error updating candidate' });
  }
});

export default router;
