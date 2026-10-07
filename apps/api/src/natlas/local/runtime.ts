import http from 'http';
import { NAtlasConnectionError, NAtlasTimeoutError, NAtlasModelError } from '../errors.ts';

export interface LocalRuntimeStatus {
  available: boolean;
  status: string;
  model?: string;
  device?: string;
  cudaAvailable?: boolean;
  memoryAllocatedMb?: number;
  error?: string;
  latencyMs?: number;
}

export class LocalRuntimeClient {
  private port: number;
  private host: string;
  private timeoutMs: number;

  constructor(port = 8008, host = '127.0.0.1', timeoutMs = 60000) {
    this.port = port;
    this.host = host;
    this.timeoutMs = timeoutMs;
  }

  async checkHealth(): Promise<LocalRuntimeStatus> {
    const start = Date.now();
    try {
      const data = await this.request<{
        status: string;
        model: string;
        device?: string;
        cuda_available?: boolean;
        memory_allocated_mb?: number;
        error?: string;
      }>('/health', 'GET', null, 5000);

      return {
        available: data.status === 'ready',
        status: data.status,
        model: data.model,
        device: data.device,
        cudaAvailable: data.cuda_available,
        memoryAllocatedMb: data.memory_allocated_mb,
        error: data.error,
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        available: false,
        status: 'unreachable',
        error: `Local N-ATLaS worker is not responding on port ${this.port}: ${errMsg}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  async generate(prompt: string, temperature = 0.7, maxTokens = 512): Promise<{
    text: string;
    model: string;
    latencyMs: number;
    usage?: { inputTokens: number; outputTokens: number };
  }> {
    const payload = JSON.stringify({ prompt, temperature, max_tokens: maxTokens });
    const response = await this.request<{
      text: string;
      model: string;
      latency_ms: number;
      usage?: { input_tokens: number; output_tokens: number };
      error?: string;
    }>('/generate', 'POST', payload, this.timeoutMs);

    if (response.error) {
      throw new NAtlasModelError(`Model runtime error: ${response.error}`);
    }

    return {
      text: response.text,
      model: response.model,
      latencyMs: response.latency_ms,
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          }
        : undefined,
    };
  }

  private request<T>(path: string, method: 'GET' | 'POST', body: string | null, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: this.host,
          port: this.port,
          path,
          method,
          headers: body
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
              }
            : undefined,
          timeout,
        },
        (res) => {
          let chunks = '';
          res.on('data', (d) => (chunks += d));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(chunks);
              if (res.statusCode && res.statusCode >= 400 && !parsed.error) {
                reject(new NAtlasConnectionError(`Local worker returned HTTP ${res.statusCode}: ${chunks}`));
              } else {
                resolve(parsed as T);
              }
            } catch {
              reject(new NAtlasConnectionError(`Invalid JSON from local worker: ${chunks.slice(0, 100)}`));
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new NAtlasTimeoutError(`Local worker timed out after ${timeout}ms`));
      });

      req.on('error', (err) => {
        reject(new NAtlasConnectionError(`Local worker connection failed: ${err.message}`));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }
}
