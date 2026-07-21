import { GoogleGenAI, Type } from '@google/genai';
import { ParsedResumeData, AIMatchAnalysis, ParsedSearchQuery, Candidate, Job } from '../../src/types/index.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

const resumeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Extracted technical and soft skills',
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          year: { type: Type.STRING },
          details: { type: Type.STRING },
        },
      },
      description: 'Educational qualifications and degrees',
    },
    certifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Certifications and licenses',
    },
    yearsOfExperience: {
      type: Type.NUMBER,
      description: 'Total estimated years of relevant professional experience',
    },
    pastJobTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Past job titles or positions held',
    },
    notableProjects: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key projects, achievements, or notable portfolio pieces',
    },
    workExperience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.STRING },
        },
      },
      description: 'Chronological work experience items',
    },
    summary: {
      type: Type.STRING,
      description: 'An executive summary of candidate background and strengths',
    },
  },
  required: ['skills', 'yearsOfExperience', 'pastJobTitles'],
};

const matchResponseSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: {
      type: Type.NUMBER,
      description: 'Numeric compatibility score between 0 and 100 based on skill overlap, experience fit, and domain relevance',
    },
    rationale: {
      type: Type.STRING,
      description: 'Concise 2-3 sentence executive rationale detailing key matched strengths and notable gaps',
    },
    matchedSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of job required skills directly matched or possessed by candidate',
    },
    missingSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of required or desired job skills missing from candidate background',
    },
    experienceFit: {
      type: Type.STRING,
      description: 'Categorical fit level: Strong Fit, Moderate Fit, or Needs Upskilling',
    },
    recommendation: {
      type: Type.STRING,
      description: 'A 1-line actionable recommendation if candidate has gaps (e.g. Recommend AWS Certification to strengthen cloud fit)',
    },
  },
  required: ['matchScore', 'rationale', 'matchedSkills', 'missingSkills', 'experienceFit'],
};

const searchQuerySchema = {
  type: Type.OBJECT,
  properties: {
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Extracted key technical skills or programming languages',
    },
    techStack: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Frameworks, databases, or specialized tools mentioned',
    },
    location: {
      type: Type.STRING,
      description: 'Extracted city, region, or remote preference if present in query',
    },
    experienceLevel: {
      type: Type.STRING,
      description: 'Extracted target seniority (Junior, Mid-Level, Senior, Lead, Executive)',
    },
    minYearsExperience: {
      type: Type.NUMBER,
      description: 'Minimum required years of experience if mentioned',
    },
  },
  required: ['skills', 'techStack'],
};

