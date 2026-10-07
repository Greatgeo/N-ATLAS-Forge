import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  ShieldCheck,
  Terminal,
  Activity,
  Code2,
  Lock,
  Server,
  Users,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const DocsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'getting-started' | 'architecture' | 'local-worker' | 'sdk' | 'eval-methodology' | 'beta-testers' | 'security' | 'naic-brief'>('getting-started');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Technical Documentation & Architecture
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive developer reference for NCAIR1/N-ATLaS integration, benchmark methodology, and NAIC PS1 compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Tree */}
        <div className="lg:col-span-4 space-y-1">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase px-3 py-1">
            Documentation Modules
          </div>

          {[
            { id: 'getting-started', label: '1. Quickstart & Integration', icon: Terminal },
            { id: 'architecture', label: '2. N-ATLaS Adapter Architecture', icon: Layers },
            { id: 'local-worker', label: '3. Local PyTorch 8B Daemon', icon: Cpu },
            { id: 'sdk', label: '4. @n-atlas-forge/sdk Client', icon: Code2 },
            { id: 'eval-methodology', label: '5. 4-Axis Evaluation Rubric', icon: Activity },
            { id: 'beta-testers', label: '6. NAIC Beta Testing Log', icon: Users },
            { id: 'security', label: '7. Secret Isolation & Residency', icon: Lock },
            { id: 'naic-brief', label: '8. PS1 Track Alignment', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-amber-300 border border-slate-700/80 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            );
          })}

          <div className="pt-4 px-3">
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-[11px] space-y-2">
              <div className="text-slate-300 font-semibold">Official Repository</div>
              <p className="text-slate-500">
                Official source of truth for weights and community tokenizers.
              </p>
              <a
                href="https://huggingface.co/NCAIR1/N-ATLaS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
              >
                huggingface.co/NCAIR1/N-ATLaS
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* 1. Quickstart */}
          {activeSection === 'getting-started' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">Quickstart & Developer Workflow</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">CONNECT → EXPLORE → TEST → EVALUATE → INTEGRATE</div>
              </div>

              <p>
                <strong>N-ATLAS Forge</strong> is the developer workbench for Nigeria's sovereign AI model, <code className="text-amber-300">NCAIR1/N-ATLaS</code>. It provides local daemon bridges, typed TypeScript SDKs, socio-legal benchmark suites, and deterministic diagnostics.
              </p>

              <h3 className="text-white font-bold text-sm pt-2">Step 1: Environment Setup</h3>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
{`# Copy example environment
cp .env.example .env

# Set active provider mode (local | api | mock)
NATLAS_MODE=local
NATLAS_MODEL_ID=NCAIR1/N-ATLaS
NATLAS_TIMEOUT_MS=60000`}
              </pre>

              <h3 className="text-white font-bold text-sm pt-2">Step 2: Choose Your Inference Mode</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong className="text-white">Local PyTorch Daemon (Recommended):</strong> Runs on your GPU machine using <code className="text-amber-300">scripts/run_natlas_worker.py</code>. Zero token charges, total data sovereignty.</li>
                <li><strong className="text-white">Official Remote API:</strong> Connects to an official cloud inference endpoint once provisioned by NCAIR or government agencies.</li>
                <li><strong className="text-white">Development Mock:</strong> Strictly for testing frontend layouts and tooling when GPU hardware is offline. Prominently watermarked per Rule 2.</li>
              </ul>
            </div>
          )}

          {/* 2. Architecture */}
          {activeSection === 'architecture' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">NAtlasAdapter Abstraction</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">Rule 3: Decoupled Provider Boundary</div>
              </div>

              <p>
                A core principle of Forge is that client applications must never be directly coupled to a single runtime mechanism. Whether N-ATLaS is accessed via a local PyTorch daemon or a remote cloud cluster, the interface contract remains identical.
              </p>

              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
{`interface NAtlasAdapter {
  health(): Promise<NAtlasHealth>;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  getModelInfo(): Promise<ModelInfo>;
}`}
              </pre>

              <h3 className="text-white font-bold text-sm pt-2">Request Lifecycle</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                <li><strong>Browser / Client SDK:</strong> Sends JSON payload containing user prompt and language parameter to <code className="text-amber-300">POST /api/natlas/generate</code>.</li>
                <li><strong>Forge API:</strong> Validates payload against character thresholds and sanitizes prompt delimiters.</li>
                <li><strong>NAtlasAdapter:</strong> Routes to <code className="text-amber-300">LocalNAtlasAdapter</code> or <code className="text-amber-300">NAtlasApiAdapter</code>.</li>
                <li><strong>Sovereign Runtime:</strong> Executes autoregressive token generation with Llama-3 special token handling.</li>
                <li><strong>Response Sanitization:</strong> Trims trailing stop tokens (<code className="text-slate-400">&lt;|eot_id|&gt;</code>) and measures true millisecond latency.</li>
              </ol>
            </div>
          )}

          {/* 3. Local Worker */}
          {activeSection === 'local-worker' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">Local PyTorch Worker Daemon</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">scripts/run_natlas_worker.py</div>
              </div>

              <p>
                To run <code className="text-amber-300">NCAIR1/N-ATLaS</code> on a local GPU or workstation, Forge includes a standalone Python daemon that serves an HTTP IPC bridge on port 8008.
              </p>

              <h3 className="text-white font-bold text-sm pt-2">Prerequisites</h3>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
{`pip install torch transformers accelerate bitsandbytes
huggingface-cli login # Requires accepting license on NCAIR1/N-ATLaS`}
              </pre>

              <h3 className="text-white font-bold text-sm pt-2">Hardware Sizing Guidelines</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-white">16GB+ VRAM (Full Precision)</div>
                  <div className="text-slate-400 mt-1">NVIDIA RTX 4090, A10G, A100. Uses bfloat16.</div>
                  <div className="font-mono text-amber-300 mt-2">python scripts/run_natlas_worker.py</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-white">6GB–12GB VRAM (4-bit NF4)</div>
                  <div className="text-slate-400 mt-1">RTX 3060, 4070, Apple Silicon MPS. Uses bitsandbytes.</div>
                  <div className="font-mono text-amber-300 mt-2">python scripts/run_natlas_worker.py --load-in-4bit</div>
                </div>
              </div>
            </div>
          )}

          {/* 4. SDK */}
          {activeSection === 'sdk' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">@n-atlas-forge/sdk JavaScript / TypeScript</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">Universal Client Library</div>
              </div>

              <p>
                The SDK provides a typed, promise-based interface with automatic retries, exponential backoff, and strict schema validation.
              </p>

              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
{`import { NAtlas } from "@n-atlas-forge/sdk";

const client = new NAtlas({
  apiKey: process.env.NATLAS_API_KEY,
  timeoutMs: 60000,
});

// Single turn prompt helper
const responseText = await client.prompt(
  "Explain VAT exemption under Nigerian Finance Act 2020",
  "en"
);

console.log(responseText);`}
              </pre>
            </div>
          )}

          {/* 5. Evaluation Methodology */}
          {activeSection === 'eval-methodology' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">4-Axis Socio-Legal Evaluation Rubric</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">Rule 5: No Fabricated Scores</div>
              </div>

              <p>
                Foreign benchmarks (like MMLU) fail to penalize American legal hallucinations in Nigerian contexts. Forge scores every benchmark run across 4 deterministic axes:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-300 font-mono">1. ACCURACY (1-5):</span>
                  <p className="text-slate-400 mt-0.5">Validates factual alignment with statutory texts: CAMA 2020, Finance Act 2020, CBN guidelines, NIMC regulations.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-300 font-mono">2. RELEVANCE (1-5):</span>
                  <p className="text-slate-400 mt-0.5">Measures direct responsiveness to user scenarios without redundant boilerplate.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-300 font-mono">3. CLARITY (1-5):</span>
                  <p className="text-slate-400 mt-0.5">Assesses readability, structured markdown bulleting, and accessibility.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-300 font-mono">4. NIGERIAN CONTEXT (1-5):</span>
                  <p className="text-slate-400 mt-0.5">Enforces Nigerian currency grounding (Naira ₦ / NGN), recognition of statutory agencies (FIRS, CAC, NIBSS, INEC), and vernacular preservation.</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Beta Testers */}
          {activeSection === 'beta-testers' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">NAIC PS1 External Beta Testing Log</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">Status: PENDING — Not Yet Conducted</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2">
                <div className="font-bold text-amber-300 font-mono uppercase tracking-wider">
                  BETA TESTING STATUS: PENDING
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Per strict competition integrity guidelines, no fictional or simulated beta testing results are presented. External beta testing has not yet been conducted.
                </p>
                <p className="text-slate-400">
                  <strong>Requirement:</strong> At least two genuine external beta testers from the Nigerian developer ecosystem are required to test the workbench prior to final submission.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white">Tester 1 Profile (Required):</div>
                  <p className="text-slate-400">
                    Independent backend/full-stack engineer integrating <code className="text-amber-300">@n-atlas-forge/sdk</code> into an external application.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white">Tester 2 Profile (Required):</div>
                  <p className="text-slate-400">
                    Independent AI/NLP researcher evaluating 4-axis socio-legal benchmarks across Nigerian indigenous languages.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. Security */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">Security & Secret Redaction</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">Rule 4: Zero Frontend Credentials</div>
              </div>

              <p>
                In strict adherence to Rule 4, no API keys, Hugging Face read tokens, or authorization headers are bundled into client-side JavaScript.
              </p>

              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>Server-side credential storage exclusively via <code className="text-amber-300">.env</code>.</li>
                <li>Public endpoints (<code className="text-slate-400">/api/capabilities</code>, <code className="text-slate-400">/api/natlas/health</code>) return booleans only (<code className="text-slate-400">apiKeyConfigured: true</code>) without leaking raw secret strings.</li>
                <li>Integration Doctor scrubs and rejects secrets in diagnostic payloads.</li>
              </ul>
            </div>
          )}

          {/* 8. NAIC Brief */}
          {activeSection === 'naic-brief' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">National AI Innovation Challenge 2026 Brief</h2>
                <div className="text-xs font-mono text-amber-400 mt-0.5">Track: Innovation & Enterprise | PS1: Developer Infrastructure</div>
              </div>

              <p>
                <strong>Problem Statement 1 (PS1)</strong> calls for high-leverage developer infrastructure that empowers Nigerian software engineers to build on top of sovereign AI foundation models.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white">Why N-ATLAS Forge Wins PS1:</div>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-300">
                  <li><strong>Authentic Integration:</strong> Targets the genuine <code className="text-amber-300">NCAIR1/N-ATLaS</code> model without fabricating non-existent APIs or substituting foreign LLMs.</li>
                  <li><strong>Concrete Tooling:</strong> Delivers browser playground, Python PyTorch daemon, TypeScript SDK, and automated evaluation engine in a single cohesive repository.</li>
                  <li><strong>Nigerian Context Grounding:</strong> Validates CAMA 2020, FIRS VAT limits, and Nigeria's major languages (Èdè Yorùbá, Harshen Hausa, Asụsụ Igbo, Naija Pidgin).</li>
                  <li><strong>External Validation Protocol:</strong> Structured protocol ready for engagement with at least two external Nigerian beta testers.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
