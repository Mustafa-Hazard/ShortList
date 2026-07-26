import { Test, TestingModule } from '@nestjs/testing';
import { QuestionSuggesterService } from './question-suggester.service';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { AiProxyUnavailableError } from '../ai-proxy/ai-proxy.errors';
import { InterviewType } from '../common/enums/interview.enum';
import { JobType } from '../common/enums/job.enum';

describe('QuestionSuggesterService', () => {
  let service: QuestionSuggesterService;
  let aiProxyService: jest.Mocked<any>;

  const mockInput = {
    jobPosting: {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      type: JobType.FULL_TIME,
      requiredSkills: ['Node.js', 'PostgreSQL', 'NestJS'],
      responsibilities: 'Build scaling services',
      description: 'Senior backend engineer role',
    },
    cvText: '5 years experience in Node.js and PostgreSQL',
    aiStrengths: ['Strong Node.js experience'],
    aiGaps: ['No explicit NestJS experience mentioned'],
    type: InterviewType.TECHNICAL,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionSuggesterService,
        {
          provide: AiProxyService,
          useValue: { generateContent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<QuestionSuggesterService>(QuestionSuggesterService);
    aiProxyService = module.get(AiProxyService);
  });

  it('parses valid JSON array response into SuggestedQuestion objects', async () => {
    const aiOutputJson = JSON.stringify([
      {
        question:
          'How have you used NestJS dependency injection in past projects?',
        listenFor: 'Understanding of providers, modules, and scope management.',
      },
      {
        question: 'Explain how you optimize complex SQL queries in PostgreSQL.',
        listenFor:
          'Index usage, EXPLAIN ANALYZE understanding, and query structure.',
      },
    ]);

    aiProxyService.generateContent.mockResolvedValue(aiOutputJson);

    const result = await service.generateQuestions(mockInput);

    expect(result).toHaveLength(2);
    expect(result[0].question).toContain('NestJS dependency injection');
    expect(result[0].listenFor).toContain('providers, modules');

    const [promptArg, optionsArg] =
      aiProxyService.generateContent.mock.calls[0];
    expect(promptArg).toContain('TECHNICAL');
    expect(promptArg).toContain('Senior Backend Engineer');
    expect(promptArg).toContain('No explicit NestJS experience mentioned');
    expect(optionsArg).toEqual({ temperature: 0.3 });
  });

  it('strips markdown code fences when parsing response', async () => {
    const aiOutput = `\`\`\`json
[
  {
    "question": "Tell me about your behavioural experience handling tech debt.",
    "listenFor": "Pragmatic balance between velocity and quality."
  }
]
\`\`\``;

    aiProxyService.generateContent.mockResolvedValue(aiOutput);

    const result = await service.generateQuestions({
      ...mockInput,
      type: InterviewType.BEHAVIOURAL,
    });

    expect(result).toHaveLength(1);
    expect(result[0].question).toContain('handling tech debt');
  });

  it('falls back gracefully to default questions when parsing fails', async () => {
    aiProxyService.generateContent.mockResolvedValue('Invalid non-json output');

    const result = await service.generateQuestions(mockInput);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].question).toBeDefined();
    expect(result[0].listenFor).toBeDefined();
  });

  it('propagates errors from AiProxyService without swallowing them', async () => {
    aiProxyService.generateContent.mockRejectedValue(
      new AiProxyUnavailableError(),
    );

    await expect(service.generateQuestions(mockInput)).rejects.toThrow(
      AiProxyUnavailableError,
    );
  });
});
