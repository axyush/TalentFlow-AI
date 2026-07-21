import { Router, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Login failed' });
  }
});

// Signup (Public or Admin created)
router.post('/signup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const result = await AuthService.signup(name, email, password, role || 'RECRUITER', req.user);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Signup failed' });
  }
});

// Current user profile
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// List all users (ADMIN only)
router.get('/users', authenticateToken, requireAdmin, (_req, res) => {
  const users = AuthService.getUsers();
  res.json(users);
});

export default router;
