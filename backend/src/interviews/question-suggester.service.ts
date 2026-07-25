import { Injectable, Logger } from '@nestjs/common';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { JobPosting } from '../jobs/job-posting.entity';
import { InterviewType } from '../common/enums/interview.enum';

export interface SuggestedQuestion {
  question: string;
  listenFor: string;
}

export interface QuestionSuggesterInput {
  jobPosting: Partial<JobPosting>;
  cvText?: string | null;
  coverLetter?: string | null;
  aiStrengths?: string[] | null;
  aiGaps?: string[] | null;
  type: InterviewType;
}

// Owns the Interview Question Suggester prompt template and output parser for AI Feature 3.
//
// Prompt iteration log (for the AI integration report deliverable):
//   v1: Freeform text prompt asking "give me interview questions". Produced
//       generic questions ("tell me about yourself") ignoring job required skills
//       and candidate gaps.
//   v2 (current): JSON array output format requiring 4-6 specific questions aligned
//       with the interview type (technical, behavioural, final), explicitly probing
//       identified candidate gaps (aiGaps) and required skills, paired with concrete
//       "listenFor" evaluation signals for the interviewer.
@Injectable()
export class QuestionSuggesterService {
  private readonly logger = new Logger(QuestionSuggesterService.name);

  constructor(private aiProxyService: AiProxyService) {}

  async generateQuestions(
    input: QuestionSuggesterInput,
  ): Promise<SuggestedQuestion[]> {
    const prompt = this.buildPrompt(input);
    const rawText = await this.aiProxyService.generateContent(prompt, {
      temperature: 0.3,
    });
    return this.parseResponse(rawText);
  }

  private buildPrompt(input: QuestionSuggesterInput): string {
    const job = input.jobPosting;
    const requiredSkillsStr = job.requiredSkills
      ? job.requiredSkills.join(', ')
      : 'None specified';
    const cvTextStr =
      input.cvText && input.cvText.trim().length > 0
        ? input.cvText
        : 'No CV text provided';
    const strengthsStr =
      input.aiStrengths && input.aiStrengths.length > 0
        ? input.aiStrengths.join('; ')
        : 'None noted';
    const gapsStr =
      input.aiGaps && input.aiGaps.length > 0
        ? input.aiGaps.join('; ')
        : 'None noted';

    return `You are an expert hiring manager and interviewer. Generate 4 to 6 tailored interview questions for a ${input.type.toUpperCase()} interview.

JOB POSTING:
Role Title: ${job.title ?? 'N/A'}
Department: ${job.department ?? 'N/A'}
Required Skills: ${requiredSkillsStr}
Core Responsibilities: ${job.responsibilities ?? 'N/A'}
Description: ${job.description ?? 'N/A'}

CANDIDATE BACKSTAGE & AI EVALUATION:
Identified Strengths: ${strengthsStr}
Identified Gaps/Concerns: ${gapsStr}
CV Extracted Text: ${cvTextStr}

INSTRUCTIONS:
Output ONLY a single JSON array of objects with no surrounding markdown formatting or code fences. Each object in the array MUST strictly follow this schema:
[
  {
    "question": "<The targeted interview question>",
    "listenFor": "<Key signals, skills, or specific points the interviewer should listen for in a top candidate response>"
  }
]

Ensure at least 2 questions directly probe the candidate's identified gaps/concerns or required skills missing from their CV.`;
  }

  private parseResponse(rawText: string): SuggestedQuestion[] {
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    try {
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item) =>
              item &&
              typeof item.question === 'string' &&
              typeof item.listenFor === 'string',
          )
          .map((item) => ({
            question: item.question.trim(),
            listenFor: item.listenFor.trim(),
          }));
      }
    } catch (err) {
      this.logger.warn(
        `Failed to parse AI Question Suggester response: ${cleanText}`,
      );
    }

    // Graceful fallback questions if parsing fails or returns invalid structure
    return [
      {
        question:
          'Walk me through a challenging technical problem you solved in your recent role.',
        listenFor:
          'Problem-solving methodology, technical depth, and clear communication of trade-offs.',
      },
      {
        question:
          'How do you approach learning and adopting new technologies required for a project?',
        listenFor:
          'Self-directed learning habits, speed of adaptation, and practical application.',
      },
    ];
  }
}
