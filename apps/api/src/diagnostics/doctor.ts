import { DiagnosticInput, DiagnosticResult } from '../../../../packages/shared/types.ts';

export function diagnoseIntegrationIssue(input: DiagnosticInput): DiagnosticResult {
  const msg = (input.errorMessage || '').toLowerCase();
  const stack = (input.stackTrace || '').toLowerCase();
  const full = `${msg} ${stack}`;

  // 1. CUDA & Local Hardware OOM / Driver Issues
  if (
    full.includes('out of memory') ||
    full.includes('cuda oom') ||
    full.includes('torch.cuda.outofmemoryerror') ||
    full.includes('cuda error')
  ) {
    return {
      category: 'CUDA_HARDWARE',
      severity: 'critical',
      problem: 'GPU Out Of Memory (OOM) loading NCAIR1/N-ATLaS 8B model weights.',
      likelyCause:
        'Loading an 8-billion parameter model in 16-bit precision requires ~16GB of VRAM. ' +
        'If your local GPU has 6GB–12GB VRAM, raw torch.bfloat16 unquantized loading exceeds device capacity.',
      verifiedChecks: [
        'Check available VRAM using `nvidia-smi` in terminal.',
        'Verify other processes (e.g. Chrome, Ollama, PyTorch notebooks) are not holding VRAM.',
        'Confirm bitsandbytes 4-bit (NF4) quantization package is installed if VRAM is < 16GB.',
      ],
      suggestedSolution:
        'Enable 4-bit quantization with `load_in_4bit=True` via bitsandbytes or use CPU offloading: ' +
        '`AutoModelForCausalLM.from_pretrained("NCAIR1/N-ATLaS", device_map="auto", load_in_4bit=True)`.',
      correctedConfigSnippet: `# Python Loader snippet with 4-bit quantization:
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import torch

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16
)

model = AutoModelForCausalLM.from_pretrained(
    "NCAIR1/N-ATLaS",
    quantization_config=quant_config,
    device_map="auto"
)`,
      relevantDocsUrl: 'https://huggingface.co/NCAIR1/N-ATLaS',
    };
  }

  // 2. Authentication Errors (401 / 403 / Invalid Token / Gate Access)
  if (
    full.includes('401') ||
    full.includes('403') ||
    full.includes('unauthorized') ||
    full.includes('forbidden') ||
    full.includes('invalid api key') ||
    full.includes('gated repo') ||
    full.includes('access denied') ||
    full.includes('huggingface token')
  ) {
    return {
      category: 'AUTHENTICATION',
      severity: 'critical',
      problem: 'Authentication Failure or Access Gate Restriction.',
      likelyCause:
        'The N-ATLaS model or remote endpoint rejected your credentials. ' +
        'If downloading NCAIR1/N-ATLaS from Hugging Face for the first time, your HF token may lack permissions ' +
        'or you have not accepted the model repository license conditions on Hugging Face.',
      verifiedChecks: [
        'Confirm you accepted terms at https://huggingface.co/NCAIR1/N-ATLaS.',
        'Verify `HF_TOKEN` or `NATLAS_API_KEY` is present in your environment (.env file).',
        'Verify token is not expired or malformed.',
        'Ensure token is NOT committed or exposed in client-side code.',
      ],
      suggestedSolution:
        'Generate a Read token from your Hugging Face settings, run `huggingface-cli login`, ' +
        'and set `HF_TOKEN=hf_...` in your server `.env`. For API mode, set `NATLAS_API_KEY`.',
      correctedConfigSnippet: `# .env
NATLAS_MODE=api
NATLAS_API_URL=https://your-natlas-endpoint.gov.ng
NATLAS_API_KEY=your_actual_token_here`,
      relevantDocsUrl: 'https://huggingface.co/NCAIR1/N-ATLaS',
    };
  }

  // 3. Timeout Errors (504 / ECONNRESET / ETIMEDOUT / Timeout)
  if (
    full.includes('timeout') ||
    full.includes('timed out') ||
    full.includes('etimedout') ||
    full.includes('esockettimedout') ||
    full.includes('504')
  ) {
    return {
      category: 'TIMEOUT',
      severity: 'high',
      problem: 'Inference Request Exceeded Allocated Timeout Window.',
      likelyCause:
        'Autoregressive generation for large outputs on CPU or heavily loaded GPUs can take 20–60 seconds. ' +
        'The Forge client or HTTP proxy closed the connection before token generation concluded.',
      verifiedChecks: [
        'Check your client timeout configuration (current default is usually 30s or 60s).',
        'Check max_tokens parameter: high max_tokens (>1024) significantly increases generation duration.',
        'Confirm whether inference is running on CPU instead of GPU.',
      ],
      suggestedSolution:
        'Increase `NATLAS_TIMEOUT_MS` to 120000 (2 minutes) in `.env` and consider reducing `maxTokens` to 256 for rapid interactive queries.',
      correctedConfigSnippet: `# .env
NATLAS_TIMEOUT_MS=120000`,
    };
  }

  // 4. Connection & Endpoint Refusal (ECONNREFUSED / 503 / 502 / ENOTFOUND)
  if (
    full.includes('econnrefused') ||
    full.includes('enotfound') ||
    full.includes('503') ||
    full.includes('502') ||
    full.includes('connection refused') ||
    full.includes('bad gateway') ||
    full.includes('failed to fetch')
  ) {
    if (input.mode === 'local') {
      return {
        category: 'ENDPOINT',
        severity: 'critical',
        problem: 'Local Python/PyTorch Worker is Not Running or Port 8008 is Unreachable.',
        likelyCause:
          'In local mode, Forge expects a running inference daemon on localhost:8008. ' +
          'The worker process has either stopped, crashed, or was never started.',
      verifiedChecks: [
        'Run `curl http://127.0.0.1:8008/health` to test worker status.',
        'Verify no firewall is blocking localhost IPC.',
        'Check worker terminal logs for Python traceback errors.',
      ],
      suggestedSolution:
        'Launch the official Python worker daemon: `python scripts/run_natlas_worker.py` ' +
        'or switch Forge mode to `mock` for offline UI testing.',
      correctedConfigSnippet: `# Terminal command to start local worker:
python scripts/run_natlas_worker.py --port 8008 --model NCAIR1/N-ATLaS`,
      };
    } else {
      return {
        category: 'ENDPOINT',
        severity: 'critical',
        problem: 'Remote N-ATLaS API Endpoint Unreachable.',
        likelyCause:
          'The URL configured in NATLAS_API_URL returned DNS resolution failure, network refusal, or 503 Service Unavailable.',
        verifiedChecks: [
          `Verify URL string in .env (current: ${input.endpointUrl || 'NOT SET'}).`,
          'Ensure URL includes http:// or https:// scheme without trailing typos.',
          'Verify SSL certificates on the remote host.',
        ],
        suggestedSolution:
          'Confirm that the remote host is accessible using `curl -I <NATLAS_API_URL>/health`. ' +
          'Check for network firewalls or VPN requirements.',
        correctedConfigSnippet: `# .env
NATLAS_MODE=api
NATLAS_API_URL=https://official-endpoint.domain/api`,
      };
    }
  }

  // 5. Rate Limiting (429 / Too Many Requests)
  if (full.includes('429') || full.includes('rate limit') || full.includes('too many requests')) {
    return {
      category: 'RATE_LIMIT',
      severity: 'medium',
      problem: 'API Rate Limit Quota Reached.',
      likelyCause:
        'The remote N-ATLaS endpoint enforces queries-per-minute (QPM) limits and your client exceeded the allocated threshold.',
      verifiedChecks: [
        'Inspect HTTP response headers for `Retry-After` or `x-ratelimit-reset`.',
        'Verify your application is not executing concurrent unthrottled benchmark loops.',
      ],
      suggestedSolution:
        'Implement exponential backoff with jitter in your SDK client calls. If executing batch evaluations, ' +
        'use a concurrency delay of at least 1500ms between calls.',
      correctedConfigSnippet: `// Exponential backoff configuration with @n-atlas-forge/sdk
const client = new NAtlas({
  apiKey: process.env.NATLAS_API_KEY,
  maxRetries: 3,
  retryDelayMs: 2000,
});`,
    };
  }

  // 6. Bad Request & Formatting (400 / Invalid JSON / Schema Mismatch)
  if (
    full.includes('400') ||
    full.includes('bad request') ||
    full.includes('invalid json') ||
    full.includes('unexpected token') ||
    full.includes('validation error')
  ) {
    return {
      category: 'REQUEST',
      severity: 'medium',
      problem: 'Malformed Request Payload or Invalid Parameters.',
      likelyCause:
        'The request sent to N-ATLaS does not match the expected message schema. ' +
        'Common causes include missing messages array, empty user content, or temperature outside the 0.0 - 2.0 range.',
      verifiedChecks: [
        'Ensure payload has format: { messages: [{ role: "user", content: "..." }] }',
        'Check that temperature is between 0.0 and 2.0 (recommended: 0.7)',
        'Verify maxTokens is a positive integer (e.g. 512)',
      ],
      suggestedSolution:
        'Ensure all messages adhere to the `{ role: "system"|"user"|"assistant", content: string }` contract.',
      correctedConfigSnippet: `// Proper payload structure:
{
  "messages": [
    { "role": "system", "content": "You are N-ATLaS, Nigeria's Sovereign AI." },
    { "role": "user", "content": "Explain CAC registration." }
  ],
  "temperature": 0.7,
  "maxTokens": 512
}`,
    };
  }

  // 7. General Configuration Error
  if (
    full.includes('missing') ||
    full.includes('config') ||
    full.includes('not set') ||
    full.includes('env')
  ) {
    return {
      category: 'CONFIGURATION',
      severity: 'high',
      problem: 'Missing or Inconsistent N-ATLaS Configuration.',
      likelyCause:
        'Required environment variables are not set for the current NATLAS_MODE.',
      verifiedChecks: [
        'Check `.env` file exists in project root.',
        'Ensure NATLAS_MODE is one of: "local", "api", "mock".',
      ],
      suggestedSolution:
        'Inspect your `.env` against `.env.example` and set appropriate keys.',
      correctedConfigSnippet: `# .env
NATLAS_MODE=local
NATLAS_MODEL_ID=NCAIR1/N-ATLaS
NATLAS_TIMEOUT_MS=60000`,
    };
  }

  // Fallback Unknown
  return {
    category: 'UNKNOWN',
    severity: 'medium',
    problem: 'Unclassified Integration Anomaly.',
    likelyCause:
      'The error message did not match standard patterns for CUDA, Auth, Connection, Timeout, or Bad Request.',
    verifiedChecks: [
      'Inspect complete server stdout and stderr logs.',
      'Test runtime health via GET /api/natlas/health.',
      'Check if the model repo NCAIR1/N-ATLaS is accessible.',
    ],
    suggestedSolution:
      'Check server terminal logs for stack trace. Run the health check endpoint `/api/natlas/health` ' +
      'to isolate whether the issue originates in Forge or the model loader.',
    relevantDocsUrl: 'https://huggingface.co/NCAIR1/N-ATLaS',
  };
}
