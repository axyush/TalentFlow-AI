import { db } from '../db/store.js';
import { Application, PipelineStage, User, PaginatedResponse, RecommendedCandidate, Candidate } from '../../src/types/index.js';
import { AuditService } from './auditService.js';
import { CandidateService } from './candidateService.js';
import { JobService } from './jobService.js';
import { GeminiService } from './geminiService.js';

export class ApplicationService {
  public static listApplications(params: {
    jobId?: string;
    candidateId?: string;
    stage?: PipelineStage;
    page?: number;
    pageSize?: number;
  }): PaginatedResponse<Application> {
    let apps = [...db.applications];

    if (params.jobId) {
      apps = apps.filter((a) => a.jobId === params.jobId);
    }
    if (params.candidateId) {
      apps = apps.filter((a) => a.candidateId === params.candidateId);
    }
    if (params.stage) {
      apps = apps.filter((a) => a.currentStage === params.stage);
    }

    apps.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = apps.length;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 10);
    const startIndex = (page - 1) * pageSize;
    const paginatedData = apps.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  public static async createApplication(candidateId: string, jobId: string, actor: User): Promise<Application> {
    const candidate = CandidateService.getCandidateById(candidateId);
    if (!candidate) throw new Error('Candidate not found');

    const job = JobService.getJobById(jobId);
    if (!job) throw new Error('Job not found');

    const existing = db.applications.find(
      (a) => a.candidateId === candidateId && a.jobId === jobId
    );
    if (existing) {
      throw new Error('Candidate has already applied to this job');
    }

    const now = new Date().toISOString();

    // Compute AI match score and analysis using Gemini AI
    let aiMatchResult;
    try {
      aiMatchResult = await GeminiService.evaluateMatch(candidate, job);
    } catch (err) {
      console.warn('AI Match evaluation failed on createApplication:', err);
    }

    const newApp: Application = {
      id: `app_${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      jobId: job.id,
      jobTitle: job.title,
      clientName: job.clientName,
      currentStage: 'Applied',
      aiScore: aiMatchResult ? aiMatchResult.matchScore : 50,
      aiAnalysis: aiMatchResult,
      history: [
        {
          stage: 'Applied',
          timestamp: now,
          changedBy: actor.name,
          notes: 'Application linked manually',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.applications = [newApp, ...db.applications];

    // Ensure candidate status is ACTIVE
    CandidateService.updateCandidate(candidate.id, { status: 'ACTIVE' }, actor);

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'CREATE_APPLICATION',
      'Application',
      newApp.id,
      `Linked candidate "${candidate.name}" to job "${job.title}" (AI Match Score: ${newApp.aiScore}%)`
    );

    return newApp;
  }

  public static async recomputeMatchScore(appId: string, actor: User): Promise<Application> {
    const appIndex = db.applications.findIndex((a) => a.id === appId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = db.applications[appIndex];
    const candidate = CandidateService.getCandidateById(app.candidateId);
    const job = JobService.getJobById(app.jobId);

    if (!candidate || !job) throw new Error('Candidate or Job record missing');

    const aiMatchResult = await GeminiService.evaluateMatch(candidate, job);

    const updatedApp: Application = {
      ...app,
      aiScore: aiMatchResult.matchScore,
      aiAnalysis: aiMatchResult,
      updatedAt: new Date().toISOString(),
    };

    const updatedApps = [...db.applications];
    updatedApps[appIndex] = updatedApp;
    db.applications = updatedApps;

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'REEVALUATE_AI_MATCH',
      'Application',
      appId,
      `Re-evaluated AI Match for candidate "${app.candidateName}" on job "${app.jobTitle}" (Score: ${aiMatchResult.matchScore}%)`
    );

    return updatedApp;
  }

  public static async getRecommendedCandidatesForJob(jobId: string, limit = 5): Promise<RecommendedCandidate[]> {
    const job = JobService.getJobById(jobId);
    if (!job) throw new Error('Job not found');

    // Get candidate IDs that have already applied to this job
    const appliedCandidateIds = db.applications
      .filter((a) => a.jobId === jobId)
      .map((a) => a.candidateId);

    // Filter unassigned candidates
    const availableCandidates = db.candidates.filter(
      (c) => !appliedCandidateIds.includes(c.id) && c.status !== 'REJECTED'
    );

    if (availableCandidates.length === 0) return [];

    // Evaluate match scores for available candidates
    const scoredList: RecommendedCandidate[] = [];

    for (const cand of availableCandidates) {
      const match = await GeminiService.evaluateMatch(cand, job);
      scoredList.push({
        candidate: cand,
        matchScore: match.matchScore,
        rationale: match.rationale,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        recommendation: match.recommendation,
      });
    }

    // Sort descending by matchScore and take top limit
    scoredList.sort((a, b) => b.matchScore - a.matchScore);

    return scoredList.slice(0, limit);
  }

  public static advanceStage(
    appId: string,
    newStage: PipelineStage,
    actor: User,
    notes?: string
  ): Application {
    const appIndex = db.applications.findIndex((a) => a.id === appId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = db.applications[appIndex];
    const now = new Date().toISOString();

    const updatedHistory = [
      ...app.history,
      {
        stage: newStage,
        timestamp: now,
        changedBy: actor.name,
        notes: notes || `Stage updated to ${newStage}`,
      },
    ];

    const updatedApp: Application = {
      ...app,
      currentStage: newStage,
      history: updatedHistory,
      updatedAt: now,
    };

    const updatedApps = [...db.applications];
    updatedApps[appIndex] = updatedApp;
    db.applications = updatedApps;

    // Also update candidate status if hired or rejected
    if (newStage === 'Hired') {
      CandidateService.updateCandidate(app.candidateId, { status: 'HIRED' }, actor);
    } else if (newStage === 'Rejected') {
      CandidateService.updateCandidate(app.candidateId, { status: 'REJECTED' }, actor);
    } else {
      CandidateService.updateCandidate(app.candidateId, { status: 'ACTIVE' }, actor);
    }

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'UPDATE_APPLICATION_STAGE',
      'Application',
      appId,
      `Advanced candidate "${app.candidateName}" to stage "${newStage}" for "${app.jobTitle}"`
    );

    return updatedApp;
  }
}
