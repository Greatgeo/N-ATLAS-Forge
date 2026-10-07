import {
  GenerateRequest,
  GenerateResponse,
  NAtlasHealth,
  ModelInfo,
  SupportedLanguage,
} from '../shared/types.ts';

export interface NAtlasClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class NAtlasClientError extends Error {
  readonly statusCode?: number;
  readonly code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'NAtlasClientError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NAtlas {
  private baseUrl: string;
  private apiKey?: string;
  private timeoutMs: number;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(options: NAtlasClientOptions = {}) {
    this.baseUrl = (options.baseUrl || '').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 60000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
  }

  /**
   * Health and runtime status check
   */
  async health(): Promise<NAtlasHealth> {
    const res = await this.request<NAtlasHealth>('/api/natlas/health', 'GET');
    return res;
  }

  /**
   * Model specification information
   */
  async getModelInfo(): Promise<ModelInfo> {
    const res = await this.request<ModelInfo>('/api/natlas/model', 'GET');
    return res;
  }

  /**
   * Generate text completion using official N-ATLaS model
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!request.messages || request.messages.length === 0) {
      throw new NAtlasClientError('Messages array cannot be empty', 400, 'INVALID_REQUEST');
    }

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const res = await this.request<GenerateResponse>('/api/natlas/generate', 'POST', request);
        return res;
      } catch (err: unknown) {
        attempt++;
        if (attempt > this.maxRetries || !this.isRetryable(err)) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt));
      }
    }

    throw new NAtlasClientError('Max retry limit exceeded');
  }

  /**
   * Helper method for single-turn prompt generation
   */
  async prompt(text: string, language: SupportedLanguage = 'en'): Promise<string> {
    const response = await this.generate({
      messages: [{ role: 'user', content: text }],
      language,
    });
    return response.text;
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof NAtlasClientError) {
      return err.statusCode === 429 || (err.statusCode !== undefined && err.statusCode >= 500);
    }
    return false;
  }

  private async request<T>(endpoint: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        let errMessage = `HTTP ${res.status} ${res.statusText}`;
        let errCode = 'API_ERROR';
        try {
          const errJson = await res.json();
          if (errJson.error) errMessage = errJson.error;
          if (errJson.code) errCode = errJson.code;
        } catch {
          // ignore json parse error
        }
        throw new NAtlasClientError(errMessage, res.status, errCode);
      }

      const json = await res.json();
      return json as T;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof NAtlasClientError) throw err;
      if ((err as Error)?.name === 'AbortError') {
        throw new NAtlasClientError(`Request timed out after ${this.timeoutMs}ms`, 504, 'TIMEOUT');
      }
      throw new NAtlasClientError((err as Error)?.message || 'Network request failed', 500, 'NETWORK_ERROR');
    }
  }
}

export default NAtlas;
