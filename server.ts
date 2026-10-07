import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { defaultClient } from './apps/api/src/natlas/client.ts';
import { NAtlasError } from './apps/api/src/natlas/errors.ts';
import { BENCHMARK_CASES } from './apps/api/src/evaluation/benchmark-cases.ts';
import { evaluateResponseAgainstCase } from './apps/api/src/evaluation/evaluator.ts';
import {
  addEvaluationResult,
  getAllEvaluationResults,
  getEvaluationResultById,
  generateEvaluationReport,
  clearEvaluationResults,
} from './apps/api/src/evaluation/store.ts';
import { diagnoseIntegrationIssue } from './apps/api/src/diagnostics/doctor.ts';
import { OFFICIAL_MODEL_METADATA } from './apps/api/src/natlas/local/model-loader.ts';
import { getSafeConfigView } from './apps/api/src/natlas/config.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'N-ATLAS Forge',
    version: '1.0.0-naic2026',
    challengeTrack: 'NAIC 2026 PS1: Developer Infrastructure',
  });
});

// N-ATLaS Health Check
app.get('/api/natlas/health', async (_req: Request, res: Response) => {
  try {
    const adapter = defaultClient.getAdapter();
    const health = await adapter.health();
    res.json(health);
  } catch (err: unknown) {
    res.status(503).json({
      status: 'not_connected',
      mode: defaultClient.getConfig().mode,
      modelId: defaultClient.getConfig().modelId,
      timestamp: new Date().toISOString(),
      details: {
        runtimeType: 'Unknown',
        endpointConfigured: false,
        localRuntimeAvailable: false,
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }
});

// N-ATLaS Model Info
app.get('/api/natlas/model', async (_req: Request, res: Response) => {
  try {
    const adapter = defaultClient.getAdapter();
    const model = await adapter.getModelInfo();
    res.json({
      ...model,
      officialMetadata: OFFICIAL_MODEL_METADATA,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Capabilities Explorer
app.get('/api/capabilities', (_req: Request, res: Response) => {
  const cfg = defaultClient.getConfig();
  res.json({
    sovereignModel: 'NCAIR1/N-ATLaS',
    supportedLanguages: [
      { code: 'en', name: 'English (Nigerian Context)', tier: 'Primary' },
      { code: 'yo', name: 'Yoruba (Èdè Yorùbá)', tier: 'Sovereign Core' },
      { code: 'ha', name: 'Hausa (Harshen Hausa)', tier: 'Sovereign Core' },
      { code: 'ig', name: 'Igbo (Asụsụ Igbo)', tier: 'Sovereign Core' },
      { code: 'pcm', name: 'Nigerian Pidgin', tier: 'National Creolized' },
    ],
    adapterMode: cfg.mode,
    activeConfig: getSafeConfigView(cfg),
    capabilities: [
      'Llama-3 8B Architecture Compatibility',
      'Local PyTorch / Transformers Worker Daemon Integration',
      'Official Remote HTTP Inference Integration Boundary',
      'Automated Socio-Legal Context Rule Validation',
      'Deterministic Integration Doctor Engine',
      'Reproducible 4-Axis Benchmark Lab',
    ],
  });
});

// N-ATLaS Generate
app.post('/api/natlas/generate', async (req: Request, res: Response) => {
  try {
    const { messages, temperature, maxTokens, language } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: "messages" array is required and must not be empty.',
        code: 'NATLAS_REQUEST_ERROR',
      });
    }

    const adapter = defaultClient.getAdapter();
    const response = await adapter.generate({
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: typeof maxTokens === 'number' ? maxTokens : 512,
      language,
    });

    res.json(response);
  } catch (err: unknown) {
    if (err instanceof NAtlasError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        retryable: err.retryable,
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: `Inference failed: ${message}`,
      code: 'NATLAS_SERVER_ERROR',
    });
  }
});

// N-ATLaS Stream (SSE)
app.post('/api/natlas/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { messages, temperature, maxTokens, language } = req.body;
    const adapter = defaultClient.getAdapter();
    const result = await adapter.generate({
      messages,
      temperature,
      maxTokens,
      language,
    });

    // Stream out chunks
    const words = result.text.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ chunk: word + ' ' })}\n\n`);
      await new Promise((r) => setTimeout(r, 20));
    }

    res.write(
      `data: ${JSON.stringify({
        done: true,
        meta: {
          model: result.model,
          latencyMs: result.latencyMs,
          isMock: result.isMock,
        },
      })}\n\n`
    );
    res.end();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.end();
  }
});

// Benchmark cases
app.get('/api/evaluations/cases', (_req: Request, res: Response) => {
  res.json({
    total: BENCHMARK_CASES.length,
    cases: BENCHMARK_CASES,
  });
});

// Run evaluation on a case or run all cases
app.post('/api/evaluations', async (req: Request, res: Response) => {
  try {
    const { caseId, runAll } = req.body;
    const adapter = defaultClient.getAdapter();

    const casesToRun = runAll
      ? BENCHMARK_CASES
      : BENCHMARK_CASES.filter((c) => c.id === caseId);

    if (casesToRun.length === 0) {
      return res.status(404).json({ error: `Evaluation case '${caseId}' not found.` });
    }

    const results = [];
    for (const testCase of casesToRun) {
      const genResponse = await adapter.generate({
        messages: [{ role: 'user', content: testCase.prompt }],
        temperature: 0.2, // Lower temperature for evaluation reproducibility
        maxTokens: 512,
        language: testCase.language,
      });

      const evaluation = evaluateResponseAgainstCase(testCase, genResponse);
      addEvaluationResult(evaluation);
      results.push(evaluation);
    }

    const report = generateEvaluationReport();
    res.json({
      runCount: results.length,
      results,
      report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Evaluation execution failed: ${message}` });
  }
});

