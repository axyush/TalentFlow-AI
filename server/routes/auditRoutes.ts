import { Router, Response } from 'express';
import { AuditService } from '../services/auditService.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Get Audit Logs (ADMIN only)
router.get('/', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, pageSize, action, entity, search } = req.query;
    const result = AuditService.getLogs(
      page ? parseInt(page as string) : 1,
      pageSize ? parseInt(pageSize as string) : 20,
      {
        action: action as string,
        entity: entity as string,
        search: search as string,
      }
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching audit logs' });
  }
});

export default router;
