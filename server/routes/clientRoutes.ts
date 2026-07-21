import { Router, Response } from 'express';
import { ClientService } from '../services/clientService.js';
import { authenticateToken, requireAdmin, requireRecruiterOrAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// List Clients (Search, filter, paginate)
router.get('/', authenticateToken, requireRecruiterOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, industry, page, pageSize, sortBy, sortOrder } = req.query;
    const result = ClientService.listClients({
      search: search as string,
      status: status as any,
      industry: industry as string,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 10,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching clients' });
  }
});

// Get Client by ID
router.get('/:id', authenticateToken, requireRecruiterOrAdmin, (req, res) => {
  const client = ClientService.getClientById(req.params.id);
  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }
  res.json(client);
});

// Create Client (ADMIN only)
router.post('/', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, industry, contactPerson, email, phone, notes } = req.body;
    if (!name || !industry || !contactPerson || !email) {
      return res.status(400).json({ message: 'Missing required client fields (name, industry, contactPerson, email)' });
    }
    const newClient = ClientService.createClient({ name, industry, contactPerson, email, phone, notes }, req.user!);
    res.status(201).json(newClient);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error creating client' });
  }
});

// Update Client (ADMIN only)
router.put('/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = ClientService.updateClient(req.params.id, req.body, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error updating client' });
  }
});

// Toggle Client Active/Inactive status (ADMIN only)
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = ClientService.toggleClientStatus(req.params.id, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Error toggling client status' });
  }
});

export default router;
