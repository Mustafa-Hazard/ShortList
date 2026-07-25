import { Injectable } from '@nestjs/common';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { JobType } from '../common/enums/job.enum';

export interface JdGeneratorInput {
  title: string;
  department: string;
  type: JobType;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
  responsibilities: string;
  cultureNotes: string | null;
}

// Owns the JD prompt template. AiProxyService only knows how to talk to
// Gemini generically; this service owns what to ask it for AI Feature 1.
//
// Prompt iteration log (for the AI integration report deliverable):
//   v1: plain "write a job description for {title}" — too generic, ignored
//       requiredSkills and produced boilerplate indistinguishable across
//       postings.
//   v2 (current): explicit structured sections + instruction to weave
//       requiredSkills and responsibilities into prose rather than just
//       restating them as bullet lists, plus an explicit
//       "no placeholder text" instruction after v1 occasionally returned
//       "[Company Name]"-style placeholders.
@Injectable()
export class JdGeneratorService {
  constructor(private aiProxyService: AiProxyService) {}

  async generateDescription(input: JdGeneratorInput): Promise<string> {
    const prompt = this.buildPrompt(input);
    const text = await this.aiProxyService.generateContent(prompt, {
      temperature: 0.6,
    });
    return text.trim();
  }

  private buildPrompt(input: JdGeneratorInput): string {
    const salaryLine =
      input.salaryMin != null && input.salaryMax != null
        ? `Salary range: ${input.salaryMin}-${input.salaryMax}.`
        : 'Salary range: not specified, omit any salary mention.';

    return `Write a professional, engaging job description for the following role. Return only the description body text — no title heading, no markdown, no placeholder text like "[Company Name]".

Role: ${input.title}
Department: ${input.department}
Employment type: ${input.type}
${salaryLine}
Required skills: ${input.requiredSkills.join(', ')}
Core responsibilities: ${input.responsibilities}
${input.cultureNotes ? `Culture notes: ${input.cultureNotes}` : ''}

Write 3-4 paragraphs: an engaging intro to the role, what the person will actually do day-to-day (weave in the responsibilities and skills naturally, don't just restate them as a list), and what makes this team/role appealing. Professional but not stiff corporate tone.`;
  }
}
