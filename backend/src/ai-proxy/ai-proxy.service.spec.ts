import { Test, TestingModule } from '@nestjs/testing';
import { AiProxyService } from './ai-proxy.service';
import {
  AiProxyError,
  AiProxyRateLimitError,
  AiProxyUnavailableError,
} from './ai-proxy.errors';

function mockResponse(status: number, body: any) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe('AiProxyService', () => {
  let service: AiProxyService;
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3-flash',
    };
    global.fetch = jest.fn() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiProxyService],
    }).compile();

    service = module.get<AiProxyService>(AiProxyService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('returns extracted text on a successful call', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse(200, {
        candidates: [{ content: { parts: [{ text: 'Generated JD text' }] } }],
      }),
    );

    const result = await service.generateContent('Write a job description');
    expect(result).toBe('Generated JD text');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws AiProxyRateLimitError after exhausting retries on 429', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(429, {}));

    await expect(
      service.generateContent('prompt', {
        maxRetries: 1,
        timeoutMs: 1000,
        backoffBaseMs: 10,
      }),
    ).rejects.toThrow(AiProxyRateLimitError);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws AiProxyUnavailableError after exhausting retries on 503', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(503, {}));

    await expect(
      service.generateContent('prompt', { maxRetries: 0, timeoutMs: 1000 }),
    ).rejects.toThrow(AiProxyUnavailableError);
  });

  it('recovers if a retry succeeds after an initial rate limit', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse(429, {}))
      .mockResolvedValueOnce(
        mockResponse(200, {
          candidates: [{ content: { parts: [{ text: 'Recovered text' }] } }],
        }),
      );

    const result = await service.generateContent('prompt', {
      maxRetries: 1,
      timeoutMs: 1000,
      backoffBaseMs: 10,
    });
    expect(result).toBe('Recovered text');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws AiProxyError when Gemini blocks the prompt on safety grounds', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse(200, { promptFeedback: { blockReason: 'SAFETY' } }),
    );

    await expect(service.generateContent('prompt')).rejects.toThrow(
      AiProxyError,
    );
  });

  it('throws AiProxyError for a non-retryable 400 without retrying', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse(400, { error: 'bad request' }),
    );

    await expect(
      service.generateContent('prompt', { maxRetries: 3 }),
    ).rejects.toThrow(AiProxyError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws AiProxyError if the API key is missing, without calling fetch', async () => {
    process.env.GEMINI_API_KEY = '';
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiProxyService],
    }).compile();
    const unconfiguredService = module.get<AiProxyService>(AiProxyService);

    await expect(unconfiguredService.generateContent('prompt')).rejects.toThrow(
      AiProxyError,
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
