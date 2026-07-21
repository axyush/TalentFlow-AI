import fs from 'fs';
import path from 'path';
import { db } from '../db/store.js';
import { Candidate, CandidateStatus, CandidateSource, User, PaginatedResponse, ParsedResumeData } from '../../src/types/index.js';
import { AuditService } from './auditService.js';
import { GeminiService } from './geminiService.js';

export class CandidateService {
  public static listCandidates(params: {
    search?: string;
    skill?: string;
    status?: CandidateStatus;
    source?: CandidateSource;
    page?: number;
    pageSize?: number;
    sortBy?: 'name' | 'createdAt' | 'status';
    sortOrder?: 'asc' | 'desc';
  }): PaginatedResponse<Candidate> {
    let candidates = [...db.candidates];

    // Search filter (name, email, location, notes)
    if (params.search) {
      const q = params.search.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    // Skill filter
    if (params.skill) {
      const skillQ = params.skill.toLowerCase();
      candidates = candidates.filter((c) =>
        c.parsedSkills.some((s) => s.toLowerCase().includes(skillQ))
      );
    }

    // Status filter
    if (params.status) {
      candidates = candidates.filter((c) => c.status === params.status);
    }

    // Source filter
    if (params.source) {
      candidates = candidates.filter((c) => c.source === params.source);
    }

    // Sort
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    candidates.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = candidates.length;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 10);
    const startIndex = (page - 1) * pageSize;
    const paginatedData = candidates.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  public static getCandidateById(id: string): Candidate | null {
    return db.candidates.find((c) => c.id === id) || null;
  }

  public static checkDuplicates(data: { name: string; email: string; skills?: string[]; excludeId?: string }) {
    const normName = (data.name || '').toLowerCase().trim();
    const normEmail = (data.email || '').toLowerCase().trim();
    const inputSkills = (data.skills || []).map((s) => s.toLowerCase().trim());

    const possibleDuplicates: Array<{
      candidate: Candidate;
      reasons: string[];
      similarityScore: number;
    }> = [];

    for (const c of db.candidates) {
      if (data.excludeId && c.id === data.excludeId) continue;

      const cName = c.name.toLowerCase().trim();
      const cEmail = c.email.toLowerCase().trim();
      const reasons: string[] = [];
      let score = 0;

      // Exact or very close email match
      if (normEmail && cEmail && normEmail === cEmail) {
        reasons.push(`Matching email address (${c.email})`);
        score += 80;
      } else if (normEmail && cEmail && normEmail.split('@')[0] === cEmail.split('@')[0]) {
        reasons.push(`Matching email username handle`);
        score += 40;
      }

      // Name similarity
      if (normName && cName) {
        if (normName === cName) {
          reasons.push(`Identical candidate name ("${c.name}")`);
          score += 60;
        } else if (normName.includes(cName) || cName.includes(normName)) {
          reasons.push(`Highly similar name ("${c.name}")`);
          score += 35;
        }
      }

      // Skill set similarity overlap
      if (inputSkills.length > 0 && c.parsedSkills && c.parsedSkills.length > 0) {
        const cSkills = c.parsedSkills.map((s) => s.toLowerCase().trim());
        const shared = inputSkills.filter((s) => cSkills.includes(s));
        if (shared.length >= 3 || (shared.length > 0 && shared.length / Math.max(inputSkills.length, cSkills.length) >= 0.5)) {
          reasons.push(`High skill overlap (${shared.slice(0, 4).join(', ')})`);
          score += 25;
        }
      }

      if (score >= 40) {
        possibleDuplicates.push({
          candidate: c,
          reasons,
          similarityScore: Math.min(100, score),
        });
      }
    }

    possibleDuplicates.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      isDuplicate: possibleDuplicates.length > 0,
      possibleDuplicates,
    };
  }

