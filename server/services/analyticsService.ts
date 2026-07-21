import { db } from '../db/store.js';
import { PipelineStage, Application } from '../../src/types/index.js';
import { GeminiService } from './geminiService.js';

const STAGES: PipelineStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Technical Round',
  'HR Round',
  'Offer',
  'Hired',
  'Rejected',
];

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

export class AnalyticsService {
  public static async getPipelineMetrics() {
    const totalApps = db.applications.length;
    const totalHired = db.applications.filter((a) => a.currentStage === 'Hired').length;
    const overallRate = totalApps > 0 ? Math.round((totalHired / totalApps) * 100 * 10) / 10 : 0;

    // Per-job conversion rates
    const jobMetrics: JobConversionMetric[] = db.jobs.map((job) => {
      const apps = db.applications.filter((a) => a.jobId === job.id);
      const hired = apps.filter((a) => a.currentStage === 'Hired').length;
      const rate = apps.length > 0 ? Math.round((hired / apps.length) * 100 * 10) / 10 : 0;
      return {
        jobId: job.id,
        jobTitle: job.title,
        clientName: job.clientName,
        totalApplications: apps.length,
        hiredCount: hired,
        conversionRate: rate,
      };
    });

    // Stage Durations (Average days spent per stage)
    const stageTimeSums: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};

    STAGES.forEach((s) => {
      stageTimeSums[s] = 0;
      stageCounts[s] = 0;
    });

    const nowMs = Date.now();

    db.applications.forEach((app) => {
      if (!app.history || app.history.length === 0) return;

      for (let i = 0; i < app.history.length; i++) {
        const entry = app.history[i];
        const nextEntry = app.history[i + 1];

        const startMs = new Date(entry.timestamp).getTime();
        const endMs = nextEntry ? new Date(nextEntry.timestamp).getTime() : nowMs;

        const durationDays = Math.max(0.1, (endMs - startMs) / (1000 * 60 * 60 * 24));

        if (stageTimeSums[entry.stage] !== undefined) {
          stageTimeSums[entry.stage] += durationDays;
          stageCounts[entry.stage] += 1;
        }
      }
    });

    const stageDurations: Record<string, number> = {};
    let maxDays = 0;
    let bottleneckStage: PipelineStage = 'Screening';

    STAGES.forEach((stage) => {
      const count = stageCounts[stage] || 0;
      const avgDays = count > 0 ? Math.round((stageTimeSums[stage] / count) * 10) / 10 : 2.5;
      stageDurations[stage] = avgDays;

      if (stage !== 'Hired' && stage !== 'Rejected' && avgDays > maxDays) {
        maxDays = avgDays;
        bottleneckStage = stage;
      }
    });

    // Recruiter Performance Metrics
    const recruiterMap: Record<string, RecruiterMetric> = {};

    db.users.forEach((u) => {
      if (u.role === 'RECRUITER' || u.role === 'ADMIN') {
        recruiterMap[u.id] = {
          userId: u.id,
          userName: u.name,
          userRole: u.role,
          candidatesAdded: 0,
          applicationsManaged: 0,
          hiresMade: 0,
        };
      }
    });

    // Audit log aggregation
    db.auditLogs.forEach((log) => {
      if (!recruiterMap[log.userId]) {
        recruiterMap[log.userId] = {
          userId: log.userId,
          userName: log.userName,
          userRole: log.userRole,
          candidatesAdded: 0,
          applicationsManaged: 0,
          hiresMade: 0,
        };
      }

      if (log.action === 'CREATE_CANDIDATE' || log.action === 'PARSE_RESUME') {
        recruiterMap[log.userId].candidatesAdded += 1;
      } else if (log.action === 'UPDATE_APPLICATION_STAGE' || log.action === 'CREATE_APPLICATION') {
        recruiterMap[log.userId].applicationsManaged += 1;
        if (log.details.includes('Hired') || log.details.includes('HIRED')) {
          recruiterMap[log.userId].hiresMade += 1;
        }
      }
    });

    const recruiterPerformance = Object.values(recruiterMap);

    // Call Gemini API for AI Hiring Insights
    const aiInsights = await GeminiService.generateHiringInsights({
      overallConversionRate: overallRate,
      totalApplications: totalApps,
      totalHired,
      jobConversionRates: jobMetrics,
      stageDurations,
      bottleneckStage,
      recruiterPerformance,
    });

    return {
      overallConversionRate: overallRate,
      totalApplications: totalApps,
      totalHired,
      jobConversionRates: jobMetrics,
      stageDurations,
      bottleneckStage,
      recruiterPerformance,
      aiInsights,
    };
  }

  public static predictSuccess(app: Application): CandidateSuccessPrediction {
    let baseScore = app.aiScore || 50;
    
    // Stage weight bonus
    let stageWeight = 0;
    switch (app.currentStage) {
      case 'Applied': stageWeight = 0; break;
      case 'Screening': stageWeight = 10; break;
      case 'Interview': stageWeight = 25; break;
      case 'Technical Round': stageWeight = 40; break;
      case 'HR Round': stageWeight = 60; break;
      case 'Offer': stageWeight = 85; break;
      case 'Hired': stageWeight = 100; break;
      case 'Rejected': stageWeight = -50; break;
    }

    const missingCount = app.aiAnalysis?.missingSkills?.length || 0;
    const matchedCount = app.aiAnalysis?.matchedSkills?.length || 1;

    let skillFactor = (matchedCount / (matchedCount + missingCount)) * 100;

    let totalProb = Math.round(baseScore * 0.4 + stageWeight * 0.4 + skillFactor * 0.2);
    if (app.currentStage === 'Hired') totalProb = 100;
    if (app.currentStage === 'Rejected') totalProb = 0;

    totalProb = Math.min(99, Math.max(1, totalProb));

    let likelihood: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (totalProb >= 70) likelihood = 'HIGH';
    else if (totalProb < 45) likelihood = 'LOW';

    const keyFactors: string[] = [];
    if (app.aiScore >= 80) keyFactors.push(`High AI Match Score (${app.aiScore}%)`);
    if (matchedCount > 0) keyFactors.push(`Possesses ${matchedCount} key required technical skills`);
    if (app.history.length > 2) keyFactors.push(`Successfully cleared ${app.history.length - 1} evaluation stages`);
    if (missingCount > 0) keyFactors.push(`Has ${missingCount} skill gap(s) to address`);

    return {
      appId: app.id,
      candidateId: app.candidateId,
      candidateName: app.candidateName,
      jobTitle: app.jobTitle,
      currentStage: app.currentStage,
      aiMatchScore: app.aiScore,
      likelihood,
      successProbability: totalProb,
      keyFactors,
    };
  }
}
