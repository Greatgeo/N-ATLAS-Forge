/**
 * N-ATLAS Forge — Comprehensive Unit & Integration Test Suite
 * Tests: Errors, Adapters, Prompt Template, Evaluator Engine, Diagnostic Doctor, SDK
 */

process.env.NODE_ENV = 'test';

import {
  NAtlasError,
  NAtlasConfigurationError,
  NAtlasAuthenticationError,
  NAtlasConnectionError,
  NAtlasTimeoutError,
} from '../../apps/api/src/natlas/errors.ts';
import { formatNAtlasPrompt, cleanNAtlasOutput } from '../../apps/api/src/natlas/local/prompt-template.ts';
import { MockNAtlasAdapter } from '../../apps/api/src/natlas/mock/mock-adapter.ts';
import { NAtlasApiAdapter } from '../../apps/api/src/natlas/api/api-adapter.ts';
import { evaluateResponseAgainstCase } from '../../apps/api/src/evaluation/evaluator.ts';
import { BENCHMARK_CASES } from '../../apps/api/src/evaluation/benchmark-cases.ts';
import { diagnoseIntegrationIssue } from '../../apps/api/src/diagnostics/doctor.ts';
import { NAtlas } from '../../packages/sdk-js/index.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- 1. Testing N-ATLaS Error Hierarchy ---');
  const cfgErr = new NAtlasConfigurationError('Missing endpoint');
  assert(cfgErr instanceof NAtlasError, 'ConfigurationError inherits from NAtlasError');
  assert(cfgErr.statusCode === 400, 'ConfigurationError statusCode is 400');
  assert(cfgErr.retryable === false, 'ConfigurationError is not retryable');

  const connErr = new NAtlasConnectionError();
  assert(connErr.statusCode === 503, 'ConnectionError statusCode is 503');
  assert(connErr.retryable === true, 'ConnectionError is retryable');

  console.log('\n--- 2. Testing Llama-3 Prompt Templating for N-ATLaS ---');
  const messages = [
    { role: 'system' as const, content: 'You are N-ATLaS.' },
    { role: 'user' as const, content: 'What is CAMA 2020?' },
  ];
  const templated = formatNAtlasPrompt(messages);
  assert(templated.includes('<|begin_of_text|>'), 'Includes begin_of_text token');
  assert(templated.includes('<|start_header_id|>system<|end_header_id|>'), 'Includes system header');
  assert(templated.includes('<|start_header_id|>user<|end_header_id|>'), 'Includes user header');
  assert(templated.endsWith('<|start_header_id|>assistant<|end_header_id|>\n\n'), 'Primes assistant response turn');

  const dirtyOutput = 'This is valid output<|eot_id|>';
  const cleaned = cleanNAtlasOutput(dirtyOutput);
  assert(cleaned === 'This is valid output', 'cleanNAtlasOutput strips eot_id');

  console.log('\n--- 3. Testing Mock Adapter & Disclaimers (Rule 2 & 16) ---');
  const mockAdapter = new MockNAtlasAdapter({
    mode: 'mock',
    modelId: 'NCAIR1/N-ATLaS',
    timeoutMs: 5000,
    allowMock: true,
  });
  const mockHealth = await mockAdapter.health();
  assert(mockHealth.status === 'mock_mode', 'Mock health returns mock_mode');

  const mockGen = await mockAdapter.generate({
    messages: [{ role: 'user', content: 'Explain VAT threshold' }],
  });
  assert(mockGen.isMock === true, 'Generate response sets isMock: true');
  assert(mockGen.text.includes('DEVELOPMENT MOCK — NOT N-ATLaS'), 'Output includes prominent mock disclaimer');
  assert(mockGen.text.includes('[END OF DEVELOPMENT MOCK]'), 'Output includes closing mock disclaimer');
  assert(mockGen.model.includes('[MOCK]'), 'Model identifier clearly marked with [MOCK]');
  assert(JSON.parse(JSON.stringify(mockGen)).isMock === true, 'Response serializes to valid parseable JSON');

  console.log('\n--- 3b. Regression Test: Express /api/natlas/generate Route in Mock Mode ---');
  const { app } = await import('../../server.ts');
  const { defaultClient } = await import('../../apps/api/src/natlas/client.ts');
  defaultClient.reconfigure({ mode: 'mock' });

  // Start ephemeral loopback server
  const testServer = app.listen(0);
  const testPort = (testServer.address() as any).port;

  try {
    // 1. Test POST /api/natlas/generate
    const resWithApiPrefix = await fetch(`http://127.0.0.1:${testPort}/api/natlas/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Explain CAMA 2020 annual returns' }],
        temperature: 0.7,
        maxTokens: 256,
      }),
    });

    assert(resWithApiPrefix.status === 200, 'POST /api/natlas/generate returns HTTP 200');
    assert(
      (resWithApiPrefix.headers.get('content-type') || '').includes('application/json'),
      'POST /api/natlas/generate returns Content-Type: application/json'
    );
    const jsonWithApi = await resWithApiPrefix.json();
    assert(jsonWithApi.isMock === true, 'JSON response has isMock: true');
    assert(jsonWithApi.mode === 'mock', 'JSON response has mode: "mock"');
    assert(jsonWithApi.text.includes('DEVELOPMENT MOCK — NOT N-ATLaS OUTPUT'), 'JSON text contains mock disclaimer');

    // 2. Test POST /natlas/generate (without /api prefix, for rewrite flexibility)
    const resWithoutApiPrefix = await fetch(`http://127.0.0.1:${testPort}/natlas/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Explain VAT threshold' }],
      }),
    });
    assert(resWithoutApiPrefix.status === 200, 'POST /natlas/generate returns HTTP 200 without /api prefix');
    const jsonWithoutApi = await resWithoutApiPrefix.json();
    assert(jsonWithoutApi.isMock === true, 'Non-prefixed route returns valid JSON with isMock: true');

    // 3. Test GET /api root health
    const resRootApi = await fetch(`http://127.0.0.1:${testPort}/api`);
    assert(resRootApi.status === 200, 'GET /api root returns HTTP 200');
    const jsonRootApi = await resRootApi.json();
    assert(jsonRootApi.status === 'healthy', 'GET /api returns healthy status JSON');

    // 4. Test serverless catch-all handler (/api/[...path].ts)
    const { default: pathHandler } = await import('../../api/[...path].ts');
    let pathHandlerCalled = false;
    const mockReq = {
      url: '/api/natlas/generate',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { messages: [{ role: 'user', content: 'Test prompt' }] },
    };
    const mockRes = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      setHeader(k: string, v: string) { this.headers[k] = v; },
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) {
        pathHandlerCalled = true;
        assert(data.isMock === true, 'api/[...path].ts handler returns valid JSON with isMock: true');
        assert(data.text.includes('DEVELOPMENT MOCK'), 'api/[...path].ts response includes mock disclaimer');
      },
    };
    await pathHandler(mockReq as any, mockRes as any);
    assert(pathHandlerCalled, 'api/[...path].ts handler executed successfully');

    // 5. Test serverless index handler (/api/index.ts) with x-matched-path recovery
    const { default: indexHandler } = await import('../../api/index.ts');
    let indexHandlerCalled = false;
    const mockIndexReq = {
      url: '/api',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-matched-path': '/api/natlas/generate',
      },
      body: { messages: [{ role: 'user', content: 'Test prompt 2' }] },
    };
    const mockIndexRes = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      setHeader(k: string, v: string) { this.headers[k] = v; },
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) {
        indexHandlerCalled = true;
        assert(data.isMock === true, 'api/index.ts handler recovers path and returns isMock: true');
      },
    };
    await indexHandler(mockIndexReq as any, mockIndexRes as any);
    assert(indexHandlerCalled, 'api/index.ts handler executed successfully');
  } finally {
    testServer.close();
    // Reset to local mode default
    defaultClient.reconfigure({ mode: 'local' });
  }

  console.log('\n--- 4. Testing API Adapter Gating (Rule 1: No Invented APIs) ---');
  const unconfiguredApiAdapter = new NAtlasApiAdapter({
    mode: 'api',
    modelId: 'NCAIR1/N-ATLaS',
    timeoutMs: 5000,
    allowMock: false,
  });
  try {
    await unconfiguredApiAdapter.generate({
      messages: [{ role: 'user', content: 'Test prompt' }],
    });
    assert(false, 'Should throw error when NATLAS_API_URL is missing');
  } catch (err: unknown) {
    assert(err instanceof NAtlasConfigurationError, 'Throws NAtlasConfigurationError on missing endpoint');
  }

  console.log('\n--- 5. Testing 4-Axis Evaluation Engine & Rule Checks ---');
  const vatCase = BENCHMARK_CASES[0]; // en-sme-001
  const goodResponse = {
    text: 'Under the Nigerian Finance Act, small businesses with an annual turnover below ₦25,000,000 are exempt from charging and remitting VAT to the FIRS.',
    model: 'NCAIR1/N-ATLaS',
    mode: 'local' as const,
    latencyMs: 320,
    isMock: false,
    timestamp: new Date().toISOString(),
  };

  const evalResult = evaluateResponseAgainstCase(vatCase, goodResponse);
  assert(evalResult.scores.accuracy >= 4.0, 'Accurate response achieves high accuracy score');
  assert(evalResult.automatedChecks.hasNigerianContextKeywords === true, 'Detects ₦25,000,000 and FIRS keywords');
  assert(evalResult.automatedChecks.avoidsProhibitedAssumptions === true, 'Avoided foreign US IRS terms');
  assert(evalResult.status === 'passed', 'Good response status is passed');

  // Negative test: foreign tax hallucination
  const badResponse = {
    text: 'According to the IRS in the United States, you must file a 1099 for your LLC and pay $5,000 in state sales tax.',
    model: 'NCAIR1/N-ATLaS',
    mode: 'local' as const,
    latencyMs: 300,
    isMock: false,
    timestamp: new Date().toISOString(),
  };
  const badEvalResult = evaluateResponseAgainstCase(vatCase, badResponse);
  assert(badEvalResult.automatedChecks.avoidsProhibitedAssumptions === false, 'Flags foreign IRS assumption');
  assert(badEvalResult.status === 'failed', 'Hallucinatory foreign response fails rubric');

  console.log('\n--- 6. Testing Deterministic Integration Doctor ---');
  const cudaDiag = diagnoseIntegrationIssue({
    errorMessage: 'CUDA out of memory. Tried to allocate 14.80 GiB',
    mode: 'local',
  });
  assert(cudaDiag.category === 'CUDA_HARDWARE', 'Correctly classifies CUDA OOM');
  assert(cudaDiag.suggestedSolution.includes('4-bit'), 'Recommends 4-bit NF4 quantization');

  const timeoutDiag = diagnoseIntegrationIssue({
    errorMessage: 'Inference request timed out after 60000ms',
    mode: 'api',
  });
  assert(timeoutDiag.category === 'TIMEOUT', 'Correctly classifies TIMEOUT error');

  const authDiag = diagnoseIntegrationIssue({
    errorMessage: 'HTTP 401 Unauthorized: Gated repository NCAIR1/N-ATLaS',
    mode: 'local',
  });
  assert(authDiag.category === 'AUTHENTICATION', 'Correctly classifies Hugging Face auth failure');

  console.log('\n--- 7. Testing JavaScript/TypeScript SDK Client ---');
  const sdk = new NAtlas({ baseUrl: 'http://localhost:3000' });
  assert(typeof sdk.generate === 'function', 'SDK provides generate method');
  assert(typeof sdk.health === 'function', 'SDK provides health method');
  assert(typeof sdk.prompt === 'function', 'SDK provides prompt helper');

  console.log('\n--- 8. Regression Test: HTML Startup-Page Response & API Readiness Handling ---');
  const { isStartupHtmlResponse, generateCompletion } = await import('../../src/lib/api.ts');

  // Test 8a: Verify startup HTML detection
  const startupText = '\n... Starting Server...\n';
  assert(
    isStartupHtmlResponse(200, 'text/html', startupText) === true,
    'isStartupHtmlResponse correctly identifies AI Studio "... Starting Server..." proxy text'
  );
  assert(
    isStartupHtmlResponse(200, 'text/html; charset=utf-8', '<html><body>Starting Server...</body></html>') === true,
    'isStartupHtmlResponse identifies HTML startup banner'
  );
  assert(
    isStartupHtmlResponse(200, 'application/json', '{"isMock":true,"text":"Valid"}') === false,
    'isStartupHtmlResponse returns false for legitimate JSON inference response'
  );
  assert(
    isStartupHtmlResponse(500, 'application/json', '{"error":"Internal error"}') === false,
    'isStartupHtmlResponse returns false for legitimate JSON error response'
  );

  // Test 8b: Verify generateCompletion handles startup HTML page gracefully without unhandled non-JSON crash
  const originalFetch = globalThis.fetch;
  try {
    // Mock fetch returning the exact AI Studio startup page with HTTP 200
    (globalThis as any).fetch = async () => ({
      status: 200,
      ok: true,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html' : null),
      },
      text: async () => startupText,
    });

    try {
      await generateCompletion({ messages: [{ role: 'user', content: 'Test prompt' }] }, 1);
      assert(false, 'generateCompletion should reject when server is still starting');
    } catch (err: unknown) {
      const errMsg = (err as Error).message;
      assert(
        errMsg.includes('Server is still starting up'),
        'generateCompletion throws clear startup readiness message instead of cryptic non-JSON error'
      );
      assert(
        !errMsg.includes('Server returned non-JSON response (200)'),
        'generateCompletion avoids treating HTML startup page as an inference response'
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Test 8c: Verify Express /api/ready probe and JSON 404 handler
  const { app: expressApp } = await import('../../server.ts');
  const regServer = expressApp.listen(0);
  const regPort = (regServer.address() as any).port;

  try {
    // 1. Readiness probe on /api/ready
    const readyRes = await fetch(`http://127.0.0.1:${regPort}/api/ready`);
    assert(readyRes.status === 200, 'GET /api/ready returns HTTP 200');
    const readyJson = await readyRes.json();
    assert(readyJson.ready === true, 'GET /api/ready returns ready: true');

    // 2. GET /api/health returns JSON status
    const healthRes = await fetch(`http://127.0.0.1:${regPort}/api/health`);
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200');
    assert(
      (healthRes.headers.get('content-type') || '').includes('application/json'),
      'GET /api/health returns Content-Type: application/json'
    );
    const healthJson = await healthRes.json();
    assert(healthJson.status === 'healthy', 'GET /api/health contains status: healthy');

    // 3. Unmatched API route returns JSON 404 rather than HTML
    const notFoundRes = await fetch(`http://127.0.0.1:${regPort}/api/nonexistent-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true }),
    });
    assert(notFoundRes.status === 404, 'POST /api/nonexistent-route returns HTTP 404');
    assert(
      (notFoundRes.headers.get('content-type') || '').includes('application/json'),
      'POST /api/nonexistent-route returns Content-Type: application/json'
    );
    const notFoundJson = await notFoundRes.json();
    assert(notFoundJson.code === 'ROUTE_NOT_FOUND', '404 response contains code: ROUTE_NOT_FOUND');

    // 4. Invalid body payload to /api/natlas/generate returns JSON 400
    const badReqRes = await fetch(`http://127.0.0.1:${regPort}/api/natlas/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(badReqRes.status === 400, 'POST /api/natlas/generate without messages returns HTTP 400');
    assert(
      (badReqRes.headers.get('content-type') || '').includes('application/json'),
      'HTTP 400 error returns Content-Type: application/json'
    );
    const badReqJson = await badReqRes.json();
    assert(badReqJson.code === 'NATLAS_REQUEST_ERROR', 'HTTP 400 error contains code: NATLAS_REQUEST_ERROR');

    // 5. POST /api/natlas/generate with valid messages reaches backend handler
    const validGenRes = await fetch(`http://127.0.0.1:${regPort}/api/natlas/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Regression test query' }] }),
    });
    // Handler reached: returns either 200 (if worker active/mock) or 503 (if worker unavailable) as JSON
    assert(
      (validGenRes.headers.get('content-type') || '').includes('application/json'),
      'POST /api/natlas/generate returns Content-Type: application/json'
    );
    const validGenJson = await validGenRes.json();
    assert(
      validGenRes.status === 200 || validGenRes.status === 503,
      'POST /api/natlas/generate reaches backend handler (returns 200 or 503 JSON)'
    );
    // 6. Root route GET / does NOT return API ROUTE_NOT_FOUND error
    const rootRes = await fetch(`http://127.0.0.1:${regPort}/`);
    const rootText = await rootRes.text();
    assert(
      !rootText.includes('ROUTE_NOT_FOUND'),
      'GET / does not return ROUTE_NOT_FOUND API error'
    );
  } finally {
    regServer.close();
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