  public static async naturalLanguageSearch(query: string) {
    const parsedQuery = await GeminiService.parseNaturalLanguageSearch(query);

    const targetSkills = [...(parsedQuery.skills || []), ...(parsedQuery.techStack || [])].map((s) => s.toLowerCase().trim());
    const targetLoc = parsedQuery.location ? parsedQuery.location.toLowerCase().trim() : undefined;
    const minYears = parsedQuery.minYearsExperience;

    const scoredCandidates: Array<{
      candidate: Candidate;
      relevanceScore: number;
      matchedSkills: string[];
    }> = [];

    for (const cand of db.candidates) {
      let score = 0;
      const candSkills = (cand.parsedSkills || []).map((s) => s.toLowerCase().trim());
      const matched = targetSkills.filter((ts) =>
        candSkills.some((cs) => cs.includes(ts) || ts.includes(cs))
      );

      // Skill score contribution (up to 60 points)
      if (targetSkills.length > 0) {
        score += (matched.length / targetSkills.length) * 60;
      } else {
        score += 30; // base score if no specific skills extracted
      }

      // Location match (20 points)
      if (targetLoc && cand.location) {
        if (cand.location.toLowerCase().includes(targetLoc) || targetLoc.includes('remote')) {
          score += 20;
        }
      } else if (!targetLoc) {
        score += 10;
      }

      // Experience level / years match (20 points)
      const candYears = cand.parsedData?.yearsOfExperience || 2;
      if (minYears !== undefined) {
        if (candYears >= minYears) {
          score += 20;
        } else {
          score += Math.max(0, 20 - (minYears - candYears) * 5);
        }
      } else {
        score += 10;
      }

      scoredCandidates.push({
        candidate: cand,
        relevanceScore: Math.min(100, Math.round(score)),
        matchedSkills: matched,
      });
    }

    scoredCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      queryParsing: parsedQuery,
      candidates: scoredCandidates,
    };
  }

  public static async parseCandidateResume(
    candidateId: string,
    actor: User,
    fileBuffer?: Buffer,
    fileMimeType?: string
  ): Promise<Candidate> {
    const candidate = this.getCandidateById(candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Set status to pending
    let updatedCandidate = this.updateCandidate(candidateId, { parseStatus: 'PENDING', parseError: undefined }, actor);

    try {
      let buffer = fileBuffer;
      let mimeType = fileMimeType || 'application/pdf';

      if (!buffer && candidate.resumeUrl) {
        const relativePath = candidate.resumeUrl.startsWith('/')
          ? candidate.resumeUrl.slice(1)
          : candidate.resumeUrl;
        const fullPath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(fullPath)) {
          buffer = fs.readFileSync(fullPath);
          const ext = path.extname(fullPath).toLowerCase();
          if (ext === '.txt') mimeType = 'text/plain';
          else if (ext === '.pdf') mimeType = 'application/pdf';
          else if (ext === '.doc' || ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
      }

      const parsedData: ParsedResumeData = await GeminiService.parseResume(buffer, mimeType);

      // Build readable string summaries for existing backward-compatibility fields
      const formattedExperienceStr = parsedData.workExperience
        .map((exp) => `${exp.role || 'Role'} at ${exp.company || 'Company'} (${exp.duration || ''}) - ${exp.description || ''}`)
        .join('\n');

      const formattedEduStr = parsedData.education
        .map((edu) => `${edu.degree || 'Degree'}, ${edu.institution || 'Institution'} (${edu.year || ''})`)
        .join('\n');

      updatedCandidate = this.updateCandidate(
        candidateId,
        {
          parsedData,
          parsedSkills: parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : candidate.parsedSkills,
          parsedExperience: formattedExperienceStr || candidate.parsedExperience,
          parsedEducation: formattedEduStr || candidate.parsedEducation,
          parseStatus: 'SUCCESS',
          parseError: undefined,
        },
        actor
      );

      AuditService.log(
        actor.id,
        actor.name,
        actor.role,
        'PARSE_RESUME_SUCCESS',
        'Candidate',
        candidateId,
        `Successfully parsed resume for candidate "${candidate.name}" using Gemini AI (${parsedData.skills.length} skills extracted)`
      );

      return updatedCandidate;
    } catch (err: any) {
      console.error(`Error parsing resume for candidate ${candidateId}:`, err);

      updatedCandidate = this.updateCandidate(
        candidateId,
        {
          parseStatus: 'FAILED',
          parseError: err.message || 'Failed to parse resume with AI',
        },
        actor
      );

      AuditService.log(
        actor.id,
        actor.name,
        actor.role,
        'PARSE_RESUME_FAILED',
        'Candidate',
        candidateId,
        `Resume parsing failed for candidate "${candidate.name}": ${err.message}`
      );

      return updatedCandidate;
    }
  }

  public static createCandidate(
    data: {
      name: string;
      email: string;
      phone: string;
      location: string;
      parsedSkills?: string[];
      parsedExperience?: string;
      parsedEducation?: string;
      source?: CandidateSource;
      resumeUrl?: string;
      resumeFileName?: string;
      notes?: string;
      parseStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'NONE';
      parsedData?: ParsedResumeData;
    },
    actor: User
  ): Candidate {
    const now = new Date().toISOString();
    const newCandidate: Candidate = {
      id: `cand_${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      parsedSkills: data.parsedSkills || [],
      parsedExperience: data.parsedExperience || '',
      parsedEducation: data.parsedEducation || '',
      source: data.source || 'Manual',
      status: 'NEW',
      resumeUrl: data.resumeUrl || '',
      resumeFileName: data.resumeFileName || '',
      parseStatus: data.parseStatus || (data.resumeUrl ? 'PENDING' : 'NONE'),
      parsedData: data.parsedData,
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    db.candidates = [newCandidate, ...db.candidates];

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'CREATE_CANDIDATE',
      'Candidate',
      newCandidate.id,
      `Added candidate "${newCandidate.name}" (${newCandidate.email})`
    );

    return newCandidate;
  }

  public static updateCandidate(
    id: string,
    data: Partial<Omit<Candidate, 'id' | 'createdAt'>>,
    actor: User
  ): Candidate {
    const candIndex = db.candidates.findIndex((c) => c.id === id);
    if (candIndex === -1) {
      throw new Error('Candidate not found');
    }

    const updatedCandidate: Candidate = {
      ...db.candidates[candIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const updatedCandidates = [...db.candidates];
    updatedCandidates[candIndex] = updatedCandidate;
    db.candidates = updatedCandidates;

    AuditService.log(
      actor.id,
      actor.name,
      actor.role,
      'UPDATE_CANDIDATE',
      'Candidate',
      id,
      `Updated profile for candidate "${updatedCandidate.name}"`
    );

    return updatedCandidate;
  }
}

