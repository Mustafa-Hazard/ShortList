import { Injectable } from '@nestjs/common';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';

export interface OfferDrafterInput {
  candidateName: string;
  roleTitle: string;
  salary: number;
  startDate: string;
  benefitsSummary: string;
  companyName?: string;
}

// Owns the Offer Letter Drafter prompt template for AI Feature 4 (bonus).
//
// Prompt iteration log (for the AI integration report deliverable):
//   v1: Basic prompt "Write an offer letter for {roleTitle}". Returned generic
//       template full of bracketed placeholders like "[Candidate Name]" and "[Date]".
//   v2 (current): Personalised formal offer letter prompt passing candidate name,
//       exact salary, start date, and benefits summary with explicit "no placeholder tags"
//       and a professional, welcoming tone suitable for direct recruiter review and issuance.
@Injectable()
export class OfferDrafterService {
  constructor(private aiProxyService: AiProxyService) {}

  async generateDraft(input: OfferDrafterInput): Promise<string> {
    const prompt = this.buildPrompt(input);
    const text = await this.aiProxyService.generateContent(prompt, {
      temperature: 0.4,
    });
    return text.trim();
  }

  private buildPrompt(input: OfferDrafterInput): string {
    const formattedSalary = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(input.salary);

    const company = input.companyName ?? 'our company';

    return `Write a formal, welcoming job offer letter body for the following candidate offer. Return only the offer letter body text — no subject line, no placeholder tags like "[Company Name]", no markdown fences.

Candidate Name: ${input.candidateName}
Role Title: ${input.roleTitle}
Company: ${company}
Annual Compensation: ${formattedSalary}
Anticipated Start Date: ${input.startDate}
Benefits Summary: ${input.benefitsSummary}

Write 3 to 4 paragraphs:
1. Warm congratulations and official offer for the role at ${company}.
2. Details on compensation (${formattedSalary}/year), starting on ${input.startDate}, and key benefits (${input.benefitsSummary}).
3. Expressions of excitement about the candidate joining the team and expectations for next steps.
4. Formal closing sign-off.`;
  }
}
