import { Injectable, Logger } from '@nestjs/common';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { JobPosting } from '../jobs/job-posting.entity';

export interface CvScorerInput {
  jobPosting: Partial<JobPosting>;
  cvText?: string | null;
  coverLetter?: string | null;
  yearsOfExperience?: number | null;
  salaryExpectation?: number | null;
}

export interface CvScorerResult {
  aiScore: number;
  aiExtraction: {
    name?: string;
    yearsOfExperience?: number;
    topSkills?: string[];
    educationLevel?: string;
    lastRole?: string;
  };
  aiStrengths: string[];
  aiGaps: string[];
}

// Owns the CV Scorer prompt template and output parser for AI Feature 2.
//
// Prompt iteration log (for the AI integration report deliverable):
//   v1: Freeform evaluation text asking Gemini "is this candidate a good fit?".
//       Resulted in unstructured paragraphs hard to store or sort by.
//   v2 (current): Rigid JSON output schema requiring a 0-100 numerical score,
//       candidate key field extraction, explicit lists of strengths and gaps
//       relative to the specific job posting requirements, plus markdown code block
//       stripping during parsing.
@Injectable()
export class CvScorerService {
  private readonly logger = new Logger(CvScorerService.name);

  constructor(private aiProxyService: AiProxyService) {}

  async score(input: CvScorerInput): Promise<CvScorerResult> {
    const prompt = this.buildPrompt(input);
    const rawText = await this.aiProxyService.generateContent(prompt, {
      temperature: 0.2,
    });
    return this.parseResponse(rawText);
  }

  private buildPrompt(input: CvScorerInput): string {
    const job = input.jobPosting;
    const requiredSkillsStr = job.requiredSkills
      ? job.requiredSkills.join(', ')
      : 'None specified';
    const cvTextStr =
      input.cvText && input.cvText.trim().length > 0
        ? input.cvText
        : 'No CV text provided';
    const coverLetterStr =
      input.coverLetter && input.coverLetter.trim().length > 0
        ? input.coverLetter
        : 'No cover letter provided';

    return `You are an expert technical recruiter. Evaluate the following candidate application against the job posting requirements and output a JSON object only.

JOB POSTING:
Title: ${job.title ?? 'N/A'}
Department: ${job.department ?? 'N/A'}
Required Skills: ${requiredSkillsStr}
Core Responsibilities: ${job.responsibilities ?? 'N/A'}
Description: ${job.description ?? 'N/A'}

CANDIDATE APPLICATION DATA:
Years of Experience: ${input.yearsOfExperience ?? 'Not specified'}
Salary Expectation: ${input.salaryExpectation ?? 'Not specified'}
Cover Letter: ${coverLetterStr}
CV Extracted Text: ${cvTextStr}

INSTRUCTIONS:
Provide an objective evaluation as a single JSON object with no surrounding formatting or markdown fences. The JSON object MUST follow this schema strictly:
{
  "aiScore": <integer between 0 and 100 indicating match fit>,
  "aiExtraction": {
    "name": <string or null if unknown>,
    "yearsOfExperience": <number or null if unknown>,
    "topSkills": [<array of top skills found in CV/application>],
    "educationLevel": <string or null if unknown>,
    "lastRole": <string or null if unknown>
  },
  "aiStrengths": [<array of key candidate strengths relevant to this job>],
  "aiGaps": [<array of missing requirements, skill gaps, or potential concerns>]
}`;
  }

  private parseResponse(rawText: string): CvScorerResult {
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    try {
      const parsed = JSON.parse(cleanText);
      const score =
        typeof parsed.aiScore === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.aiScore)))
          : 50;

      const extraction = parsed.aiExtraction || {};
      const aiExtraction = {
        name: typeof extraction.name === 'string' ? extraction.name : undefined,
        yearsOfExperience:
          typeof extraction.yearsOfExperience === 'number'
            ? extraction.yearsOfExperience
            : undefined,
        topSkills: Array.isArray(extraction.topSkills)
          ? extraction.topSkills.map(String)
          : [],
        educationLevel:
          typeof extraction.educationLevel === 'string'
            ? extraction.educationLevel
            : undefined,
        lastRole:
          typeof extraction.lastRole === 'string'
            ? extraction.lastRole
            : undefined,
      };

      const aiStrengths = Array.isArray(parsed.aiStrengths)
        ? parsed.aiStrengths.map(String)
        : [];
      const aiGaps = Array.isArray(parsed.aiGaps)
        ? parsed.aiGaps.map(String)
        : [];

      return {
        aiScore: score,
        aiExtraction,
        aiStrengths,
        aiGaps,
      };
    } catch {
      this.logger.warn(`Failed to parse AI CV Scorer response: ${cleanText}`);
      return {
        aiScore: 50,
        aiExtraction: {},
        aiStrengths: ['Application received'],
        aiGaps: ['AI evaluation parsing failed'],
      };
    }
  }
}