export class GeminiService {
  /**
   * Parse a candidate resume file or text content into structured Candidate profile data using Gemini API.
   */
  public static async parseResume(fileBuffer?: Buffer, mimeType?: string, rawText?: string): Promise<ParsedResumeData> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }

    const ai = getAiClient();

    const promptText = `
You are an expert HR AI Resume Parser for TalentFlow AI ATS.
Analyze the provided candidate resume content and extract clean, structured JSON data matching the requested schema.

Instructions:
1. Identify all core technical & soft skills (e.g. React, TypeScript, Node.js, Leadership, PostgreSQL).
2. Extract chronological work experience history with company name, role/title, duration (e.g., 2021 - Present or 3 yrs), and concise description.
3. List past job titles separately.
4. Calculate or estimate total years of experience as a single numeric value (e.g. 5, 2.5).
5. Extract education credentials (degree, institution, year).
6. Extract certifications and notable projects/achievements if available.
7. Write a concise, 2-3 sentence executive professional summary highlighting key strengths.
`;

    let contents: any;

    if (fileBuffer && mimeType) {
      // Determine supported mimeType or fallback
      let validMimeType = mimeType;
      if (mimeType.includes('pdf')) validMimeType = 'application/pdf';
      else if (mimeType.includes('plain') || mimeType.includes('text')) validMimeType = 'text/plain';
      else if (mimeType.includes('msword') || mimeType.includes('wordprocessing')) {
        // Docx can be passed or converted to text
        const extractedText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        contents = [
          promptText,
          `Resume Text Content:\n${extractedText.slice(0, 15000)}`,
        ];
      }

      if (!contents) {
        contents = [
          promptText,
          {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: validMimeType,
            },
          },
        ];
      }
    } else if (rawText && rawText.trim().length > 0) {
      contents = [
        promptText,
        `Resume Raw Text Content:\n${rawText.slice(0, 15000)}`,
      ];
    } else {
      throw new Error('No resume file buffer or text content provided for parsing.');
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: 'You are a precise, structured resume extraction system.',
          responseMimeType: 'application/json',
          responseSchema: resumeResponseSchema,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      const parsedJson = JSON.parse(responseText.trim()) as ParsedResumeData;

      // Ensure fallback default values for missing properties
      return {
        skills: Array.isArray(parsedJson.skills) ? parsedJson.skills : [],
        education: Array.isArray(parsedJson.education) ? parsedJson.education : [],
        certifications: Array.isArray(parsedJson.certifications) ? parsedJson.certifications : [],
        yearsOfExperience: typeof parsedJson.yearsOfExperience === 'number' ? parsedJson.yearsOfExperience : 0,
        pastJobTitles: Array.isArray(parsedJson.pastJobTitles) ? parsedJson.pastJobTitles : [],
        notableProjects: Array.isArray(parsedJson.notableProjects) ? parsedJson.notableProjects : [],
        workExperience: Array.isArray(parsedJson.workExperience) ? parsedJson.workExperience : [],
        summary: parsedJson.summary || '',
      };
    } catch (err: any) {
      console.error('Error during Gemini resume parsing:', err);
      throw new Error(`Resume parsing failed: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Compute AI Match Score (0-100), Rationale, Matched/Missing Skills, and Recommendation for a candidate vs job.
   */
  public static async evaluateMatch(candidate: Candidate, job: Job): Promise<AIMatchAnalysis> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback local heuristic calculation if API key missing
      return this.fallbackMatchCalculation(candidate, job);
    }

    const ai = getAiClient();

    const candidateSummary = `
Candidate Name: ${candidate.name}
Location: ${candidate.location}
Parsed Skills: ${candidate.parsedSkills.join(', ')}
Experience Summary: ${candidate.parsedExperience || 'N/A'}
Education Summary: ${candidate.parsedEducation || 'N/A'}
Total Years of Experience: ${candidate.parsedData?.yearsOfExperience || 'Unknown'}
Certifications: ${candidate.parsedData?.certifications?.join(', ') || 'None'}
`;

    const jobSummary = `
Job Title: ${job.title}
Client Name: ${job.clientName}
Required Skills: ${job.requiredSkills.join(', ')}
Experience Level Required: ${job.experienceLevel}
Job Type: ${job.jobType}
Location: ${job.location}
Description: ${job.description}
`;

    const promptText = `
You are an expert HR AI Candidate Matcher for TalentFlow AI ATS.
Evaluate the candidate profile against the specified job requirement and calculate a precise 0-100 compatibility score.

Provide:
1. matchScore: 0 to 100 integer.
2. rationale: 2-3 concise sentences explaining why the candidate is or isn't a good fit.
3. matchedSkills: array of skills required by job that candidate possesses.
4. missingSkills: array of skills required by job that candidate lacks.
5. experienceFit: "Strong Fit", "Moderate Fit", or "Under-qualified".
6. recommendation: a 1-line actionable advice or training recommendation if missing skills exist (e.g. "Recommend AWS certification to strengthen fit for cloud roles").
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [promptText, `CANDIDATE:\n${candidateSummary}\n\nJOB REQUIREMENTS:\n${jobSummary}`],
        config: {
          systemInstruction: 'You are an objective, rigorous AI candidate screening system.',
          responseMimeType: 'application/json',
          responseSchema: matchResponseSchema,
        },
      });

      const responseText = response.text;
      if (!responseText) throw new Error('Empty response from Gemini API');

      const parsed = JSON.parse(responseText.trim()) as AIMatchAnalysis;
      return {
        matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore || 50))),
        rationale: parsed.rationale || 'Candidate profile evaluated against job specifications.',
        matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
        experienceFit: parsed.experienceFit || 'Moderate Fit',
        recommendation: parsed.recommendation || (parsed.missingSkills && parsed.missingSkills.length > 0 ? `Recommend acquiring ${parsed.missingSkills.slice(0, 2).join(' & ')} to enhance role fit.` : undefined),
      };
    } catch (err: any) {
      console.warn('Gemini match evaluation error, falling back to heuristic:', err.message);
      return this.fallbackMatchCalculation(candidate, job);
    }
  }

  /**
   * Parse a natural language recruiter search query into structured search parameters.
   */
  public static async parseNaturalLanguageSearch(query: string): Promise<ParsedSearchQuery> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        skills: query.split(/\s+/).filter((w) => w.length > 2),
        techStack: [],
        originalQuery: query,
      };
    }

    const ai = getAiClient();

    const promptText = `
You are an HR AI Search Assistant.
Extract structured filtering parameters from the following natural language recruiter search query.

Recruiter Query: "${query}"

Instructions:
1. Extract skills and tools (e.g., Java, Spring Boot, React, Python, AWS).
2. Extract techStack components separately if distinct.
3. Extract geographic location if specified (e.g., Pune, San Francisco, Remote).
4. Extract requested experience level (Junior, Mid-Level, Senior, Lead) if present.
5. Extract minimum years of experience as a number if mentioned (e.g. "5+ years" -> 5).
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: {
          systemInstruction: 'You parse natural language recruiter searches into structured filters.',
          responseMimeType: 'application/json',
          responseSchema: searchQuerySchema,
        },
      });

      const responseText = response.text;
      if (!responseText) throw new Error('Empty search query response');

      const parsed = JSON.parse(responseText.trim());
      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        location: parsed.location || undefined,
        experienceLevel: parsed.experienceLevel || undefined,
        minYearsExperience: typeof parsed.minYearsExperience === 'number' ? parsed.minYearsExperience : undefined,
        originalQuery: query,
      };
    } catch (err: any) {
      console.warn('Error parsing search query with Gemini, using fallback:', err.message);
      return {
        skills: query.split(/[\s,]+/).filter((w) => w.length > 2),
        techStack: [],
        originalQuery: query,
      };
    }
  }

  /**
   * Fallback heuristic matching calculation when API is offline or rate-limited.
   */
  private static fallbackMatchCalculation(candidate: Candidate, job: Job): AIMatchAnalysis {
    const candidateSkills = (candidate.parsedSkills || []).map((s) => s.toLowerCase());
    const jobSkills = (job.requiredSkills || []).map((s) => s.toLowerCase());

    const matched = job.requiredSkills.filter((s) => candidateSkills.includes(s.toLowerCase()));
    const missing = job.requiredSkills.filter((s) => !candidateSkills.includes(s.toLowerCase()));

    const skillScore = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 70 : 50;
    
    let locationBonus = 0;
    if (candidate.location && job.location && (candidate.location.toLowerCase().includes(job.location.toLowerCase()) || job.location.toLowerCase() === 'remote')) {
      locationBonus = 15;
    }

    const expYears = candidate.parsedData?.yearsOfExperience || 3;
    let expBonus = 15;
    if (job.experienceLevel === 'Senior' && expYears < 5) expBonus = 5;

    const totalScore = Math.min(98, Math.max(25, Math.round(skillScore + locationBonus + expBonus)));

    return {
      matchScore: totalScore,
      rationale: `Matched ${matched.length} out of ${job.requiredSkills.length} required skills (${matched.join(', ') || 'None'}).`,
      matchedSkills: matched,
      missingSkills: missing,
      experienceFit: totalScore >= 75 ? 'Strong Fit' : totalScore >= 55 ? 'Moderate Fit' : 'Needs Upskilling',
      recommendation: missing.length > 0 ? `Recommend training or certification in ${missing.slice(0, 2).join(' & ')} to align with job needs.` : undefined,
    };
  }

  /**
   * Generate executive AI hiring insight summaries from ATS pipeline analytics.
   */
  public static async generateHiringInsights(metricsData: any): Promise<{
    summary: string;
    insights: string[];
    bottleneckAnalysis: string;
    recommendations: string[];
  }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        summary: `ATS Pipeline contains ${metricsData.totalApplications || 0} applications across ${metricsData.jobConversionRates?.length || 0} active job postings. Overall conversion rate is ${metricsData.overallConversionRate || 0}%.`,
        insights: [
          `Overall candidate conversion rate stands at ${metricsData.overallConversionRate || 0}%.`,
          metricsData.bottleneckStage ? `${metricsData.bottleneckStage} stage represents the primary bottleneck averaging ${metricsData.stageDurations?.[metricsData.bottleneckStage] || 0} days.` : 'Pipeline progression is active across all stages.',
          `Total hires completed across all positions: ${metricsData.totalHired || 0}.`,
        ],
        bottleneckAnalysis: metricsData.bottleneckStage
          ? `Candidates spend the longest time in the "${metricsData.bottleneckStage}" stage (average ${metricsData.stageDurations?.[metricsData.bottleneckStage] || 0} days). Consider streamlining interview scheduling or assessment reviews.`
          : 'No single critical bottleneck identified in current pipeline velocity.',
        recommendations: [
          'Set automated reminders for recruiters when candidates remain in Screening > 4 days.',
          'Leverage AI Match Scoring to prioritize top 20% matched candidates early in pipeline.',
        ],
      };
    }

    const ai = getAiClient();

    const promptText = `
