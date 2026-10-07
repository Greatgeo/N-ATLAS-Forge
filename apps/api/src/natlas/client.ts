import { NAtlasAdapter } from './adapter.ts';
import { LocalNAtlasAdapter } from './local/local-adapter.ts';
import { NAtlasApiAdapter } from './api/api-adapter.ts';
import { MockNAtlasAdapter } from './mock/mock-adapter.ts';
import { NAtlasConfig, loadConfig } from './config.ts';

export class NAtlasClient {
  private adapter: NAtlasAdapter;
  private config: NAtlasConfig;

  constructor(customConfig?: Partial<NAtlasConfig>) {
    this.config = { ...loadConfig(), ...customConfig };

    switch (this.config.mode) {
      case 'api':
        this.adapter = new NAtlasApiAdapter(this.config);
        break;
      case 'mock':
        this.adapter = new MockNAtlasAdapter(this.config);
        break;
      case 'local':
      default:
        this.adapter = new LocalNAtlasAdapter(this.config);
        break;
    }
  }

  getAdapter(): NAtlasAdapter {
    return this.adapter;
  }

  getConfig(): NAtlasConfig {
    return { ...this.config };
  }

  reconfigure(updates: Partial<NAtlasConfig>): void {
    this.config = { ...this.config, ...updates };
    switch (this.config.mode) {
      case 'api':
        this.adapter = new NAtlasApiAdapter(this.config);
        break;
      case 'mock':
        this.adapter = new MockNAtlasAdapter(this.config);
        break;
      case 'local':
      default:
        this.adapter = new LocalNAtlasAdapter(this.config);
        break;
    }
  }
}

// Global singleton instance for the Forge backend
export const defaultClient = new NAtlasClient();
