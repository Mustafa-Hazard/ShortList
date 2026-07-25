import { Test, TestingModule } from '@nestjs/testing';
import { JdGeneratorService } from './jd-generator.service';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { AiProxyUnavailableError } from '../ai-proxy/ai-proxy.errors';
import { JobType } from '../common/enums/job.enum';

describe('JdGeneratorService', () => {
  let service: JdGeneratorService;
  let aiProxyService: any;

  const mockInput = {
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    type: JobType.FULL_TIME,
    salaryMin: 90000,
    salaryMax: 130000,
    requiredSkills: ['Node.js', 'PostgreSQL', 'NestJS'],
    responsibilities: 'Build and maintain backend services',
    cultureNotes: 'Fast-paced, collaborative team',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JdGeneratorService,
        {
          provide: AiProxyService,
          useValue: { generateContent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<JdGeneratorService>(JdGeneratorService);
    aiProxyService = module.get(AiProxyService);
  });

  it('builds a prompt including all structured fields and returns trimmed text', async () => {
    aiProxyService.generateContent.mockResolvedValue(
      '  Generated JD body text.  ',
    );

    const result = await service.generateDescription(mockInput);

    expect(result).toBe('Generated JD body text.');
    const [promptArg, optionsArg] =
      aiProxyService.generateContent.mock.calls[0];
    expect(promptArg).toContain('Senior Backend Engineer');
    expect(promptArg).toContain('Engineering');
    expect(promptArg).toContain('Node.js, PostgreSQL, NestJS');
    expect(promptArg).toContain('Build and maintain backend services');
    expect(promptArg).toContain('Fast-paced, collaborative team');
    expect(optionsArg).toEqual({ temperature: 0.6 });
  });

  it('omits salary line language when salary is not specified', async () => {
    aiProxyService.generateContent.mockResolvedValue('JD text');

    await service.generateDescription({
      ...mockInput,
      salaryMin: null,
      salaryMax: null,
    });

    const [promptArg] = aiProxyService.generateContent.mock.calls[0];
    expect(promptArg).toContain('not specified');
  });

  it('propagates errors from AiProxyService without swallowing them', async () => {
    aiProxyService.generateContent.mockRejectedValue(
      new AiProxyUnavailableError(),
    );

    await expect(service.generateDescription(mockInput)).rejects.toThrow(
      AiProxyUnavailableError,
    );
  });
});
