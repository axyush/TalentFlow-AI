import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Building2, 
  MapPin, 
  DollarSign, 
  Edit3, 
  Power, 
  Users,
  X,
  LayoutGrid,
  List,
  ArrowLeft,
  UserPlus,
  Layers
} from 'lucide-react';
import { api } from '../services/api.js';
import { Job, JobStatus, ExperienceLevel, JobType, Client, Application, Candidate, PipelineStage } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Pagination } from '../components/common/Pagination.js';
import { Modal } from '../components/common/Modal.js';
import { KanbanBoard } from '../components/pipeline/KanbanBoard.js';

interface JobsPageProps {
  isCreateOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const JobsPage: React.FC<JobsPageProps> = ({
  isCreateOpen = false,
  onCloseCreateModal,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'LIST' or 'KANBAN'
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');
  const [activeKanbanJob, setActiveKanbanJob] = useState<Job | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(isCreateOpen);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<Job | null>(null);
  const [jobApplications, setJobApplications] = useState<Application[]>([]);

  // Link candidate to job modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLinkCandidateId, setSelectedLinkCandidateId] = useState('');
  const [isLinkingCandidate, setIsLinkingCandidate] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSkillsInput, setFormSkillsInput] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formExpLevel, setFormExpLevel] = useState<ExperienceLevel>('Senior');
  const [formJobType, setFormJobType] = useState<JobType>('Full-time');
  const [formClientId, setFormClientId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isCreateOpen) setShowAddModal(true);
  }, [isCreateOpen]);

  // Load clients and candidates for selection dropdowns
  useEffect(() => {
    api.getClients({ pageSize: 100 }).then((res) => setClients(res.data)).catch(console.error);
    api.getCandidates({ pageSize: 100 }).then((res) => setCandidates(res.data)).catch(console.error);
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getJobs({
        search,
        skill: skillFilter,
        clientId: clientFilter,
        status: statusFilter ? (statusFilter as JobStatus) : undefined,
        experienceLevel: experienceFilter || undefined,
        page,
        pageSize: 10,
      });
      setJobs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [search, skillFilter, clientFilter, statusFilter, experienceFilter, page]);

  // Load Applications for active Kanban job
  const loadKanbanApplications = async (jobId: string) => {
    try {
      const res = await api.getApplications({ jobId, pageSize: 100 });
      setJobApplications(res.data);
    } catch (err) {
      console.error('Error loading kanban applications:', err);
    }
  };

  useEffect(() => {
    if (activeKanbanJob) {
      loadKanbanApplications(activeKanbanJob.id);
    }
  }, [activeKanbanJob]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormSkillsInput('');
    setFormSkills([]);
    setFormExpLevel('Senior');
    setFormJobType('Full-time');
    setFormClientId(clients[0]?.id || '');
    setFormLocation('Remote');
    setFormSalary('');
    setFormError(null);
    setEditingJob(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    if (clients.length > 0) setFormClientId(clients[0].id);
    setShowAddModal(true);
  };

  const handleOpenEdit = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJob(job);
    setFormTitle(job.title);
    setFormDescription(job.description);
    setFormSkills(job.requiredSkills || []);
    setFormSkillsInput('');
    setFormExpLevel(job.experienceLevel);
    setFormJobType(job.jobType);
    setFormClientId(job.clientId);
    setFormLocation(job.location);
    setFormSalary(job.salaryRange || '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAddSkillTag = () => {
    if (formSkillsInput.trim() && !formSkills.includes(formSkillsInput.trim())) {
      setFormSkills([...formSkills, formSkillsInput.trim()]);
      setFormSkillsInput('');
    }
  };

  const handleRemoveSkillTag = (skillToRemove: string) => {
    setFormSkills(formSkills.filter((s) => s !== skillToRemove));
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let finalSkills = [...formSkills];
    if (formSkillsInput.trim() && !finalSkills.includes(formSkillsInput.trim())) {
      finalSkills.push(formSkillsInput.trim());
    }

    if (!formClientId) {
      setFormError('Please select a client for this job posting');
      return;
    }

    setIsSaving(true);
    try {
      if (editingJob) {
        await api.updateJob(editingJob.id, {
          title: formTitle,
          description: formDescription,
          requiredSkills: finalSkills,
          experienceLevel: formExpLevel,
          jobType: formJobType,
          clientId: formClientId,
          location: formLocation,
          salaryRange: formSalary,
        });
      } else {
        await api.createJob({
          title: formTitle,
          description: formDescription,
          requiredSkills: finalSkills,
          experienceLevel: formExpLevel,
          jobType: formJobType,
          clientId: formClientId,
          location: formLocation,
          salaryRange: formSalary,
        });
      }

      setShowAddModal(false);
      if (onCloseCreateModal) onCloseCreateModal();
      resetForm();
      loadJobs();
    } catch (err: any) {
      setFormError(err.message || 'Error saving job posting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleJobStatus(job.id);
      loadJobs();
    } catch (err: any) {
      alert(err.message || 'Error toggling job status');
    }
  };

  const handleOpenKanbanView = (job: Job) => {
    setActiveKanbanJob(job);
    setViewMode('KANBAN');
  };

  const handleUpdateStage = async (appId: string, newStage: PipelineStage, notes?: string) => {
    await api.updateApplicationStage(appId, newStage, notes);
    if (activeKanbanJob) {
      loadKanbanApplications(activeKanbanJob.id);
    }
  };

  const handleLinkCandidateToActiveJob = async () => {
    if (!activeKanbanJob || !selectedLinkCandidateId) return;
    setIsLinkingCandidate(true);
    try {
      await api.createApplication(selectedLinkCandidateId, activeKanbanJob.id);
      setShowLinkModal(false);
      setSelectedLinkCandidateId('');
      loadKanbanApplications(activeKanbanJob.id);
    } catch (err: any) {
      alert(err.message || 'Error linking candidate to job');
    } finally {
      setIsLinkingCandidate(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Switcher Header */}
      {viewMode === 'KANBAN' && activeKanbanJob ? (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('LIST')}
                className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                title="Back to Jobs Directory"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">{activeKanbanJob.title}</h1>
                  <Badge variant={activeKanbanJob.status}>{activeKanbanJob.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {activeKanbanJob.clientName} • {activeKanbanJob.location} • {activeKanbanJob.experienceLevel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLinkModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
              >
                <UserPlus className="w-4 h-4" /> Add Candidate to Board
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
              >
                <List className="w-4 h-4" /> Switch to Directory
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job Openings</h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage client position requisitions and candidate recruitment pipelines
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Post New Job
          </button>
        </div>
      )}

      {/* Main Content Area: KANBAN BOARD vs DIRECTORY TABLE */}
      {viewMode === 'KANBAN' && activeKanbanJob ? (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <KanbanBoard
            jobId={activeKanbanJob.id}
            applications={jobApplications}
            onUpdateStage={handleUpdateStage}
            onRefreshApplications={() => loadKanbanApplications(activeKanbanJob.id)}
            isLoading={false}
          />
        </div>
      ) : (
        <>
          {/* Filter and Search Controls */}
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
                placeholder="Search jobs by title, description, location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <input
                type="text"
                value={skillFilter}
                onChange={(e) => {
                  setSkillFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by Skill..."
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              />

              <select
                value={clientFilter}
                onChange={(e) => {
                  setClientFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Jobs Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Job Title & Client</th>
                    <th className="py-3.5 px-4">Location & Type</th>
                    <th className="py-3.5 px-4">Required Skills</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Pipeline Board</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Loading job postings...
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No job postings found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => handleOpenKanbanView(job)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {job.title}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" /> {job.clientName}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" /> {job.location}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {job.experienceLevel} • {job.jobType}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {job.requiredSkills.slice(0, 3).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={job.status}>{job.status}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenKanbanView(job);
                            }}
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" /> View Pipeline
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleOpenEdit(job, e)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Job"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleToggleStatus(job, e)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                job.status === 'OPEN'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={job.status === 'OPEN' ? 'Close Job' : 'Reopen Job'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
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
        </>
      )}

      {/* Add / Edit Job Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          if (onCloseCreateModal) onCloseCreateModal();
        }}
        title={editingJob ? 'Edit Job Posting' : 'Post New Job Opportunity'}
        subtitle="Specify client connection, experience, and required skills"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveJob} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Company *</label>
              <select
                required
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="" disabled>Select Client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Level *</label>
              <select
                value={formExpLevel}
                onChange={(e) => setFormExpLevel(e.target.value as ExperienceLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Junior">Junior</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. New York, NY (Hybrid)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Range</label>
              <input
                type="text"
                value={formSalary}
                onChange={(e) => setFormSalary(e.target.value)}
                placeholder="e.g. $140,000 - $170,000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Required Skills Tags Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Skills (Press Enter or click Add)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formSkillsInput}
                onChange={(e) => setFormSkillsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkillTag();
                  }
                }}
                placeholder="e.g. React, PostgreSQL"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSkillTag}
                className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium hover:bg-slate-700"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-8 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {formSkills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No skills added yet</span>
              ) : (
                formSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillTag(skill)}
                      className="text-indigo-400 hover:text-indigo-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description *</label>
            <textarea
              required
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Responsibilities, qualification requirements..."
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
              {isSaving ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Link Candidate to Active Kanban Job Modal */}
      {showLinkModal && activeKanbanJob && (
        <Modal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          title="Attach Candidate to Pipeline"
          subtitle={`Position: ${activeKanbanJob.title} (${activeKanbanJob.clientName})`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Candidate from Talent Database
              </label>
              <select
                value={selectedLinkCandidateId}
                onChange={(e) => setSelectedLinkCandidateId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) - {c.location || 'Remote'}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              Selected candidate will be attached to this job opening at the <span className="font-bold text-slate-900">Applied</span> stage.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedLinkCandidateId || isLinkingCandidate}
                onClick={handleLinkCandidateToActiveJob}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {isLinkingCandidate ? 'Linking...' : 'Attach Candidate'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
