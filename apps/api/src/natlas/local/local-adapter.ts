import { NAtlasAdapter } from '../adapter.ts';
import {
  GenerateRequest,
  GenerateResponse,
  NAtlasHealth,
  ModelInfo,
} from '../../../../../packages/shared/types.ts';
import { NAtlasConfig } from '../config.ts';
import { LocalRuntimeClient } from './runtime.ts';
import { formatNAtlasPrompt, cleanNAtlasOutput } from './prompt-template.ts';
import { OFFICIAL_MODEL_METADATA } from './model-loader.ts';
import { NAtlasConnectionError } from '../errors.ts';

export class LocalNAtlasAdapter implements NAtlasAdapter {
  private client: LocalRuntimeClient;
  private config: NAtlasConfig;

  constructor(config: NAtlasConfig) {
    this.config = config;
    this.client = new LocalRuntimeClient(config.localWorkerPort || 8008, '127.0.0.1', config.timeoutMs);
  }

  async health(): Promise<NAtlasHealth> {
    const runtimeStatus = await this.client.checkHealth();

    return {
      status: runtimeStatus.available ? 'connected' : 'not_connected',
      mode: 'local',
      modelId: OFFICIAL_MODEL_METADATA.modelId,
      timestamp: new Date().toISOString(),
      details: {
        runtimeType: 'Local PyTorch / Transformers (AutoModelForCausalLM)',
        endpointConfigured: false,
        localRuntimeAvailable: runtimeStatus.available,
        memoryAllocatedMb: runtimeStatus.memoryAllocatedMb,
        lastPingMs: runtimeStatus.latencyMs,
        message: runtimeStatus.available
          ? `Local worker loaded on ${runtimeStatus.device || 'CUDA/CPU'}`
          : runtimeStatus.error || 'Local PyTorch inference daemon not detected on port ' + (this.config.localWorkerPort || 8008),
      },
    };
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const health = await this.client.checkHealth();
    if (!health.available) {
      throw new NAtlasConnectionError(
        `Local N-ATLaS runtime is not ready: ${health.error || 'Worker offline'}. ` +
        `Start the local worker using 'python scripts/run_natlas_worker.py' with NCAIR1/N-ATLaS loaded.`
      );
    }

    const formattedPrompt = formatNAtlasPrompt(request.messages);
    const start = Date.now();
    const result = await this.client.generate(
      formattedPrompt,
      request.temperature ?? 0.7,
      request.maxTokens ?? 512
    );

    const latencyMs = Date.now() - start;
    const cleanText = cleanNAtlasOutput(result.text);

    return {
      text: cleanText,
      model: OFFICIAL_MODEL_METADATA.modelId,
      mode: 'local',
      latencyMs: result.latencyMs || latencyMs,
      isMock: false,
      usage: result.usage,
      finishReason: 'stop',
      timestamp: new Date().toISOString(),
    };
  }

  async getModelInfo(): Promise<ModelInfo> {
    return {
      id: OFFICIAL_MODEL_METADATA.modelId,
      name: 'N-ATLaS (National AI Sovereign Large Language Model)',
      organization: OFFICIAL_MODEL_METADATA.organization,
      baseArchitecture: OFFICIAL_MODEL_METADATA.baseArchitecture,
      parameters: '8B Parameters',
      languages: ['English', 'Yoruba (Èdè Yorùbá)', 'Hausa (Harshen Hausa)', 'Igbo (Asụsụ Igbo)', 'Nigerian Pidgin'],
      contextLength: OFFICIAL_MODEL_METADATA.contextWindow,
      repositoryUrl: 'https://huggingface.co/NCAIR1/N-ATLaS',
      license: OFFICIAL_MODEL_METADATA.license,
      challengeTrack: 'NAIC 2026 — PS1: Developer Infrastructure',
    };
  }
}
