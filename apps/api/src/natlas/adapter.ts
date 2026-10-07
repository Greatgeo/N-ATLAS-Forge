import {
  GenerateRequest,
  GenerateResponse,
  NAtlasHealth,
  ModelInfo,
} from '../../../../packages/shared/types.ts';

export interface NAtlasAdapter {
  health(): Promise<NAtlasHealth>;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  getModelInfo(): Promise<ModelInfo>;
}
