export type UserRole = 'ADMIN' | 'RECRUITER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type ExperienceLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Executive';
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote';

export interface Job {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  jobType: JobType;
  clientId: string;
  clientName: string;
  location: string;
  salaryRange?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export type CandidateStatus = 'NEW' | 'ACTIVE' | 'HIRED' | 'REJECTED';
export type CandidateSource = 'Manual' | 'LinkedIn' | 'Referral' | 'Portal' | 'Upload';

export interface EducationItem {
  degree?: string;
  institution?: string;
  year?: string;
  details?: string;
}

export interface WorkExperienceItem {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
}

export interface ParsedResumeData {
  skills: string[];
  education: EducationItem[];
  certifications: string[];
  yearsOfExperience: number;
  pastJobTitles: string[];
  notableProjects: string[];
  workExperience: WorkExperienceItem[];
  summary?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  resumeUrl?: string;
  resumeFileName?: string;
  parsedSkills: string[];
  parsedExperience?: string;
  parsedEducation?: string;
  parsedData?: ParsedResumeData;
  parseStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'NONE';
  parseError?: string;
  source: CandidateSource;
  status: CandidateStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PipelineStage = 
  | 'Applied' 
  | 'Screening' 
  | 'Interview' 
  | 'Technical Round' 
  | 'HR Round' 
  | 'Offer' 
  | 'Hired' 
  | 'Rejected';

export interface ApplicationHistory {
  stage: PipelineStage;
  timestamp: string;
  changedBy: string;
  notes?: string;
}

export interface AIMatchAnalysis {
  matchScore: number; // 0 to 100
  rationale: string;
  matchedSkills: string[];
  missingSkills: string[];
  experienceFit: string;
  recommendation?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  currentStage: PipelineStage;
  aiScore: number; // 0 to 100
  aiAnalysis?: AIMatchAnalysis;
  history: ApplicationHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ParsedSearchQuery {
  skills: string[];
  techStack: string[];
  location?: string;
  experienceLevel?: string;
  minYearsExperience?: number;
  originalQuery: string;
}

export interface RecommendedCandidate {
  candidate: Candidate;
  matchScore: number;
  rationale: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: 'User' | 'Client' | 'Job' | 'Candidate' | 'Application' | 'System';
  entityId?: string;
  details: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ActivityItem {
  id: string;
  type: 'STAGE_CHANGE' | 'NEW_CANDIDATE' | 'NEW_JOB' | 'NEW_APPLICATION' | 'GENERAL';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  entityId?: string;
}

export interface JobConversionMetric {
  jobId: string;
  jobTitle: string;
  clientName: string;
  totalApplications: number;
  hiredCount: number;
  conversionRate: number;
}

export interface RecruiterMetric {
  userId: string;
  userName: string;
  userRole: string;
  candidatesAdded: number;
  applicationsManaged: number;
  hiresMade: number;
}

export interface AIHiringInsights {
  summary: string;
  insights: string[];
  bottleneckAnalysis: string;
  recommendations: string[];
}

export interface AnalyticsDashboardData {
  overallConversionRate: number;
  totalApplications: number;
  totalHired: number;
  jobConversionRates: JobConversionMetric[];
  stageDurations: Record<string, number>;
  bottleneckStage: PipelineStage;
  recruiterPerformance: RecruiterMetric[];
  aiInsights: AIHiringInsights;
}

export interface CandidateSuccessPrediction {
  appId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  currentStage: PipelineStage;
  aiMatchScore: number;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  successProbability: number;
  keyFactors: string[];
}


