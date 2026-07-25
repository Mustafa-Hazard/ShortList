import { Test, TestingModule } from '@nestjs/testing';
import { CvScorerService } from './cv-scorer.service';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { AiProxyUnavailableError } from '../ai-proxy/ai-proxy.errors';
import { JobType } from '../common/enums/job.enum';

describe('CvScorerService', () => {
  let service: CvScorerService;
  let aiProxyService: jest.Mocked<any>;

  const mockInput = {
    jobPosting: {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      type: JobType.FULL_TIME,
      requiredSkills: ['Node.js', 'PostgreSQL', 'NestJS'],
      responsibilities: 'Build backend microservices',
      description: 'Senior engineer role to scale platform',
    },
    cvText: 'Experienced Node.js & NestJS engineer with 5 years in Postgres.',
    coverLetter: 'I am excited about this role.',
    yearsOfExperience: 5,
    salaryExpectation: 120000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvScorerService,
        {
          provide: AiProxyService,
          useValue: { generateContent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CvScorerService>(CvScorerService);
    aiProxyService = module.get(AiProxyService);
  });

  it('parses valid JSON response and populates all AI fields', async () => {
    const aiOutputJson = JSON.stringify({
      aiScore: 85,
      aiExtraction: {
        name: 'Jane Doe',
        yearsOfExperience: 5,
        topSkills: ['Node.js', 'NestJS', 'PostgreSQL'],
        educationLevel: "Bachelor's in Computer Science",
        lastRole: 'Backend Developer',
      },
      aiStrengths: ['Strong match for NestJS and Node.js', '5 years backend experience'],
      aiGaps: ['No explicit experience with Kubernetes'],
    });

    aiProxyService.generateContent.mockResolvedValue(aiOutputJson);

    const result = await service.score(mockInput);

    expect(result.aiScore).toBe(85);
    expect(result.aiExtraction.name).toBe('Jane Doe');
    expect(result.aiExtraction.topSkills).toEqual(['Node.js', 'NestJS', 'PostgreSQL']);
    expect(result.aiStrengths).toHaveLength(2);
    expect(result.aiGaps).toHaveLength(1);

    const [promptArg, optionsArg] = aiProxyService.generateContent.mock.calls[0];
    expect(promptArg).toContain('Senior Backend Engineer');
    expect(promptArg).toContain('Node.js, PostgreSQL, NestJS');
    expect(promptArg).toContain('5 years in Postgres');
    expect(optionsArg).toEqual({ temperature: 0.2 });
  });

  it('strips markdown code fences if present in AI response', async () => {
    const aiOutput = `\`\`\`json
{
  "aiScore": 90,
  "aiExtraction": { "name": "John Smith" },
  "aiStrengths": ["Great skills"],
  "aiGaps": []
}
\`\`\``;

    aiProxyService.generateContent.mockResolvedValue(aiOutput);

    const result = await service.score(mockInput);

    expect(result.aiScore).toBe(90);
    expect(result.aiExtraction.name).toBe('John Smith');
    expect(result.aiStrengths).toEqual(['Great skills']);
  });

  it('falls back gracefully to default response when JSON parsing fails', async () => {
    aiProxyService.generateContent.mockResolvedValue('Not a valid JSON string');

    const result = await service.score(mockInput);

    expect(result.aiScore).toBe(50);
    expect(result.aiExtraction).toEqual({});
    expect(result.aiStrengths).toEqual(['Application received']);
    expect(result.aiGaps).toEqual(['AI evaluation parsing failed']);
  });

  it('propagates errors from AiProxyService without swallowing them', async () => {
    aiProxyService.generateContent.mockRejectedValue(
      new AiProxyUnavailableError(),
    );

    await expect(service.score(mockInput)).rejects.toThrow(
      AiProxyUnavailableError,
    );
  });
});
