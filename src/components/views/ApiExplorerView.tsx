import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Play,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { NAtlasHealth } from '../../../packages/shared/types.ts';
import { API_BASE_URL } from '../../lib/api.ts';
import { Button, Card, Badge, FormField, Textarea, Select, Toast } from '../ui/index.ts';

interface ApiExplorerViewProps {
  health: NAtlasHealth | null;
}

type LangTab = 'typescript' | 'python_sdk' | 'curl' | 'transformers';

export const ApiExplorerView: React.FC<ApiExplorerViewProps> = ({ health }) => {
  const [langTab, setLangTab] = useState<LangTab>('typescript');
  const [copied, setCopied] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState<'/api/natlas/generate' | '/api/natlas/health' | '/api/capabilities'>('/api/natlas/generate');
  const [promptInput, setPromptInput] = useState('Explain CAMA 2020 annual returns for Nigerian small businesses.');
  const [executing, setExecuting] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const getSnippet = () => {
    switch (langTab) {
      case 'typescript':
        return `// 1. Install official SDK:
// npm install @n-atlas-forge/sdk

import { NAtlas } from "@n-atlas-forge/sdk";

// Initialize client (reads NATLAS_API_KEY from environment)
const client = new NAtlas({
  baseUrl: window.location.origin, // or your deployed Forge server
  apiKey: process.env.NATLAS_API_KEY,
  timeoutMs: 60000,
});

async function main() {
  const response = await client.generate({
    messages: [
      {
        role: "system",
        content: "You are N-ATLaS, Nigeria's Sovereign AI."
      },
      {
        role: "user",
        content: "${promptInput.replace(/"/g, '\\"')}"
      }
    ],
    temperature: 0.7,
    maxTokens: 512,
    language: "en" // "en" | "yo" | "ha" | "ig" | "pcm"
  });

  console.log("Model:", response.model);
  console.log("Latency:", response.latencyMs, "ms");
  console.log("Response text:", response.text);
}

main();`;

      case 'python_sdk':
        return `# Python REST Integration with Forge API
import requests
import json
import os

FORGE_API_URL = os.environ.get("FORGE_API_URL", "http://localhost:3000")
API_KEY = os.environ.get("NATLAS_API_KEY", "")

payload = {
    "messages": [
        {"role": "system", "content": "You are N-ATLaS, Nigeria's Sovereign AI."},
        {"role": "user", "content": "${promptInput.replace(/"/g, '\\"')}"}
    ],
    "temperature": 0.7,
    "maxTokens": 512,
    "language": "en"
}

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}
if API_KEY:
    headers["Authorization"] = f"Bearer {API_KEY}"

res = requests.post(f"{FORGE_API_URL}/api/natlas/generate", json=payload, headers=headers)
data = res.json()

print(f"Generated ({data.get('latencyMs')}ms):\\n{data.get('text')}")`;

      case 'curl':
        return `curl -X POST http://localhost:3000/api/natlas/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "${promptInput.replace(/'/g, "\\'")}"
      }
    ],
    "temperature": 0.7,
    "maxTokens": 512,
    "language": "en"
  }'`;

      case 'transformers':
        return `"""
Official PyTorch Transformers Loading for NCAIR1/N-ATLaS
Repository: https://huggingface.co/NCAIR1/N-ATLaS
"""
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = "NCAIR1/N-ATLaS"

print("Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

# Format using Llama-3 prompt structure
messages = [
    {"role": "user", "content": "${promptInput.replace(/"/g, '\\"')}"}
]
prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
outputs = model.generate(**inputs, max_new_tokens=512, temperature=0.7)
response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)

print(response)`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippet());
    setCopied(true);
    setToast({ type: 'success', message: 'Code snippet copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setApiResponse(null);
    try {
      let res;
      if (testEndpoint === '/api/natlas/generate') {
        res = await fetch(`${API_BASE_URL}/api/natlas/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: promptInput }],
            temperature: 0.7,
            maxTokens: 256,
          }),
        });
      } else {
        res = await fetch(`${API_BASE_URL}${testEndpoint}`);
      }
      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          const text = await res.text().catch(() => '');
          try {
            data = JSON.parse(text);
          } catch {
            data = { error: text || `HTTP ${res.status}: Non-JSON response received` };
          }
        }
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text.slice(0, 500) };
        }
      }
      setApiResponse({ status: res.status, data });
      if (res.ok) {
        setToast({ type: 'success', message: `Request succeeded with HTTP ${res.status}.` });
      } else {
        setToast({ type: 'error', message: `Request returned HTTP ${res.status}.` });
      }
    } catch (err: unknown) {
      setApiResponse({ status: 500, error: (err as Error).message });
      setToast({ type: 'error', message: `Execution failed: ${(err as Error).message}` });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            API & SDK Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade integration patterns for `@n-atlas-forge/sdk`, Python, and direct cURL interfaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://huggingface.co/NCAIR1/N-ATLaS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span>Hugging Face Model Card</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Code generator & live sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Generator Tabs */}
        <div className="lg:col-span-7 space-y-4">
          <Card variant="standard" padding="none" className="overflow-hidden">
            {/* Lang Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'typescript', label: 'TypeScript SDK' },
                    { id: 'python_sdk', label: 'Python REST' },
                    { id: 'curl', label: 'cURL' },
                    { id: 'transformers', label: 'PyTorch Local' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLangTab(tab.id)}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      langTab === tab.id
                        ? 'bg-slate-800 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="xs"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            {/* Code Body */}
            <div className="p-4 bg-slate-950/90 overflow-x-auto">
              <pre className="text-xs font-mono text-slate-200 leading-relaxed">
                {getSnippet()}
              </pre>
            </div>
          </Card>

          <Card variant="standard" padding="sm" className="text-xs space-y-1.5">
            <div className="font-mono text-amber-300 font-semibold uppercase text-[11px]">
              Anti-Lockin Guarantee (PS1 Architectural Rule)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Applications programmed against <span className="text-slate-200 font-mono">@n-atlas-forge/sdk</span> require zero architectural alterations when transitioning between local development and cloud endpoints. All communication routes through the unified <span className="text-slate-200 font-mono">NAtlasAdapter</span> boundary.
            </p>
          </Card>
        </div>

        {/* Right Column: Live Interactive Request Sandbox */}
        <div className="lg:col-span-5 space-y-4">
          <Card variant="standard" padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live Request Sandbox
              </div>
              <Badge tone="neutral" size="xs">
                HTTP / JSON
              </Badge>
            </div>

            {/* Endpoint Selector */}
            <FormField label="TARGET ENDPOINT" id="endpoint-select">
              <Select
                id="endpoint-select"
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value as any)}
                className="font-mono text-xs"
              >
                <option value="/api/natlas/generate">POST /api/natlas/generate (Autoregressive Generation)</option>
                <option value="/api/natlas/health">GET /api/natlas/health (Runtime & Model Status)</option>
                <option value="/api/capabilities">GET /api/capabilities (Sovereign Features & Linguistic Scope)</option>
              </Select>
            </FormField>

            {/* Prompt input if generate */}
            {testEndpoint === '/api/natlas/generate' && (
              <FormField label="PAYLOAD PROMPT" id="prompt-input">
                <Textarea
                  id="prompt-input"
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="font-mono text-xs"
                />
              </FormField>
            )}

            {/* Run Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleExecute}
              disabled={executing}
              isLoading={executing}
              className="w-full"
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              {executing ? 'Executing Request...' : 'Send Test Request'}
            </Button>

            {/* Live Response Panel */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>HTTP RESPONSE:</span>
                {apiResponse && (
                  <Badge tone={apiResponse.status === 200 ? 'connected' : 'disconnected'} size="xs">
                    HTTP {apiResponse.status}
                  </Badge>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 max-h-60 overflow-y-auto text-xs font-mono text-slate-300">
                {executing ? (
                  <div className="text-slate-500 italic py-4 text-center">Awaiting response from Forge...</div>
                ) : apiResponse ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                ) : (
                  <div className="text-slate-600 italic py-6 text-center">
                    Click "Send Test Request" to execute against the active Forge backend.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
