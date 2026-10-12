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

// Handle body parsing safely in both standalone Express and serverless environments (where Vercel may pre-parse req.body)
app.use((req: Request, _res: Response, next) => {
  if (req.body !== undefined && typeof req.body === 'object' && req.body !== null) {
    return next();
  }
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
      return next();
    } catch {
      // Fall through to express.json parser
    }
  }
  express.json({ limit: '10mb' })(req, _res, next);
});

const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'N-ATLAS Forge',
    version: '1.0.0-naic2026',
    challengeTrack: 'NAIC 2026 PS1: Developer Infrastructure',
  });
});

// N-ATLaS Health Check
apiRouter.get('/natlas/health', async (_req: Request, res: Response) => {
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
apiRouter.get('/natlas/model', async (_req: Request, res: Response) => {
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
apiRouter.get('/capabilities', (_req: Request, res: Response) => {
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
apiRouter.post('/natlas/generate', async (req: Request, res: Response) => {
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
apiRouter.post('/natlas/stream', async (req: Request, res: Response) => {
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
apiRouter.get('/evaluations/cases', (_req: Request, res: Response) => {
  res.json({
    total: BENCHMARK_CASES.length,
    cases: BENCHMARK_CASES,
  });
});

// Run evaluation on a case or run all cases
apiRouter.post('/evaluations', async (req: Request, res: Response) => {
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
apiRouter.get('/evaluations', (_req: Request, res: Response) => {
  const runs = getAllEvaluationResults();
  const report = generateEvaluationReport();
  res.json({
    runs,
    report,
    hasEvaluated: runs.length > 0,
  });
});

// Get specific evaluation run by ID
apiRouter.get('/evaluations/:id', (req: Request, res: Response) => {
  const run = getEvaluationResultById(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Evaluation result not found' });
  }
  res.json(run);
});

// Clear evaluation history
apiRouter.post('/evaluations/clear', (_req: Request, res: Response) => {
  clearEvaluationResults();
  res.json({ cleared: true });
});

// Integration Doctor diagnosis
apiRouter.post('/integration/diagnose', (req: Request, res: Response) => {
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
apiRouter.post('/settings', (req: Request, res: Response) => {
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

// Readiness probe endpoint
apiRouter.get('/ready', (_req: Request, res: Response) => {
  res.json({
    ready: true,
    status: 'ready',
    service: 'N-ATLAS Forge',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root API status endpoint specifically for /api and /api/
apiRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'N-ATLAS Forge',
    version: '1.0.0-naic2026',
    model: defaultClient.getConfig().modelId,
    mode: defaultClient.getConfig().mode,
    challengeTrack: 'NAIC 2026 PS1: Developer Infrastructure',
  });
});

// API 404 handler to ensure all unmatched /api requests return JSON rather than HTML
apiRouter.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Mount all API endpoints strictly under /api prefix
app.use('/api', apiRouter);

// Forward /natlas and other direct API calls to apiRouter for non-prefixed rewrite compatibility
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/natlas/')) {
    return apiRouter(req, res, next);
  }
  next();
});

// Specific JSON 404 handler for unmatched /api routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Start Express and integrate Vite in development
async function startServer() {
  const PORT = 3000;

  let viteMiddlewares: any = null;
  let viteReadyPromise: Promise<void> | null = null;

  if (process.env.NODE_ENV !== 'production') {
    viteReadyPromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      viteMiddlewares = vite.middlewares;
    })().catch((err) => {
      console.error('[N-ATLAS Forge] Failed to initialize Vite middleware:', err);
    });

    app.use((req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      if (viteMiddlewares) {
        return viteMiddlewares(req, res, next);
      }
      viteReadyPromise
        ?.then(() => {
          if (viteMiddlewares) {
            viteMiddlewares(req, res, next);
          } else {
            next();
          }
        })
        .catch(next);
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Global JSON error handler to ensure API errors always return proper JSON with appropriate status codes
  app.use((err: any, _req: Request, res: Response, next: any) => {
    if (res.headersSent) {
      return next(err);
    }
    const statusCode =
      typeof err.status === 'number'
        ? err.status
        : typeof err.statusCode === 'number'
          ? err.statusCode
          : 500;
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    });
  });

  // Bind port 3000 immediately so reverse proxies connect instantly
  // and do not serve the fallback "... Starting Server..." HTML page.
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[N-ATLAS Forge] Dev server running on http://0.0.0.0:${PORT}`);
    console.log(`[N-ATLAS Forge] Sovereign Model: NCAIR1/N-ATLaS`);
    console.log(`[N-ATLAS Forge] Mode: ${defaultClient.getConfig().mode}`);
  });
}

// Only start standalone HTTP server when not running in test or serverless environment
if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch((err) => {
    console.error('Failed to start Forge server:', err);
    process.exit(1);
  });
}

export { app };
export default app;
