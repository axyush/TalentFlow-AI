import { db } from '../db/store.js';
import { Job, JobStatus, ExperienceLevel, JobType, User, PaginatedResponse } from '../../src/types/index.js';
import { AuditService } from './auditService.js';
import { ClientService } from './clientService.js';

export class JobService {
  public static listJobs(params: {
    search?: string;
    skill?: string;
    clientId?: string;
    status?: JobStatus;
    experienceLevel?: ExperienceLevel;
    jobType?: JobType;
    page?: number;
    pageSize?: number;
    sortBy?: 'title' | 'createdAt' | 'status';
    sortOrder?: 'asc' | 'desc';
  }): PaginatedResponse<Job> {
    let jobs = [...db.jobs];

    // Search filter
    if (params.search) {
      const q = params.search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.clientName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      );
    }

    // Skill filter
    if (params.skill) {
      const skillQ = params.skill.toLowerCase();
      jobs = jobs.filter((j) =>
        j.requiredSkills.some((s) => s.toLowerCase().includes(skillQ))
      );
    }

    // Client filter
    if (params.clientId) {
      jobs = jobs.filter((j) => j.clientId === params.clientId);
    }

    // Status filter
    if (params.status) {
      jobs = jobs.filter((j) => j.status === params.status);
    }

    // Experience filter
    if (params.experienceLevel) {
      jobs = jobs.filter((j) => j.experienceLevel === params.experienceLevel);
    }

    // JobType filter
    if (params.jobType) {
      jobs = jobs.filter((j) => j.jobType === params.jobType);
    }

    // Sort
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    jobs.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = jobs.length;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 10);
    const startIndex = (page - 1) * pageSize;
    const paginatedData = jobs.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  public static getJobById(id: string): Job | null {
    return db.jobs.find((j) => j.id === id) || null;
  }

  public static createJob(
    data: {
      title: string;
      description: string;
      requiredSkills: string[];
      experienceLevel: ExperienceLevel;
      jobType: JobType;
      clientId: string;
      location: string;
      salaryRange?: string;
    },
    actor: User
  ): Job {
    const client = ClientService.getClientById(data.clientId);
    if (!client) {
      throw new Error('Selected client does not exist');
    }

    const now = new Date().toISOString();
    const newJob: Job = {
      id: `job_${Date.now()}`,
      title: data.title,
      description: data.description,
      requiredSkills: data.requiredSkills,
      experienceLevel: data.experienceLevel,
      jobType: data.jobType,
      clientId: client.id,
      clientName: client.name,
      location: data.location,
      salaryRange: data.salaryRange || '',
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    db.jobs = [newJob, ...db.jobs];

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'CREATE_JOB',
      'Job',
      newJob.id,
      `Posted job "${newJob.title}" for client ${newJob.clientName}`
    );

    return newJob;
  }

  public static updateJob(
    id: string,
    data: Partial<Omit<Job, 'id' | 'createdAt'>>,
    actor: User
  ): Job {
    const jobIndex = db.jobs.findIndex((j) => j.id === id);
    if (jobIndex === -1) {
      throw new Error('Job posting not found');
    }

    const existingJob = db.jobs[jobIndex];
    let clientName = existingJob.clientName;
    if (data.clientId && data.clientId !== existingJob.clientId) {
      const client = ClientService.getClientById(data.clientId);
      if (client) clientName = client.name;
    }

    const updatedJob: Job = {
      ...existingJob,
      ...data,
      clientName,
      updatedAt: new Date().toISOString(),
    };

    const updatedJobs = [...db.jobs];
    updatedJobs[jobIndex] = updatedJob;
    db.jobs = updatedJobs;

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'UPDATE_JOB',
      'Job',
      id,
      `Updated job posting "${updatedJob.title}"`
    );

    return updatedJob;
  }

  public static toggleJobStatus(id: string, actor: User): Job {
    const job = this.getJobById(id);
    if (!job) {
      throw new Error('Job posting not found');
    }

    const newStatus: JobStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    return this.updateJob(id, { status: newStatus }, actor);
  }
}
