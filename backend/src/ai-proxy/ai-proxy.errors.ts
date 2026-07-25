export class AiProxyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiProxyError';
  }
}

export class AiProxyRateLimitError extends AiProxyError {
  constructor(message = 'Gemini API rate limit exceeded') {
    super(message);
    this.name = 'AiProxyRateLimitError';
  }
}

export class AiProxyUnavailableError extends AiProxyError {
  constructor(message = 'Gemini API is currently unavailable') {
    super(message);
    this.name = 'AiProxyUnavailableError';
  }
}
