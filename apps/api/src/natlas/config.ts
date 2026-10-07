import { NAtlasMode } from '../../../../packages/shared/types.ts';

export interface NAtlasConfig {
  mode: NAtlasMode;
  modelId: string;
  apiUrl?: string;
  apiKey?: string;
  timeoutMs: number;
  localWorkerPort?: number;
  allowMock: boolean;
}

export function loadConfig(): NAtlasConfig {
  const modeRaw = (process.env.NATLAS_MODE || 'local').toLowerCase().trim();
  const mode: NAtlasMode = modeRaw === 'api' ? 'api' : modeRaw === 'mock' ? 'mock' : 'local';

  return {
    mode,
    modelId: process.env.NATLAS_MODEL_ID || 'NCAIR1/N-ATLaS',
    apiUrl: process.env.NATLAS_API_URL?.trim() || undefined,
    apiKey: process.env.NATLAS_API_KEY?.trim() || undefined,
    timeoutMs: parseInt(process.env.NATLAS_TIMEOUT_MS || '60000', 10),
    localWorkerPort: parseInt(process.env.NATLAS_LOCAL_PORT || '8008', 10),
    allowMock: process.env.ALLOW_MOCK === 'true' || process.env.NATLAS_MODE === 'mock',
  };
}

export function getSafeConfigView(config: NAtlasConfig) {
  return {
    mode: config.mode,
    modelId: config.modelId,
    apiUrlConfigured: Boolean(config.apiUrl),
    apiKeyConfigured: Boolean(config.apiKey),
    timeoutMs: config.timeoutMs,
    localWorkerPort: config.localWorkerPort,
  };
}
