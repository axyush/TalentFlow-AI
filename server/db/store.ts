import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserWithPassword, Client, Job, Candidate, Application, AuditLog } from '../../src/types/index.js';

interface DatabaseSchema {
  users: UserWithPassword[];
  clients: Client[];
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialSeedData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const recruiterPasswordHash = bcrypt.hashSync('recruiter123', 10);
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'usr_admin',
        name: 'Alex Morgan (Admin)',
        email: 'admin@talentflow.ai',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        createdAt: now,
      },
      {
        id: 'usr_recruiter',
        name: 'Sarah Jenkins (Recruiter)',
        email: 'recruiter@talentflow.ai',
        passwordHash: recruiterPasswordHash,
        role: 'RECRUITER',
        createdAt: now,
      },
    ],
    clients: [
      {
        id: 'cli_1',
        name: 'Acme Technologies',
        industry: 'Software & Cloud Services',
        contactPerson: 'David Chen',
        email: 'd.chen@acmetech.io',
        phone: '+1 (555) 234-5678',
        status: 'ACTIVE',
        notes: 'Enterprise account with 5 active headcount openings.',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'cli_2',
        name: 'Apex Health Systems',
        industry: 'Healthcare Technology',
        contactPerson: 'Dr. Rachel Vance',
        email: 'vance@apexhealth.org',
        phone: '+1 (555) 987-6543',
        status: 'ACTIVE',
        notes: 'Looking for senior backend developers with HIPAA compliance experience.',
        createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'cli_3',
        name: 'FinPulse Capital',
        industry: 'Fintech & Quantitative Trading',
        contactPerson: 'Marcus Brody',
        email: 'm.brody@finpulse.com',
        phone: '+1 (555) 456-7890',
        status: 'ACTIVE',
        notes: 'High urgency on Senior Full-Stack React/Node positions.',
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
    ],
    jobs: [
      {
        id: 'job_1',
        title: 'Senior Full-Stack Engineer (React & Node)',
        description: 'We are seeking a seasoned Senior Full-Stack Engineer to architect high-throughput financial web applications. Required expertise in React 18, TypeScript, Express, PostgreSQL, and AWS.',
        requiredSkills: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'REST API'],
        experienceLevel: 'Senior',
        jobType: 'Full-time',
        clientId: 'cli_3',
        clientName: 'FinPulse Capital',
        location: 'New York, NY (Hybrid)',
        salaryRange: '$150,000 - $185,000',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'job_2',
        title: 'Lead DevOps / Cloud Platform Engineer',
        description: 'Architect scalable Kubernetes clusters, Terraform infrastructure, and CI/CD pipelines for mission-critical healthcare systems.',
        requiredSkills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Python'],
        experienceLevel: 'Lead',
        jobType: 'Full-time',
        clientId: 'cli_2',
        clientName: 'Apex Health Systems',
        location: 'Boston, MA (Remote)',
        salaryRange: '$165,000 - $195,000',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'job_3',
        title: 'Frontend Developer (React & Tailwind)',
        description: 'Build polished user interfaces and design systems for enterprise SaaS applications.',
        requiredSkills: ['React', 'JavaScript', 'Tailwind CSS', 'HTML5', 'CSS3', 'Git'],
        experienceLevel: 'Mid-Level',
        jobType: 'Full-time',
        clientId: 'cli_1',
        clientName: 'Acme Technologies',
        location: 'San Francisco, CA',
        salaryRange: '$110,000 - $135,000',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
    ],
    candidates: [
      {
        id: 'cand_1',
        name: 'Elena Rostova',
        email: 'elena.rostova@devmail.io',
        phone: '+1 (555) 321-7654',
        location: 'New York, NY',
        parsedSkills: ['React', 'TypeScript', 'Node.js', 'Express', 'GraphQL', 'Tailwind CSS', 'PostgreSQL'],
        parsedExperience: '6 years of full-stack engineering experience at Fintech startups.',
        parsedEducation: 'B.S. in Computer Science, Columbia University',
        source: 'LinkedIn',
        status: 'ACTIVE',
        notes: 'Strong candidate for FinPulse position.',
        createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'cand_2',
        name: 'Marcus Vance',
        email: 'mvance@cloudtech.dev',
        phone: '+1 (555) 654-9870',
        location: 'Boston, MA',
        parsedSkills: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'Python', 'Go', 'Prometheus'],
        parsedExperience: '8 years specializing in Cloud Infrastructure & DevOps automation.',
        parsedEducation: 'M.S. in Software Engineering, MIT',
        source: 'Referral',
        status: 'ACTIVE',
        notes: 'Recommended by Apex Health engineering director.',
        createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'cand_3',
        name: 'Sophia Martinez',
        email: 'sophia.m@uiworks.com',
        phone: '+1 (555) 789-0123',
        location: 'San Francisco, CA',
        parsedSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Jest', 'Figma'],
        parsedExperience: '4 years of experience building scalable frontend design systems.',
        parsedEducation: 'B.A. in Interactive Media, UC Berkeley',
        source: 'Portal',
        status: 'NEW',
        notes: 'Applied via company careers portal.',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
    ],
    applications: [
      {
        id: 'app_1',
        candidateId: 'cand_1',
        candidateName: 'Elena Rostova',
        candidateEmail: 'elena.rostova@devmail.io',
        jobId: 'job_1',
        jobTitle: 'Senior Full-Stack Engineer (React & Node)',
        clientName: 'FinPulse Capital',
        currentStage: 'Technical Round',
        aiScore: 92,
        history: [
          { stage: 'Applied', timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), changedBy: 'Sarah Jenkins (Recruiter)' },
          { stage: 'Screening', timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), changedBy: 'Sarah Jenkins (Recruiter)' },
          { stage: 'Interview', timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), changedBy: 'Sarah Jenkins (Recruiter)' },
          { stage: 'Technical Round', timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), changedBy: 'Sarah Jenkins (Recruiter)' },
        ],
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'app_2',
        candidateId: 'cand_2',
        candidateName: 'Marcus Vance',
        candidateEmail: 'mvance@cloudtech.dev',
        jobId: 'job_2',
        jobTitle: 'Lead DevOps / Cloud Platform Engineer',
        clientName: 'Apex Health Systems',
        currentStage: 'Screening',
        aiScore: 88,
        history: [
          { stage: 'Applied', timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), changedBy: 'Sarah Jenkins (Recruiter)' },
          { stage: 'Screening', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), changedBy: 'Sarah Jenkins (Recruiter)' },
        ],
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: now,
      },
    ],
    auditLogs: [
      {
        id: 'log_1',
        userId: 'usr_admin',
        userName: 'Alex Morgan (Admin)',
        userRole: 'ADMIN',
        action: 'SYSTEM_INIT',
        entity: 'System',
        details: 'TalentFlow AI Database Initialized with default settings and seed data.',
        timestamp: now,
      },
    ],
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      } catch (err) {
        console.error('Error reading db.json, initializing fresh seed:', err);
      }
    }
    const seed = getInitialSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to db.json:', err);
    }
  }

  public save() {
    this.saveData();
  }

  // Getters
  public get users(): UserWithPassword[] { return this.data.users; }
  public get clients(): Client[] { return this.data.clients; }
  public get jobs(): Job[] { return this.data.jobs; }
  public get candidates(): Candidate[] { return this.data.candidates; }
  public get applications(): Application[] { return this.data.applications; }
  public get auditLogs(): AuditLog[] { return this.data.auditLogs; }

  // Setters
  public set users(value: UserWithPassword[]) { this.data.users = value; this.save(); }
  public set clients(value: Client[]) { this.data.clients = value; this.save(); }
  public set jobs(value: Job[]) { this.data.jobs = value; this.save(); }
  public set candidates(value: Candidate[]) { this.data.candidates = value; this.save(); }
  public set applications(value: Application[]) { this.data.applications = value; this.save(); }
  public set auditLogs(value: AuditLog[]) { this.data.auditLogs = value; this.save(); }
}

export const db = new Store();
