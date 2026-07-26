import { Test, TestingModule } from '@nestjs/testing';
import { OfferDrafterService } from './offer-drafter.service';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';
import { AiProxyUnavailableError } from '../ai-proxy/ai-proxy.errors';

describe('OfferDrafterService', () => {
  let service: OfferDrafterService;
  let aiProxyService: jest.Mocked<any>;

  const mockInput = {
    candidateName: 'Jane Candidate',
    roleTitle: 'Senior Backend Engineer',
    salary: 130000,
    startDate: '2026-09-01',
    benefitsSummary: 'Health, Dental, 401(k) matching, Unlimited PTO',
    companyName: 'Acme Corp',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferDrafterService,
        {
          provide: AiProxyService,
          useValue: { generateContent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OfferDrafterService>(OfferDrafterService);
    aiProxyService = module.get(AiProxyService);
  });

  it('builds prompt with offer details and returns trimmed drafted letter text', async () => {
    aiProxyService.generateContent.mockResolvedValue(
      '  Dear Jane Candidate, We are thrilled to offer you the role of Senior Backend Engineer at Acme Corp...  ',
    );

    const result = await service.generateDraft(mockInput);

    expect(result).toBe(
      'Dear Jane Candidate, We are thrilled to offer you the role of Senior Backend Engineer at Acme Corp...',
    );

    const [promptArg, optionsArg] =
      aiProxyService.generateContent.mock.calls[0];
    expect(promptArg).toContain('Jane Candidate');
    expect(promptArg).toContain('Senior Backend Engineer');
    expect(promptArg).toContain('$130,000');
    expect(promptArg).toContain('2026-09-01');
    expect(promptArg).toContain('Acme Corp');
    expect(optionsArg).toEqual({ temperature: 0.4 });
  });

  it('propagates errors from AiProxyService without swallowing them', async () => {
    aiProxyService.generateContent.mockRejectedValue(
      new AiProxyUnavailableError(),
    );

    await expect(service.generateDraft(mockInput)).rejects.toThrow(
      AiProxyUnavailableError,
    );
  });
});
