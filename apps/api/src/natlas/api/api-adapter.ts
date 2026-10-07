import { NAtlasAdapter } from '../adapter.ts';
import {
  GenerateRequest,
  GenerateResponse,
  NAtlasHealth,
  ModelInfo,
} from '../../../../../packages/shared/types.ts';
import { NAtlasConfig } from '../config.ts';
import { NAtlasConfigurationError, NAtlasAuthenticationError, NAtlasConnectionError, NAtlasTimeoutError } from '../errors.ts';

export class NAtlasApiAdapter implements NAtlasAdapter {
  private config: NAtlasConfig;

  constructor(config: NAtlasConfig) {
    this.config = config;
  }

  async health(): Promise<NAtlasHealth> {
    if (!this.config.apiUrl) {
      return {
        status: 'not_connected',
        mode: 'api',
        modelId: this.config.modelId,
        timestamp: new Date().toISOString(),
        details: {
          runtimeType: 'Official Remote Inference Endpoint (HTTP/REST)',
          endpointConfigured: false,
          localRuntimeAvailable: false,
          message: 'NATLAS_API_URL is not set. An official endpoint URL must be provided.',
        },
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(this.config.timeoutMs, 5000));

      const res = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timer);

      return {
        status: res.ok ? 'connected' : 'degraded',
        mode: 'api',
        modelId: this.config.modelId,
        timestamp: new Date().toISOString(),
        details: {
          runtimeType: 'Official Remote Inference Endpoint (HTTP/REST)',
          endpointConfigured: true,
          localRuntimeAvailable: false,
          lastPingMs: Date.now() - start,
          message: res.ok ? 'Remote N-ATLaS endpoint reachable' : `Endpoint returned HTTP ${res.status}`,
        },
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        status: 'not_connected',
        mode: 'api',
        modelId: this.config.modelId,
        timestamp: new Date().toISOString(),
        details: {
          runtimeType: 'Official Remote Inference Endpoint (HTTP/REST)',
          endpointConfigured: true,
          localRuntimeAvailable: false,
          lastPingMs: Date.now() - start,
          message: `Connection failed: ${errMsg}`,
        },
      };
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.config.apiUrl) {
      throw new NAtlasConfigurationError(
        'NATLAS_API_URL is missing. Per Rule 1 (Do Not Invent N-ATLaS APIs), Forge does not fabricate fake endpoints. Please set NATLAS_API_URL and NATLAS_API_KEY in your environment.'
      );
    }

    if (!this.config.apiKey) {
      throw new NAtlasAuthenticationError(
        'NATLAS_API_KEY is missing. An authentication key is required for the configured remote N-ATLaS endpoint.'
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const start = Date.now();

    try {
      const res = await fetch(`${this.config.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.modelId,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 512,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new NAtlasAuthenticationError(`Endpoint rejected credentials (HTTP ${res.status})`);
        }
        const errorText = await res.text();
        throw new NAtlasConnectionError(`Remote endpoint error (HTTP ${res.status}): ${errorText}`);
      }

      const json = await res.json();
      const generatedText = json.choices?.[0]?.message?.content || json.text || '';

      return {
        text: generatedText,
        model: this.config.modelId,
        mode: 'api',
        latencyMs,
        isMock: false,
        usage: json.usage
          ? {
              inputTokens: json.usage.prompt_tokens,
              outputTokens: json.usage.completion_tokens,
              totalTokens: json.usage.total_tokens,
            }
          : undefined,
        finishReason: json.choices?.[0]?.finish_reason || 'stop',
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof NAtlasConfigurationError || err instanceof NAtlasAuthenticationError || err instanceof NAtlasConnectionError) {
        throw err;
      }
      const isAbort = (err as Error)?.name === 'AbortError';
      if (isAbort) {
        throw new NAtlasTimeoutError(`Remote N-ATLaS API request timed out after ${this.config.timeoutMs}ms.`);
      }
      throw new NAtlasConnectionError(`Failed to reach N-ATLaS endpoint at ${this.config.apiUrl}: ${(err as Error).message}`);
    }
  }

  async getModelInfo(): Promise<ModelInfo> {
    return {
      id: this.config.modelId,
      name: 'N-ATLaS (Official Remote Endpoint)',
      organization: 'NCAIR (National Centre for AI and Robotics)',
      baseArchitecture: 'Llama-3-8B-Instruct Base',
      parameters: '8B Parameters',
      languages: ['English', 'Yoruba', 'Hausa', 'Igbo', 'Nigerian Pidgin'],
      contextLength: 8192,
      repositoryUrl: 'https://huggingface.co/NCAIR1/N-ATLaS',
      license: 'Llama 3 Community License / Sovereign AI Initiative',
      challengeTrack: 'NAIC 2026 — PS1: Developer Infrastructure',
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }
}