You are an Executive Recruitment Intelligence Advisor for TalentFlow AI ATS.
Analyze the provided recruitment pipeline analytics metrics and produce a sharp, executive-level hiring insight summary.

Metrics Data:
${JSON.stringify(metricsData, null, 2)}

Instructions:
1. Write a 1-2 sentence executive summary of hiring performance.
2. Provide 3 specific, data-backed bullet points highlighting conversion rates, stage velocity, and team performance.
3. Detail a clear bottleneck analysis mentioning the specific stage that takes the longest and why.
4. Provide 2 actionable recommendations for the recruiting team to improve speed-to-hire and conversion rates.
`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        insights: { type: Type.ARRAY, items: { type: Type.STRING } },
        bottleneckAnalysis: { type: Type.STRING },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['summary', 'insights', 'bottleneckAnalysis', 'recommendations'],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: {
          systemInstruction: 'You are an executive talent analytics strategist.',
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(text.trim());
      return {
        summary: parsed.summary || 'Pipeline performance overview calculated.',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        bottleneckAnalysis: parsed.bottleneckAnalysis || 'Stage durations analyzed.',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch (err: any) {
      console.warn('Gemini hiring insights error, fallback used:', err.message);
      return {
        summary: `Pipeline tracking ${metricsData.totalApplications || 0} total candidate applications with ${metricsData.overallConversionRate || 0}% overall conversion rate.`,
        insights: [
          `Overall hiring conversion rate: ${metricsData.overallConversionRate || 0}%.`,
          `Primary pipeline delay: ${metricsData.bottleneckStage || 'Screening'} stage.`,
        ],
        bottleneckAnalysis: `Average duration in ${metricsData.bottleneckStage || 'Screening'} stage is ${metricsData.stageDurations?.[metricsData.bottleneckStage] || 3} days.`,
        recommendations: [
          'Accelerate initial screening response times to reduce candidate drop-off.',
        ],
      };
    }
  }
}
