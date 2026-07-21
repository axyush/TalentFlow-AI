import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  User, 
  Power, 
  Edit3, 
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api.js';
import { Client, ClientStatus, Job } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Pagination } from '../components/common/Pagination.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

interface ClientsPageProps {
  isCreateOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  isCreateOpen = false,
  onCloseCreateModal,
}) => {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(isCreateOpen);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
  const [clientJobs, setClientJobs] = useState<Job[]>([]);

  // Form State
  const [formName, setFormName] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isCreateOpen) setShowAddModal(true);
  }, [isCreateOpen]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const res = await api.getClients({
        search,
        status: statusFilter ? (statusFilter as ClientStatus) : undefined,
        industry: industryFilter || undefined,
        page,
        pageSize: 10,
      });
      setClients(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search, statusFilter, industryFilter, page]);

  const resetForm = () => {
    setFormName('');
    setFormIndustry('');
    setFormContact('');
    setFormEmail('');
    setFormPhone('');
    setFormNotes('');
    setFormError(null);
    setEditingClient(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormName(client.name);
    setFormIndustry(client.industry);
    setFormContact(client.contactPerson);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormNotes(client.notes || '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, {
          name: formName,
          industry: formIndustry,
          contactPerson: formContact,
          email: formEmail,
          phone: formPhone,
          notes: formNotes,
        });
      } else {
        await api.createClient({
          name: formName,
          industry: formIndustry,
          contactPerson: formContact,
          email: formEmail,
          phone: formPhone,
          notes: formNotes,
        });
      }

      setShowAddModal(false);
      if (onCloseCreateModal) onCloseCreateModal();
      resetForm();
      loadClients();
    } catch (err: any) {
      setFormError(err.message || 'Error saving client');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleClientStatus(client.id);
      loadClients();
    } catch (err: any) {
      alert(err.message || 'Error toggling client status');
    }
  };

  const handleViewClientDetail = async (client: Client) => {
    setSelectedClientDetail(client);
    try {
      const res = await api.getJobs({ clientId: client.id });
      setClientJobs(res.data);
    } catch (err) {
      console.error('Error loading client jobs:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Directory</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage corporate client accounts and hiring commitments
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Client
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search clients by name, contact person, industry..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Industries</option>
            <option value="Software & Cloud Services">Software & Cloud</option>
            <option value="Healthcare Technology">Healthcare</option>
            <option value="Fintech & Quantitative Trading">Fintech</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Industry</th>
                <th className="py-3.5 px-4">Key Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Loading clients directory...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No client accounts match your search filters.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => handleViewClientDetail(client)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100 group-hover:scale-105 transition-transform">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {client.name}
                          </p>
                          <p className="text-xs text-slate-400">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                      {client.industry}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {client.contactPerson}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {client.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={client.status}>{client.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEdit(client, e)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Client"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleToggleStatus(client, e)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              client.status === 'ACTIVE'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={client.status === 'ACTIVE' ? 'Deactivate Client' : 'Activate Client'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={10}
          onPageChange={setPage}
        />
      </div>

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          if (onCloseCreateModal) onCloseCreateModal();
        }}
        title={editingClient ? 'Edit Client Account' : 'Add Corporate Client'}
        subtitle="Specify company details, primary contact, and industry focus"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveClient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Acme Technologies Inc."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector *</label>
              <input
                type="text"
                required
                value={formIndustry}
                onChange={(e) => setFormIndustry(e.target.value)}
                placeholder="e.g. Fintech"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Contact *</label>
              <input
                type="text"
                required
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
                placeholder="e.g. David Chen"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="contact@acme.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Special instructions, headcount expectations..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                if (onCloseCreateModal) onCloseCreateModal();
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Detail Drawer / Modal */}
      {selectedClientDetail && (
        <Modal
          isOpen={!!selectedClientDetail}
          onClose={() => setSelectedClientDetail(null)}
          title={selectedClientDetail.name}
          subtitle={`Industry: ${selectedClientDetail.industry}`}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Contact Person:</span>
                <span className="font-semibold text-slate-800">{selectedClientDetail.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Status:</span>
                <Badge variant={selectedClientDetail.status}>{selectedClientDetail.status}</Badge>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Email:</span>
                <span className="font-semibold text-slate-800">{selectedClientDetail.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Phone:</span>
                <span className="font-semibold text-slate-800">{selectedClientDetail.phone}</span>
              </div>
            </div>

            {selectedClientDetail.notes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</h4>
                <p className="text-xs text-slate-700 bg-amber-50/60 border border-amber-100 p-3 rounded-xl">
                  {selectedClientDetail.notes}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Associated Job Openings ({clientJobs.length})</span>
              </h4>

              <div className="space-y-2">
                {clientJobs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center border border-dashed rounded-xl">
                    No active job postings for this client.
                  </p>
                ) : (
                  clientJobs.map((j) => (
                    <div key={j.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{j.title}</p>
                        <p className="text-[11px] text-slate-500">{j.location} • {j.experienceLevel}</p>
                      </div>
                      <Badge variant={j.status}>{j.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
