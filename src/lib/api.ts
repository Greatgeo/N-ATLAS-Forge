import {
  GenerateRequest,
  GenerateResponse,
  NAtlasHealth,
  ModelInfo,
  EvaluationCase,
  EvaluationRunResult,
  EvaluationReport,
  DiagnosticInput,
  DiagnosticResult,
} from '../../packages/shared/types.ts';

export async function fetchHealth(): Promise<NAtlasHealth> {
  const res = await fetch('/api/natlas/health');
  return res.json();
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const res = await fetch('/api/natlas/model');
  return res.json();
}

export async function fetchCapabilities(): Promise<any> {
  const res = await fetch('/api/capabilities');
  return res.json();
}

export async function generateCompletion(req: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch('/api/natlas/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: Failed to generate completion`);
  }

  return res.json();
}

export async function fetchEvaluationCases(): Promise<{ total: number; cases: EvaluationCase[] }> {
  const res = await fetch('/api/evaluations/cases');
  return res.json();
}

export async function fetchEvaluations(): Promise<{
  runs: EvaluationRunResult[];
  report: EvaluationReport | null;
  hasEvaluated: boolean;
}> {
  const res = await fetch('/api/evaluations');
  return res.json();
}

export async function runEvaluation(caseId?: string, runAll = false): Promise<{
  runCount: number;
  results: EvaluationRunResult[];
  report: EvaluationReport | null;
}> {
  const res = await fetch('/api/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId, runAll }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Evaluation failed');
  }

  return res.json();
}

export async function clearEvaluations(): Promise<void> {
  await fetch('/api/evaluations/clear', { method: 'POST' });
}

export async function diagnoseIssue(input: DiagnosticInput): Promise<DiagnosticResult> {
  const res = await fetch('/api/integration/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateSettings(settings: {
  mode?: string;
  apiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  localWorkerPort?: number;
}): Promise<any> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}
