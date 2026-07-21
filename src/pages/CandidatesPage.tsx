import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Upload, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  X, 
  Briefcase,
  CheckCircle,
  Clock,
  Download,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Award,
  FolderGit2,
  Building2,
  GraduationCap,
  AlertCircle,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api.js';
import { Candidate, CandidateStatus, CandidateSource, Job, Application, PipelineStage, ParsedSearchQuery } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Pagination } from '../components/common/Pagination.js';
import { Modal } from '../components/common/Modal.js';

interface CandidatesPageProps {
  isCreateOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const CandidatesPage: React.FC<CandidatesPageProps> = ({
  isCreateOpen = false,
  onCloseCreateModal,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  // AI Natural Language Search State
  const [nlQuery, setNlQuery] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<{
    queryParsing: ParsedSearchQuery;
    candidates: Array<{ candidate: Candidate; relevanceScore: number; matchedSkills: string[] }>;
  } | null>(null);

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    setIsAISearching(true);
    try {
      const res = await api.aiSearchCandidates(nlQuery);
      setAiSearchResults(res);
    } catch (err: any) {
      alert(err.message || 'Error executing AI natural language candidate search');
    } finally {
      setIsAISearching(false);
    }
  };

  const handleClearAISearch = () => {
    setNlQuery('');
    setAiSearchResults(null);
    loadCandidates();
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState(isCreateOpen);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<Candidate | null>(null);
  const [candidateApplications, setCandidateApplications] = useState<Application[]>([]);

  // Manual Add Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSkillsInput, setFormSkillsInput] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formExperience, setFormExperience] = useState('');
  const [formEducation, setFormEducation] = useState('');
  const [formSource, setFormSource] = useState<CandidateSource>('Manual');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Resume Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCandidateId, setUploadCandidateId] = useState<string>('');
  const [uploadName, setUploadName] = useState('');
  const [uploadEmail, setUploadEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Link to Job State in Candidate Detail
  const [linkJobId, setLinkJobId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  // AI Re-parse State
  const [isReparsing, setIsReparsing] = useState(false);

  // Duplicate Check Warning State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    possibleDuplicates: Array<{
      candidate: Candidate;
      reasons: string[];
      similarityScore: number;
    }>;
  } | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [forceSaveDuplicate, setForceSaveDuplicate] = useState(false);

  useEffect(() => {
    if (isCreateOpen) setShowAddModal(true);
  }, [isCreateOpen]);

  useEffect(() => {
    api.getJobs({ status: 'OPEN', pageSize: 100 }).then((res) => setJobs(res.data)).catch(console.error);
  }, []);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCandidates({
        search,
        skill: skillFilter,
        status: statusFilter ? (statusFilter as CandidateStatus) : undefined,
        source: sourceFilter || undefined,
        page,
        pageSize: 10,
      });
      setCandidates(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error loading candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [search, skillFilter, statusFilter, sourceFilter, page]);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormLocation('');
    setFormSkillsInput('');
    setFormSkills([]);
    setFormExperience('');
    setFormEducation('');
    setFormSource('Manual');
    setFormNotes('');
    setFormError(null);
    setEditingCandidate(null);
    setDuplicateWarning(null);
    setForceSaveDuplicate(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (cand: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCandidate(cand);
    setFormName(cand.name);
    setFormEmail(cand.email);
    setFormPhone(cand.phone);
    setFormLocation(cand.location);
    setFormSkills(cand.parsedSkills || []);
    setFormSkillsInput('');
    setFormExperience(cand.parsedExperience || '');
    setFormEducation(cand.parsedEducation || '');
    setFormSource(cand.source);
    setFormNotes(cand.notes || '');
    setFormError(null);
    setDuplicateWarning(null);
    setForceSaveDuplicate(false);
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

  const handleCheckDuplicatesAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let finalSkills = [...formSkills];
    if (formSkillsInput.trim() && !finalSkills.includes(formSkillsInput.trim())) {
      finalSkills.push(formSkillsInput.trim());
    }

    // Perform duplicate candidate detection first if not editing and not forced
    if (!editingCandidate && !forceSaveDuplicate) {
      setIsCheckingDuplicates(true);
      try {
        const dupResult = await api.checkDuplicateCandidate({
          name: formName,
          email: formEmail,
          skills: finalSkills,
        });

        if (dupResult.isDuplicate && dupResult.possibleDuplicates.length > 0) {
          setDuplicateWarning(dupResult);
          setIsCheckingDuplicates(false);
          return; // Stop and flag duplicate warning to user
        }
      } catch (err) {
        console.warn('Duplicate check warning:', err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }

    setIsSaving(true);
    try {
      if (editingCandidate) {
        await api.updateCandidate(editingCandidate.id, {
          name: formName,
          email: formEmail,
          phone: formPhone,
          location: formLocation,
          parsedSkills: finalSkills,
          parsedExperience: formExperience,
          parsedEducation: formEducation,
          source: formSource,
          notes: formNotes,
        });
      } else {
        await api.createCandidate({
          name: formName,
          email: formEmail,
          phone: formPhone,
          location: formLocation,
          parsedSkills: finalSkills,
          parsedExperience: formExperience,
          parsedEducation: formEducation,
          source: formSource,
          notes: formNotes,
        });
      }

      setShowAddModal(false);
      if (onCloseCreateModal) onCloseCreateModal();
      resetForm();
      loadCandidates();
    } catch (err: any) {
      setFormError(err.message || 'Error saving candidate');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a resume file first');
      return;
    }

    // Check duplicate for new upload if not forced
    if (!uploadCandidateId && !forceSaveDuplicate) {
      setIsCheckingDuplicates(true);
      try {
        const dupResult = await api.checkDuplicateCandidate({
          name: uploadName || uploadFile.name,
          email: uploadEmail,
        });

        if (dupResult.isDuplicate && dupResult.possibleDuplicates.length > 0) {
          setDuplicateWarning(dupResult);
          setIsCheckingDuplicates(false);
          return; // Stop and show duplicate warning
        }
      } catch (err) {
        console.warn('Upload duplicate check failed:', err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', uploadFile);
      if (uploadCandidateId) formData.append('candidateId', uploadCandidateId);
      if (uploadName) formData.append('name', uploadName);
      if (uploadEmail) formData.append('email', uploadEmail);

      const created = await api.uploadCandidateResume(formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadCandidateId('');
      setUploadName('');
      setUploadEmail('');
      setDuplicateWarning(null);
      setForceSaveDuplicate(false);
      
      // Auto open detail view of the newly uploaded candidate to view AI parsing results
      if (created) {
        handleViewCandidateDetail(created);
      }
      loadCandidates();
    } catch (err: any) {
      alert(err.message || 'Error uploading resume file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewCandidateDetail = async (cand: Candidate) => {
    setSelectedCandidateDetail(cand);
    setLinkJobId('');
    try {
      // Reload freshest candidate record from backend
      const refreshed = await api.getCandidates({ search: cand.email });
      if (refreshed.data.length > 0) {
        const match = refreshed.data.find((c) => c.id === cand.id);
        if (match) setSelectedCandidateDetail(match);
      }
      const res = await api.getApplications({ candidateId: cand.id });
      setCandidateApplications(res.data);
    } catch (err) {
      console.error('Error loading candidate details:', err);
    }
  };

  const handleReparseResume = async () => {
    if (!selectedCandidateDetail) return;
    setIsReparsing(true);
    try {
      const updated = await api.reparseCandidateResume(selectedCandidateDetail.id);
      setSelectedCandidateDetail(updated);
      loadCandidates();
    } catch (err: any) {
      alert(err.message || 'Error re-parsing resume with Gemini AI');
    } finally {
      setIsReparsing(false);
    }
  };

  const handleLinkToJob = async () => {
    if (!selectedCandidateDetail || !linkJobId) return;
    setIsLinking(true);
    try {
      await api.createApplication(selectedCandidateDetail.id, linkJobId);
      const res = await api.getApplications({ candidateId: selectedCandidateDetail.id });
      setCandidateApplications(res.data);
      setLinkJobId('');
    } catch (err: any) {
      alert(err.message || 'Error linking candidate to job');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Candidates Database
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> AI Resume Parser Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Talent pool management, Gemini AI resume extraction, and pipeline application tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setUploadFile(null);
              setUploadCandidateId('');
              setUploadName('');
              setUploadEmail('');
              setDuplicateWarning(null);
              setForceSaveDuplicate(false);
              setShowUploadModal(true);
            }}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-400" /> Upload & AI Parse Resume
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Candidate
          </button>
        </div>
      </div>

      {/* AI Natural Language Candidate Search Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-2xl text-white shadow-md border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">AI Natural Language Talent Search</h3>
              <p className="text-[11px] text-slate-400">Describe ideal candidate skills, location, and experience in plain English</p>
            </div>
          </div>
          {aiSearchResults && (
            <button
              type="button"
              onClick={handleClearAISearch}
              className="text-xs text-indigo-300 hover:text-white underline font-medium cursor-pointer"
            >
              Clear AI Search
            </button>
          )}
        </div>

        <form onSubmit={handleAISearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-indigo-300 absolute left-3.5 top-3" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. Java developer with Spring Boot and React experience in Pune with 3+ years experience"
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-indigo-500/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isAISearching || !nlQuery.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isAISearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> AI Parsing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Search with AI
              </>
            )}
          </button>
        </form>

        {/* AI Query Breakdown Pills */}
        {aiSearchResults && (
          <div className="pt-2 border-t border-indigo-900/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-indigo-300 font-semibold">Extracted Intent:</span>
            {aiSearchResults.queryParsing.skills?.map((sk) => (
              <span key={sk} className="px-2 py-0.5 bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 rounded-md text-[10px] font-semibold">
                Skill: {sk}
              </span>
            ))}
            {aiSearchResults.queryParsing.location && (
              <span className="px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 rounded-md text-[10px] font-semibold">
                Location: {aiSearchResults.queryParsing.location}
              </span>
            )}
            {aiSearchResults.queryParsing.minYearsExperience !== undefined && (
              <span className="px-2 py-0.5 bg-purple-900/60 border border-purple-500/40 text-purple-200 rounded-md text-[10px] font-semibold">
                Experience: {aiSearchResults.queryParsing.minYearsExperience}+ Yrs
              </span>
            )}
            {aiSearchResults.queryParsing.experienceLevel && (
              <span className="px-2 py-0.5 bg-amber-900/60 border border-amber-500/40 text-amber-200 rounded-md text-[10px] font-semibold">
                Level: {aiSearchResults.queryParsing.experienceLevel}
              </span>
            )}
          </div>
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
            placeholder="Search candidates by name, email, location..."
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
            placeholder="Filter by skill tag..."
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACTIVE">Active</option>
            <option value="HIRED">Hired</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Sources</option>
            <option value="Manual">Manual</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Referral">Referral</option>
            <option value="Portal">Portal</option>
            <option value="Upload">Upload</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Candidate Profile</th>
                {aiSearchResults && <th className="py-3.5 px-4">AI Search Match</th>}
                <th className="py-3.5 px-4">Contact & Location</th>
                <th className="py-3.5 px-4">Skills & AI Status</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={aiSearchResults ? 7 : 6} className="py-12 text-center text-slate-400 text-xs">
                    Loading candidates pool...
                  </td>
                </tr>
              ) : aiSearchResults ? (
                aiSearchResults.candidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No candidates matched the AI search criteria.
                    </td>
                  </tr>
                ) : (
                  aiSearchResults.candidates.map(({ candidate: cand, relevanceScore, matchedSkills }) => (
                    <tr
                      key={cand.id}
                      onClick={() => handleViewCandidateDetail(cand)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-700/50 group-hover:scale-105 transition-transform">
                            {cand.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                              {cand.name}
                              {cand.resumeUrl && (
                              <span title="Resume attached">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{cand.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-900 to-slate-900 text-indigo-200 rounded-lg text-xs font-bold shadow-2xs border border-indigo-700/50 inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" /> {relevanceScore}% Fit
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {cand.location || 'Remote / N/A'}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {cand.phone || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {matchedSkills.map((sk) => (
                              <span key={sk} className="px-2 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-900 font-semibold rounded text-[11px]">
                                {sk}
                              </span>
                            ))}
                            {cand.parsedSkills.filter(s => !matchedSkills.includes(s.toLowerCase())).slice(0, 2).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium text-slate-600">{cand.source}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={cand.status}>{cand.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCandidateDetail(cand);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No candidates found matching criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((cand) => (
                  <tr
                    key={cand.id}
                    onClick={() => handleViewCandidateDetail(cand)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-700/50 group-hover:scale-105 transition-transform">
                          {cand.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            {cand.name}
                            {cand.resumeUrl && (
                              <span title="Resume attached">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{cand.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {cand.location || 'Remote / N/A'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {cand.phone || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {cand.parsedSkills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {cand.parsedSkills.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{cand.parsedSkills.length - 3}
                            </span>
                          )}
                        </div>

                        {/* AI Resume Parse Status Badge */}
                        {cand.parseStatus === 'SUCCESS' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> AI Parsed
                          </span>
                        )}
                        {cand.parseStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                            <RefreshCw className="w-2.5 h-2.5 text-amber-600 animate-spin" /> AI Parsing...
                          </span>
                        )}
                        {cand.parseStatus === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Parse Error
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                      {cand.source}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={cand.status}>{cand.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(cand, e)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Candidate"
                        >
                          <Edit3 className="w-4 h-4" />
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

      {/* Manual Candidate Form Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          if (onCloseCreateModal) onCloseCreateModal();
        }}
        title={editingCandidate ? 'Edit Candidate Profile' : 'Add Candidate Profile'}
        subtitle="Specify candidate contact info, skill tags, and background summary"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {formError}
          </div>
        )}

        {/* Duplicate Candidate Warning Card */}
        {duplicateWarning && (
          <div className="mb-4 p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Possible Duplicate Candidate Detected</h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  The system found existing candidates with matching email, name, or profile parameters:
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {duplicateWarning.possibleDuplicates.map((dup) => (
                <div key={dup.candidate.id} className="p-2.5 bg-white border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{dup.candidate.name} ({dup.candidate.email})</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      {dup.similarityScore}% Match
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 list-disc list-inside">
                    {dup.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      handleViewCandidateDetail(dup.candidate);
                    }}
                    className="mt-1 text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    View Existing Profile <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
              <button
                type="button"
                onClick={() => {
                  setForceSaveDuplicate(true);
                  setDuplicateWarning(null);
                }}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Proceed & Save Candidate Anyway
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel / Edit Inputs
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCheckDuplicatesAndSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setDuplicateWarning(null);
                }}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value);
                  setDuplicateWarning(null);
                }}
                placeholder="elena@devmail.io"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sourcing Channel</label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value as CandidateSource)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Manual">Manual</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Referral</option>
                <option value="Portal">Portal</option>
                <option value="Upload">Upload</option>
              </select>
            </div>
          </div>

          {/* Skill Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skills (Press Enter or click Add)
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
                placeholder="e.g. React, TypeScript, Node.js"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSkillTag}
                className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium hover:bg-slate-700"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-8 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {formSkills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No skill tags attached</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Summary</label>
              <textarea
                rows={3}
                value={formExperience}
                onChange={(e) => setFormExperience(e.target.value)}
                placeholder="e.g. 6 years as Full-Stack Engineer at SaaS startups..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Education</label>
              <textarea
                rows={3}
                value={formEducation}
                onChange={(e) => setFormEducation(e.target.value)}
                placeholder="e.g. B.S. in Computer Science, Columbia University"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                if (onCloseCreateModal) onCloseCreateModal();
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isCheckingDuplicates}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSaving || isCheckingDuplicates
                ? 'Processing...'
                : editingCandidate
                ? 'Update Candidate'
                : forceSaveDuplicate
                ? 'Confirm & Save Duplicate'
                : 'Add Candidate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Resume Upload Modal with Gemini AI Resume Parsing */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Resume & AI Extract"
        subtitle="Gemini AI automatically parses skills, experience timeline, and education from resume files"
      >
        {/* Duplicate Warning in Upload Modal */}
        {duplicateWarning && (
          <div className="mb-4 p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Possible Duplicate Candidate Detected</h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  An existing candidate record matches the resume file or name details:
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {duplicateWarning.possibleDuplicates.map((dup) => (
                <div key={dup.candidate.id} className="p-2.5 bg-white border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{dup.candidate.name} ({dup.candidate.email})</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      {dup.similarityScore}% Match
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 list-disc list-inside">
                    {dup.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      handleViewCandidateDetail(dup.candidate);
                    }}
                    className="mt-1 text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Attach Resume to Existing Profile Instead <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
              <button
                type="button"
                onClick={() => {
                  setForceSaveDuplicate(true);
                  setDuplicateWarning(null);
                }}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Upload & Create New Duplicate
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleUploadResume} className="space-y-4">
          <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors bg-indigo-50/30">
            <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-bold text-slate-800">
              {uploadFile ? uploadFile.name : 'Choose a Resume File for AI Extraction'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Supports PDF, TXT, DOCX up to 10MB</p>

            <input
              type="file"
              required
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                  setDuplicateWarning(null);
                }
              }}
              className="mt-3 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attach to Existing Candidate Profile (Optional)
            </label>
            <select
              value={uploadCandidateId}
              onChange={(e) => setUploadCandidateId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Create New Candidate Profile with AI Parse --</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {!uploadCandidateId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Name (Optional)</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Auto-inferred from filename if empty"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Email (Optional)</label>
                <input
                  type="email"
                  value={uploadEmail}
                  onChange={(e) => setUploadEmail(e.target.value)}
                  placeholder="e.g. candidate@domain.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || isCheckingDuplicates || !uploadFile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gemini AI Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Upload & Parse Resume
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Candidate Detail Modal with Full Structured AI Resume View & Re-parse Action */}
      {selectedCandidateDetail && (
        <Modal
          isOpen={!!selectedCandidateDetail}
          onClose={() => setSelectedCandidateDetail(null)}
          title={selectedCandidateDetail.name}
          subtitle={`Candidate Profile • ${selectedCandidateDetail.source} Source`}
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            {/* AI Resume Status Banner & Re-parse Action */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold tracking-tight text-white">
                      AI Resume Extraction Engine
                    </h4>
                    {selectedCandidateDetail.parseStatus === 'SUCCESS' && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold rounded-full">
                        Parsed Successfully
                      </span>
                    )}
                    {selectedCandidateDetail.parseStatus === 'FAILED' && (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold rounded-full">
                        Parsing Failed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gemini 3.6 Flash extracts skills, work experience timeline, and past achievements.
                  </p>
                </div>
              </div>

              {selectedCandidateDetail.resumeUrl && (
                <button
                  type="button"
                  onClick={handleReparseResume}
                  disabled={isReparsing}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReparsing ? 'animate-spin' : ''}`} />
                  {isReparsing ? 'Re-parsing with Gemini...' : 'Re-parse Resume'}
                </button>
              )}
            </div>

            {/* Parse Error Alert Banner */}
            {selectedCandidateDetail.parseStatus === 'FAILED' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Parsing Error:</strong> {selectedCandidateDetail.parseError || 'Could not extract structured data from resume.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReparseResume}
                  disabled={isReparsing}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500 shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Basic Info Overview Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">EMAIL</span>
                <span className="font-semibold text-slate-800 truncate block">{selectedCandidateDetail.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">PHONE</span>
                <span className="font-semibold text-slate-800">{selectedCandidateDetail.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">LOCATION</span>
                <span className="font-semibold text-slate-800">{selectedCandidateDetail.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">CANDIDATE STATUS</span>
                <Badge variant={selectedCandidateDetail.status}>{selectedCandidateDetail.status}</Badge>
              </div>
            </div>

            {/* Resume Attachment Download Link */}
            {selectedCandidateDetail.resumeUrl && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-indigo-950 font-medium">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Resume File: {selectedCandidateDetail.resumeFileName || 'Stored Candidate Resume'}</span>
                </div>
                <a
                  href={selectedCandidateDetail.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </a>
              </div>
            )}

            {/* Executive AI Summary */}
            {selectedCandidateDetail.parsedData?.summary && (
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Executive AI Candidate Summary
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{selectedCandidateDetail.parsedData.summary}"
                </p>
              </div>
            )}

            {/* Parsed Skill Tags */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                Extracted Skills ({selectedCandidateDetail.parsedSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidateDetail.parsedSkills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No skills extracted yet</span>
                ) : (
                  selectedCandidateDetail.parsedSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Structured Work Experience Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" /> Professional Experience Timeline
                {selectedCandidateDetail.parsedData?.yearsOfExperience ? (
                  <span className="ml-auto text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Est. {selectedCandidateDetail.parsedData.yearsOfExperience} Years Experience
                  </span>
                ) : null}
              </h4>

              {selectedCandidateDetail.parsedData?.workExperience && selectedCandidateDetail.parsedData.workExperience.length > 0 ? (
                <div className="space-y-3 relative pl-4 border-l-2 border-indigo-100">
                  {selectedCandidateDetail.parsedData.workExperience.map((exp, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900">{exp.role || 'Position'}</h5>
                          <span className="text-[11px] font-medium text-indigo-600">{exp.duration}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700">{exp.company}</p>
                        {exp.description && (
                          <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/50 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedCandidateDetail.parsedExperience ? (
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {selectedCandidateDetail.parsedExperience}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">No work experience details recorded.</p>
              )}
            </div>

            {/* Education Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> Education & Credentials
              </h4>

              {selectedCandidateDetail.parsedData?.education && selectedCandidateDetail.parsedData.education.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCandidateDetail.parsedData.education.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{edu.degree || 'Degree'}</p>
                        <span className="text-[11px] text-slate-400 font-medium">{edu.year}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              ) : selectedCandidateDetail.parsedEducation ? (
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedCandidateDetail.parsedEducation}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">No education credentials recorded.</p>
              )}
            </div>

            {/* Certifications & Notable Projects */}
            {((selectedCandidateDetail.parsedData?.certifications && selectedCandidateDetail.parsedData.certifications.length > 0) ||
              (selectedCandidateDetail.parsedData?.notableProjects && selectedCandidateDetail.parsedData.notableProjects.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCandidateDetail.parsedData?.certifications && selectedCandidateDetail.parsedData.certifications.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-indigo-600" /> Certifications
                    </h5>
                    <ul className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedCandidateDetail.parsedData.certifications.map((c, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCandidateDetail.parsedData?.notableProjects && selectedCandidateDetail.parsedData.notableProjects.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" /> Key Projects & Portfolio
                    </h5>
                    <ul className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedCandidateDetail.parsedData.notableProjects.map((p, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Link to Open Job Opportunity & Application Pipeline */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Active Job Applications & Pipeline Stage
              </h4>

              <div className="flex gap-2">
                <select
                  value={linkJobId}
                  onChange={(e) => setLinkJobId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Open Job Posting...</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.clientName})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleLinkToJob}
                  disabled={!linkJobId || isLinking}
                  className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {isLinking ? 'Linking...' : 'Link Candidate'}
                </button>
              </div>

              {/* Linked Applications List */}
              <div className="space-y-2 pt-1">
                {candidateApplications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Candidate is not currently attached to any open job postings.</p>
                ) : (
                  candidateApplications.map((app) => (
                    <div key={app.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{app.jobTitle}</p>
                          <p className="text-[11px] text-slate-500">{app.clientName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={app.currentStage}
                            onChange={async (e) => {
                              const newStage = e.target.value as PipelineStage;
                              try {
                                await api.updateApplicationStage(app.id, newStage, 'Stage updated from candidate profile modal');
                                if (selectedCandidateDetail) {
                                  const res = await api.getApplications({ candidateId: selectedCandidateDetail.id });
                                  setCandidateApplications(res.data);
                                }
                              } catch (err: any) {
                                alert(err.message || 'Error updating stage');
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                          >
                            {['Applied', 'Screening', 'Interview', 'Technical Round', 'HR Round', 'Offer', 'Hired', 'Rejected'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {app.history && app.history.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>
                            Latest Stage: <strong className="text-slate-800">{app.history[app.history.length - 1].stage}</strong> ({new Date(app.history[app.history.length - 1].timestamp).toLocaleDateString()})
                          </span>
                          {app.history[app.history.length - 1].notes && (
                            <span className="italic truncate max-w-xs text-slate-400">"{app.history[app.history.length - 1].notes}"</span>
                          )}
                        </div>
                      )}
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
