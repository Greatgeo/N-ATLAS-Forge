export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

export type NAtlasMode = 'local' | 'api' | 'mock';

export type SupportedLanguage = 'en' | 'yo' | 'ha' | 'ig' | 'pcm';

export interface GenerateRequest {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  language?: SupportedLanguage;
  stream?: boolean;
}

export interface GenerateResponse {
  text: string;
  model: string;
  mode: NAtlasMode;
  latencyMs: number;
  isMock: boolean;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  finishReason?: 'stop' | 'length' | 'timeout' | 'error';
  timestamp: string;
}

export interface NAtlasHealth {
  status: 'connected' | 'not_connected' | 'degraded' | 'mock_mode';
  mode: NAtlasMode;
  modelId: string;
  timestamp: string;
  details: {
    runtimeType: string;
    endpointConfigured: boolean;
    localRuntimeAvailable: boolean;
    memoryAllocatedMb?: number;
    lastPingMs?: number;
    message?: string;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  organization: string;
  baseArchitecture: string;
  parameters: string;
  languages: string[];
  contextLength: number;
  repositoryUrl: string;
  license: string;
  challengeTrack: string;
}

export interface EvaluationCriterion {
  id: 'accuracy' | 'relevance' | 'clarity' | 'nigerian_context';
  name: string;
  weight: number;
  description: string;
}

export interface EvaluationCase {
  id: string;
  title: string;
  category: 'sme_business' | 'financial_literacy' | 'civic_education' | 'everyday_multilingual';
  language: SupportedLanguage;
  prompt: string;
  referenceContext?: string;
  criteria: Array<'accuracy' | 'relevance' | 'clarity' | 'nigerian_context'>;
  expectedKeywords?: string[];
  mustAvoidTerms?: string[];
  statutoryCitations?: string[];
  source: 'FORGE_ORIGINAL' | 'MODEL_CARD_REFERENCE';
}

export interface EvaluationScore {
  criterion: 'accuracy' | 'relevance' | 'clarity' | 'nigerian_context';
  score: number; // 1 to 5
  notes?: string;
  automatedCheckPassed?: boolean;
}

export interface EvaluationRunResult {
  id: string;
  caseId: string;
  timestamp: string;
  model: string;
  mode: NAtlasMode;
  isMock: boolean;
  prompt: string;
  response: string;
  latencyMs: number;
  scores: Record<'accuracy' | 'relevance' | 'clarity' | 'nigerian_context', number>;
  aggregateScore: number; // 1.0 - 5.0
  automatedChecks: {
    hasNigerianContextKeywords: boolean;
    avoidsProhibitedAssumptions: boolean;
    hasStatutoryReference?: boolean;
    currencyAccuracy?: boolean;
    passedRuleCount: number;
    totalRuleCount: number;
  };
  evaluatorType: 'automated_rule_engine' | 'human_verified';
  status: 'passed' | 'warning' | 'failed';
}

export interface EvaluationReport {
  id: string;
  title: string;
  createdAt: string;
  model: string;
  mode: NAtlasMode;
  isMock: boolean;
  totalCases: number;
  passedCases: number;
  averageScore: number;
  categoryAverages: Record<string, number>;
  averageLatencyMs: number;
  methodology: string;
  limitations: string;
  runs: EvaluationRunResult[];
}

export interface DiagnosticInput {
  errorMessage: string;
  mode: NAtlasMode;
  stackTrace?: string;
  endpointUrl?: string;
  timeoutMs?: number;
}

export interface DiagnosticResult {
  category:
    | 'AUTHENTICATION'
    | 'CONFIGURATION'
    | 'ENDPOINT'
    | 'REQUEST'
    | 'TIMEOUT'
    | 'MODEL'
    | 'RATE_LIMIT'
    | 'CUDA_HARDWARE'
    | 'UNKNOWN';
  severity: 'critical' | 'high' | 'medium' | 'low';
  problem: string;
  likelyCause: string;
  verifiedChecks: string[];
  suggestedSolution: string;
  correctedConfigSnippet?: string;
  relevantDocsUrl?: string;
}
