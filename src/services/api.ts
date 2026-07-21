import {
  AuthResponse,
  User,
  Client,
  Job,
  Candidate,
  Application,
  AuditLog,
  PaginatedResponse,
  ActivityItem,
  ClientStatus,
  JobStatus,
  CandidateStatus,
  PipelineStage,
  ParsedSearchQuery,
  RecommendedCandidate,
  AnalyticsDashboardData,
  CandidateSuccessPrediction,
} from '../types/index.js';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('tf_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = options.body instanceof FormData 
    ? { ...(localStorage.getItem('tf_auth_token') ? { Authorization: `Bearer ${localStorage.getItem('tf_auth_token')}` } : {}) }
    : { ...getAuthHeaders(), ...options.headers };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'An error occurred with API request');
  }
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name: string, email: string, password: string, role?: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  getUsers: () => request<User[]>('/auth/users'),

  // Clients
  getClients: (params?: {
    search?: string;
    status?: ClientStatus;
    industry?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.industry) q.set('industry', params.industry);
    if (params?.page) q.set('page', params.page.toString());
    if (params?.pageSize) q.set('pageSize', params.pageSize.toString());
    return request<PaginatedResponse<Client>>(`/clients?${q.toString()}`);
  },

  createClient: (data: {
    name: string;
    industry: string;
    contactPerson: string;
    email: string;
    phone: string;
    notes?: string;
  }) =>
    request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateClient: (id: string, data: Partial<Client>) =>
    request<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleClientStatus: (id: string) =>
    request<Client>(`/clients/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  // Jobs
  getJobs: (params?: {
    search?: string;
    skill?: string;
    clientId?: string;
    status?: JobStatus;
    experienceLevel?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.skill) q.set('skill', params.skill);
    if (params?.clientId) q.set('clientId', params.clientId);
    if (params?.status) q.set('status', params.status);
    if (params?.experienceLevel) q.set('experienceLevel', params.experienceLevel);
    if (params?.page) q.set('page', params.page.toString());
    if (params?.pageSize) q.set('pageSize', params.pageSize.toString());
    return request<PaginatedResponse<Job>>(`/jobs?${q.toString()}`);
  },

  createJob: (data: {
    title: string;
    description: string;
    requiredSkills: string[];
    experienceLevel: string;
    jobType: string;
    clientId: string;
    location: string;
    salaryRange?: string;
  }) =>
    request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateJob: (id: string, data: Partial<Job>) =>
    request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleJobStatus: (id: string) =>
    request<Job>(`/jobs/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  // Candidates
  getCandidates: (params?: {
    search?: string;
    skill?: string;
    status?: CandidateStatus;
    source?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.skill) q.set('skill', params.skill);
    if (params?.status) q.set('status', params.status);
    if (params?.source) q.set('source', params.source);
    if (params?.page) q.set('page', params.page.toString());
    if (params?.pageSize) q.set('pageSize', params.pageSize.toString());
    return request<PaginatedResponse<Candidate>>(`/candidates?${q.toString()}`);
  },

  createCandidate: (data: {
    name: string;
    email: string;
    phone: string;
    location: string;
    parsedSkills?: string[];
    parsedExperience?: string;
    parsedEducation?: string;
    source?: string;
    notes?: string;
  }) =>
    request<Candidate>('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadCandidateResume: (formData: FormData) =>
    request<Candidate>('/candidates/upload-resume', {
      method: 'POST',
      body: formData,
    }),

  updateCandidate: (id: string, data: Partial<Candidate>) =>
    request<Candidate>(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  checkDuplicateCandidate: (data: { name: string; email: string; skills?: string[]; excludeId?: string }) =>
    request<{
      isDuplicate: boolean;
      possibleDuplicates: Array<{
        candidate: Candidate;
        reasons: string[];
        similarityScore: number;
      }>;
    }>('/candidates/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reparseCandidateResume: (id: string) =>
    request<Candidate>(`/candidates/${id}/reparse`, {
      method: 'POST',
    }),

  aiSearchCandidates: (query: string) =>
    request<{
      queryParsing: ParsedSearchQuery;
      candidates: Array<{ candidate: Candidate; relevanceScore: number; matchedSkills: string[] }>;
    }>('/candidates/ai-search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Applications
  getApplications: (params?: {
    jobId?: string;
    candidateId?: string;
    stage?: PipelineStage;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.jobId) q.set('jobId', params.jobId);
    if (params?.candidateId) q.set('candidateId', params.candidateId);
    if (params?.stage) q.set('stage', params.stage);
    if (params?.page) q.set('page', params.page.toString());
    if (params?.pageSize) q.set('pageSize', params.pageSize.toString());
    return request<PaginatedResponse<Application>>(`/applications?${q.toString()}`);
  },

  createApplication: (candidateId: string, jobId: string) =>
    request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify({ candidateId, jobId }),
    }),

  updateApplicationStage: (id: string, stage: PipelineStage, notes?: string) =>
    request<Application>(`/applications/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, notes }),
    }),

  rescoreApplication: (id: string) =>
    request<Application>(`/applications/${id}/rescore`, {
      method: 'POST',
    }),

  getRecommendedCandidates: (jobId: string, limit = 5) =>
    request<RecommendedCandidate[]>(`/applications/recommended/${jobId}?limit=${limit}`),

  // Audit Logs
  getAuditLogs: (params?: { page?: number; pageSize?: number; action?: string; entity?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.pageSize) q.set('pageSize', params.pageSize.toString());
    if (params?.action) q.set('action', params.action);
    if (params?.entity) q.set('entity', params.entity);
    if (params?.search) q.set('search', params.search);
    return request<PaginatedResponse<AuditLog>>(`/audit?${q.toString()}`);
  },

  // Activity Feed / Notifications
  getActivityFeed: (limit = 15) =>
    request<ActivityItem[]>(`/activity?limit=${limit}`),

  // Analytics & AI Insights
  getAnalyticsDashboard: () =>
    request<AnalyticsDashboardData>('/analytics/dashboard'),

  getSuccessPredictions: () =>
    request<CandidateSuccessPrediction[]>('/analytics/predictions'),

  getSuccessPredictionForApp: (appId: string) =>
    request<CandidateSuccessPrediction>(`/analytics/predictions/${appId}`),
};
