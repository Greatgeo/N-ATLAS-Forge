/**
 * N-ATLAS Forge — Comprehensive Unit & Integration Test Suite
 * Tests: Errors, Adapters, Prompt Template, Evaluator Engine, Diagnostic Doctor, SDK
 */

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
