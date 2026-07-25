import { Injectable, Logger } from '@nestjs/common';
import {
  AiProxyError,
  AiProxyRateLimitError,
  AiProxyUnavailableError,
} from './ai-proxy.errors';

export interface GenerateContentOptions {
  maxRetries?: number;
  timeoutMs?: number;
  temperature?: number;
  backoffBaseMs?: number;
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_BACKOFF_BASE_MS = 500;
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

// Proxy sits between the frontend and the Gemini API per spec §5.1: no
// direct frontend calls, no API keys outside this service. Every AI
// feature (JD Generator, CV Scorer, Question Suggester, Offer Drafter)
// calls generateContent() and owns its own prompt + response parsing.
@Injectable()
export class AiProxyService {
  private readonly logger = new Logger(AiProxyService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly model = process.env.GEMINI_MODEL || 'gemini-3-flash';
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models';

  async generateContent(
    prompt: string,
    options: GenerateContentOptions = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new AiProxyError('GEMINI_API_KEY is not configured');
    }

    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const backoffBaseMs = options.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.callGemini(prompt, options, timeoutMs);
      } catch (err) {
        lastError = err as Error;

        const isRetryable =
          err instanceof AiProxyRateLimitError ||
          err instanceof AiProxyUnavailableError;

        if (!isRetryable || attempt === maxRetries) {
          break;
        }

        const backoffMs = backoffBaseMs * Math.pow(2, attempt);
        this.logger.warn(
          `Gemini call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffMs}ms: ${lastError.message}`,
        );
        await this.sleep(backoffMs);
      }
    }

    throw lastError;
  }

  private async callGemini(
    prompt: string,
    options: GenerateContentOptions,
    timeoutMs: number,
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: any;
    try {
      response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: options.temperature ?? 0.7,
            },
          }),
          signal: controller.signal,
        },
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new AiProxyUnavailableError('Gemini API request timed out');
      }
      throw new AiProxyUnavailableError(
        `Gemini API request failed: ${(err as Error).message}`,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new AiProxyRateLimitError();
      }
      if (RETRYABLE_STATUSES.includes(response.status)) {
        throw new AiProxyUnavailableError(
          `Gemini API returned ${response.status}`,
        );
      }
      const body = await response.text().catch(() => '');
      throw new AiProxyError(
        `Gemini API request failed (${response.status}): ${body}`,
      );
    }

    const data = await response.json();

    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new AiProxyError(`Gemini blocked the prompt: ${blockReason}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AiProxyError('Gemini returned no usable content');
    }

    return text;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
