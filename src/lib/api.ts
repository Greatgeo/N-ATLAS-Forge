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

export const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  ''
).replace(/\/$/, '');

/**
 * Checks if an HTTP response represents a dev server startup/proxy page
 * (e.g. Google AI Studio preview proxy returning HTTP 200 with "... Starting Server...").
 */
export function isStartupHtmlResponse(status: number, contentType: string, bodyText: string): boolean {
  const isHtml =
    contentType.includes('text/html') ||
    (!contentType.includes('application/json') && bodyText.trim().startsWith('<'));
  const lower = bodyText.toLowerCase();
  return (
    lower.includes('starting server') ||
    lower.includes('... starting server...') ||
    (status === 200 && isHtml && (lower.includes('starting') || lower.includes('server')))
  );
}

/**
 * Centralized fetch helper that handles API base URL, JSON headers,
 * startup HTML detection with optional retry, and clean error messages.
 */
export async function apiFetchJson<T>(
  endpoint: string,
  options?: RequestInit,
  retries = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let attempts = 0;

  while (attempts <= retries) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    // Check if the server is still starting up
    if (isStartupHtmlResponse(res.status, contentType, text)) {
      attempts++;
      if (attempts <= retries) {
        await new Promise((resolve) => setTimeout(resolve, 800 * attempts));
        continue;
      }
      throw new Error(
        'Server is still starting up. Please wait a few moments for initialization to complete, then try again.'
      );
    }

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorJson = JSON.parse(text);
        if (errorJson.error) errorMsg = errorJson.error;
      } catch {
        if (text && text.trim().length > 0) {
          errorMsg = `Server error (${res.status}): ${text.slice(0, 200).trim()}`;
        }
      }
      throw new Error(errorMsg);
    }

    if (!contentType.includes('application/json')) {
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error(
          `Server returned non-JSON response (${res.status}): ${text.slice(0, 200).trim()}`
        );
      }
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Failed to parse server response as JSON');
    }
  }

  throw new Error('Max retries exceeded while waiting for server readiness.');
}

export async function fetchHealth(): Promise<NAtlasHealth> {
  try {
    return await apiFetchJson<NAtlasHealth>('/api/natlas/health', undefined, 1);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      status: 'not_connected',
      mode: 'local',
      modelId: 'NCAIR1/N-ATLaS',
      timestamp: new Date().toISOString(),
      details: {
        runtimeType: 'Unknown',
        endpointConfigured: false,
        localRuntimeAvailable: false,
        message: errMsg.includes('starting up') ? 'Server is still initializing...' : errMsg,
      },
    };
  }
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  return apiFetchJson<ModelInfo>('/api/natlas/model');
}

export async function fetchCapabilities(): Promise<any> {
  return apiFetchJson<any>('/api/capabilities');
}

export async function generateCompletion(
  req: GenerateRequest,
  retries = 3
): Promise<GenerateResponse> {
  return apiFetchJson<GenerateResponse>(
    '/api/natlas/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    },
    retries
  );
}

export async function fetchEvaluationCases(): Promise<{ total: number; cases: EvaluationCase[] }> {
  return apiFetchJson<{ total: number; cases: EvaluationCase[] }>('/api/evaluations/cases');
}

export async function fetchEvaluations(): Promise<{
  runs: EvaluationRunResult[];
  report: EvaluationReport | null;
  hasEvaluated: boolean;
}> {
  return apiFetchJson<{
    runs: EvaluationRunResult[];
    report: EvaluationReport | null;
    hasEvaluated: boolean;
  }>('/api/evaluations');
}

export async function runEvaluation(caseId?: string, runAll = false): Promise<{
  runCount: number;
  results: EvaluationRunResult[];
  report: EvaluationReport | null;
}> {
  return apiFetchJson<{
    runCount: number;
    results: EvaluationRunResult[];
    report: EvaluationReport | null;
  }>('/api/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId, runAll }),
  });
}

export async function clearEvaluations(): Promise<void> {
  await apiFetchJson('/api/evaluations/clear', { method: 'POST' });
}

export async function diagnoseIssue(input: DiagnosticInput): Promise<DiagnosticResult> {
  return apiFetchJson<DiagnosticResult>('/api/integration/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateSettings(settings: {
  mode?: string;
  apiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  localWorkerPort?: number;
}): Promise<any> {
  return apiFetchJson<any>('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}