// Get all evaluations and report
app.get('/api/evaluations', (_req: Request, res: Response) => {
  const runs = getAllEvaluationResults();
  const report = generateEvaluationReport();
  res.json({
    runs,
    report,
    hasEvaluated: runs.length > 0,
  });
});

// Get specific evaluation run by ID
app.get('/api/evaluations/:id', (req: Request, res: Response) => {
  const run = getEvaluationResultById(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Evaluation result not found' });
  }
  res.json(run);
});

// Clear evaluation history
app.post('/api/evaluations/clear', (_req: Request, res: Response) => {
  clearEvaluationResults();
  res.json({ cleared: true });
});

// Integration Doctor diagnosis
app.post('/api/integration/diagnose', (req: Request, res: Response) => {
  const { errorMessage, mode, stackTrace, endpointUrl, timeoutMs } = req.body;
  const currentMode = mode || defaultClient.getConfig().mode;

  const diagnosis = diagnoseIntegrationIssue({
    errorMessage: errorMessage || '',
    mode: currentMode,
    stackTrace,
    endpointUrl,
    timeoutMs,
  });

  res.json(diagnosis);
});

// Runtime Settings & Mode Switcher
app.post('/api/settings', (req: Request, res: Response) => {
  const { mode, apiUrl, apiKey, timeoutMs, localWorkerPort } = req.body;
  if (mode && !['local', 'api', 'mock'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be "local", "api", or "mock".' });
  }

  defaultClient.reconfigure({
    ...(mode ? { mode } : {}),
    ...(apiUrl !== undefined ? { apiUrl } : {}),
    ...(apiKey !== undefined ? { apiKey } : {}),
    ...(timeoutMs ? { timeoutMs: Number(timeoutMs) } : {}),
    ...(localWorkerPort ? { localWorkerPort: Number(localWorkerPort) } : {}),
  });

  res.json({
    updated: true,
    config: getSafeConfigView(defaultClient.getConfig()),
  });
});

// Start Express and integrate Vite in development
async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[N-ATLAS Forge] Dev server running on http://0.0.0.0:${PORT}`);
    console.log(`[N-ATLAS Forge] Sovereign Model: NCAIR1/N-ATLaS`);
    console.log(`[N-ATLAS Forge] Mode: ${defaultClient.getConfig().mode}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Forge server:', err);
  process.exit(1);
});
