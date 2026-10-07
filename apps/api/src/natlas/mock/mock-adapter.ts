import { NAtlasAdapter } from '../adapter.ts';
import {
  GenerateRequest,
  GenerateResponse,
  NAtlasHealth,
  ModelInfo,
} from '../../../../../packages/shared/types.ts';
import { NAtlasConfig } from '../config.ts';

export class MockNAtlasAdapter implements NAtlasAdapter {
  private config: NAtlasConfig;

  constructor(config: NAtlasConfig) {
    this.config = config;
  }

  async health(): Promise<NAtlasHealth> {
    return {
      status: 'mock_mode',
      mode: 'mock',
      modelId: `${this.config.modelId} (DEVELOPMENT MOCK — NOT N-ATLaS)`,
      timestamp: new Date().toISOString(),
      details: {
        runtimeType: 'In-Memory Development Mock (Synthetic Diagnostic Provider)',
        endpointConfigured: false,
        localRuntimeAvailable: false,
        message: 'DEVELOPMENT MOCK — NOT N-ATLaS. Enabled exclusively for offline UI layout validation.',
      },
    };
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const userMsg = request.messages.filter((m) => m.role === 'user').pop()?.content || '';
    const lang = request.language || 'en';

    // Simulated response with prominent disclaimer
    const syntheticText =
      `[DEVELOPMENT MOCK — NOT N-ATLaS OUTPUT]\n` +
      `[CRITICAL NOTICE: This is a synthetic mock response generated solely for frontend layout and tooling tests.]\n\n` +
      this.getSimulatedResponse(userMsg, lang) +
      `\n\n[END OF DEVELOPMENT MOCK]`;

    return {
      text: syntheticText,
      model: `${this.config.modelId} [MOCK]`,
      mode: 'mock',
      latencyMs: 142,
      isMock: true,
      usage: {
        inputTokens: Math.round(userMsg.length / 4),
        outputTokens: Math.round(syntheticText.length / 4),
        totalTokens: Math.round((userMsg.length + syntheticText.length) / 4),
      },
      finishReason: 'stop',
      timestamp: new Date().toISOString(),
    };
  }

  async getModelInfo(): Promise<ModelInfo> {
    return {
      id: `${this.config.modelId}-mock`,
      name: 'N-ATLaS Development Mock (Synthetic)',
      organization: 'Forge Local Development Sandbox',
      baseArchitecture: 'Mock / Simulated Architecture',
      parameters: '0B (Mock)',
      languages: ['English', 'Yoruba', 'Hausa', 'Igbo', 'Nigerian Pidgin'],
      contextLength: 4096,
      repositoryUrl: 'https://huggingface.co/NCAIR1/N-ATLaS',
      license: 'Development Only — Not For Production or Evaluation Evidence',
      challengeTrack: 'NAIC 2026 — PS1: Developer Infrastructure',
    };
  }

  private getSimulatedResponse(prompt: string, lang: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('vat') || p.includes('tax')) {
      return (
        'In Nigeria, under the Value Added Tax (VAT) Act and recent Finance Acts administered by the ' +
        'Federal Inland Revenue Service (FIRS), standard VAT is levied at 7.5%. However, small businesses ' +
        'with an annual turnover below ₦25,000,000 are legally exempt from charging and remitting VAT.'
      );
    }
    if (lang === 'yo' || p.includes('bawo') || p.includes('yoruba')) {
      return 'E ku ojumo! Eyi je idahun apere lati inu eto idanwo. N-ATLaS se atileyin fun ede Yoruba.';
    }
    if (lang === 'ha' || p.includes('sannu') || p.includes('hausa')) {
      return 'Sannu da zuwa! Wannan amsa ce ta gwaji domin tantance yanayin aiki a Harshen Hausa.';
    }
    if (lang === 'ig' || p.includes('kedo') || p.includes('igbo')) {
      return 'Nnoo! Nke a bu aziza nnwale maka nlele nka na Asusu Igbo.';
    }
    if (lang === 'pcm' || p.includes('how far') || p.includes('pidgin')) {
      return 'How far now! Dis na mock response for test. Real N-ATLaS model dey understand Naija talk well-well.';
    }
    return (
      `Synthetic response for prompt: "${prompt.slice(0, 80)}...". ` +
      `To generate authentic sovereign AI inference, configure local PyTorch runtime or an official endpoint.`
    );
  }
}
