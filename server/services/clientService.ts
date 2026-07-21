import { db } from '../db/store.js';
import { Client, ClientStatus, User, PaginatedResponse } from '../../src/types/index.js';
import { AuditService } from './auditService.js';

export class ClientService {
  public static listClients(params: {
    search?: string;
    status?: ClientStatus;
    industry?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'name' | 'createdAt' | 'industry';
    sortOrder?: 'asc' | 'desc';
  }): PaginatedResponse<Client> {
    let clients = [...db.clients];

    // Search filter
    if (params.search) {
      const q = params.search.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (params.status) {
      clients = clients.filter((c) => c.status === params.status);
    }

    // Industry filter
    if (params.industry) {
      clients = clients.filter((c) => c.industry.toLowerCase() === params.industry?.toLowerCase());
    }

    // Sort
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    clients.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = clients.length;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 10);
    const startIndex = (page - 1) * pageSize;
    const paginatedData = clients.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  public static getClientById(id: string): Client | null {
    return db.clients.find((c) => c.id === id) || null;
  }

  public static createClient(
    data: {
      name: string;
      industry: string;
      contactPerson: string;
      email: string;
      phone: string;
      notes?: string;
    },
    actor: User
  ): Client {
    const now = new Date().toISOString();
    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: data.name,
      industry: data.industry,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      status: 'ACTIVE',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    db.clients = [newClient, ...db.clients];

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'CREATE_CLIENT',
      'Client',
      newClient.id,
      `Created client "${newClient.name}" (${newClient.industry})`
    );

    return newClient;
  }

  public static updateClient(
    id: string,
    data: Partial<Omit<Client, 'id' | 'createdAt'>>,
    actor: User
  ): Client {
    const clientIndex = db.clients.findIndex((c) => c.id === id);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    const updatedClient: Client = {
      ...db.clients[clientIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const updatedClients = [...db.clients];
    updatedClients[clientIndex] = updatedClient;
    db.clients = updatedClients;

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'UPDATE_CLIENT',
      'Client',
      id,
      `Updated client details for "${updatedClient.name}"`
    );

    return updatedClient;
  }

  public static toggleClientStatus(id: string, actor: User): Client {
    const client = this.getClientById(id);
    if (!client) {
      throw new Error('Client not found');
    }

    const newStatus: ClientStatus = client.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateClient(id, { status: newStatus }, actor);
  }
}
