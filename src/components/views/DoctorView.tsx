import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { NAtlasHealth, DiagnosticResult, NAtlasMode } from '../../../packages/shared/types.ts';
import { diagnoseIssue } from '../../lib/api.ts';

interface DoctorViewProps {
  health: NAtlasHealth | null;
}

const COMMON_ERROR_PRESETS = [
  {
    title: 'CUDA Out Of Memory (OOM)',
    mode: 'local' as NAtlasMode,
    error: 'torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 14.80 GiB (GPU 0; 11.76 GiB total capacity)',
    stack: 'File ".../transformers/models/llama/modeling_llama.py", line 1124, in forward\nRuntimeError: CUDA out of memory',
  },
  {
    title: 'Gated Repo / Invalid HF Token',
    mode: 'local' as NAtlasMode,
    error: 'HTTPError: 401 Client Error: Unauthorized for url: https://huggingface.co/NCAIR1/N-ATLaS/resolve/main/config.json. Access to model NCAIR1/N-ATLaS is restricted and you must accept the license agreement.',
    stack: 'huggingface_hub.utils._errors.GatedRepoError: 401 Client Error: Cannot access repository',
  },
  {
    title: 'Local Daemon Connection Refused',
    mode: 'local' as NAtlasMode,
    error: 'FetchError: request to http://127.0.0.1:8008/generate failed, reason: connect ECONNREFUSED 127.0.0.1:8008',
    stack: 'Error: connect ECONNREFUSED 127.0.0.1:8008\n    at TCPConnectWrap.afterConnect [as oncomplete]',
  },
  {
    title: '504 Inference Gateway Timeout',
    mode: 'api' as NAtlasMode,
    error: 'NAtlasTimeoutError: Autoregressive token generation timed out after 60000ms. Upstream model did not finish stream.',
    stack: 'HTTP 504 Gateway Timeout: Upstream response exceeded timeout budget',
  },
  {
    title: 'Missing Messages Parameter (400)',
    mode: 'api' as NAtlasMode,
    error: 'Invalid request: "messages" array is required and must not be empty.',
    stack: 'NAtlasRequestError: HTTP 400 Bad Request at NAtlas.generate()',
  },
];

export const DoctorView: React.FC<DoctorViewProps> = ({ health }) => {
  const [errorMessage, setErrorMessage] = useState(
    'FetchError: request to http://127.0.0.1:8008/generate failed, reason: connect ECONNREFUSED 127.0.0.1:8008'
  );
  const [stackTrace, setStackTrace] = useState(
    'Error: connect ECONNREFUSED 127.0.0.1:8008\n    at TCPConnectWrap.afterConnect'
  );
  const [mode, setMode] = useState<NAtlasMode>(health?.mode || 'local');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosticResult | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleDiagnose = async () => {
    if (!errorMessage.trim()) return;

    try {
      const result = await diagnoseIssue({
        errorMessage,
        stackTrace,
        mode,
        endpointUrl,
      });
      setDiagnosis(result);
    } catch (err) {
      console.error('Diagnosis failed', err);
    }
  };

  const handleLoadPreset = (preset: typeof COMMON_ERROR_PRESETS[0]) => {
    setErrorMessage(preset.error);
    setStackTrace(preset.stack);
    setMode(preset.mode);
    setDiagnosis(null);
  };

  const handleCopySnippet = () => {
    if (!diagnosis?.correctedConfigSnippet) return;
    navigator.clipboard.writeText(diagnosis.correctedConfigSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-400" />
            Integration Doctor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic diagnostic engine for CUDA OOM, Hugging Face gating, socket timeouts, and misconfigurations.
          </p>
        </div>

        {/* Security notice */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          Zero Secrets: Never paste real API keys or private tokens
        </div>
      </div>

      {/* Preset pills */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-slate-400 uppercase">
          Common Failure Scenarios (Click to Load):
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_ERROR_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(p)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Workbench & Diagnosis Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Diagnostics Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-bold text-slate-300">Diagnostic Parameters</span>
              <span className="text-[10px] font-mono text-slate-500">Deterministic Analyzer</span>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1 text-xs">
              <label className="font-mono text-slate-400 text-[11px]">ACTIVE INTEGRATION MODE</label>
              <div className="grid grid-cols-3 gap-2">
                {(['local', 'api', 'mock'] as NAtlasMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-1.5 rounded-md text-xs font-mono uppercase transition-colors ${
                      mode === m
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message Input */}
            <div className="space-y-1 text-xs">
              <label className="font-mono text-slate-400 text-[11px]">ERROR MESSAGE / STATUS</label>
              <textarea
                rows={4}
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="Paste runtime error message or HTTP status here..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/50 resize-y"
              />
            </div>

            {/* Optional Stack Trace */}
            <div className="space-y-1 text-xs">
              <label className="font-mono text-slate-400 text-[11px]">
                OPTIONAL STACK TRACE / TERMINAL OUTPUT
              </label>
              <textarea
                rows={3}
                value={stackTrace}
                onChange={(e) => setStackTrace(e.target.value)}
                placeholder="Optional stack trace..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-amber-500/50 resize-y"
              />
            </div>

            {/* Diagnose Trigger Button */}
            <button
              onClick={handleDiagnose}
              disabled={!errorMessage.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/10"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Diagnose Integration Failure</span>
            </button>
          </div>
        </div>

        {/* Right Column: Diagnostic Results */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5 min-h-[460px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-300">
                  Diagnostic Report
                </h3>
              </div>

              {diagnosis && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                      diagnosis.severity === 'critical'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                        : diagnosis.severity === 'high'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                        : 'bg-blue-950/60 text-blue-300 border-blue-800'
                    }`}
                  >
                    {diagnosis.severity}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {diagnosis.category}
                  </span>
                </div>
              )}
            </div>

            {diagnosis ? (
              <div className="space-y-4 text-xs">
                {/* Problem Identification */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    Identified Problem
                  </div>
                  <div className="text-sm font-bold text-white">{diagnosis.problem}</div>
                </div>

                {/* Likely Cause */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-amber-300 font-semibold">
                    Likely Root Cause
                  </div>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    {diagnosis.likelyCause}
                  </p>
                </div>

                {/* Step-by-step Verified Checks */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    Verified Engineering Checks:
                  </div>
                  <div className="space-y-1.5">
                    {diagnosis.verifiedChecks.map((chk, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800/60 text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{chk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Solution */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                    Actionable Resolution
                  </div>
                  <p className="text-slate-200 leading-relaxed bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40">
                    {diagnosis.suggestedSolution}
                  </p>
                </div>

                {/* Corrected Configuration / Code Snippet */}
                {diagnosis.correctedConfigSnippet && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                        Corrected Configuration / Snippet:
                      </span>
                      <button
                        onClick={handleCopySnippet}
                        className="flex items-center gap-1 text-[11px] font-mono text-amber-300 hover:text-amber-200"
                      >
                        {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSnippet ? 'Copied' : 'Copy Snippet'}</span>
                      </button>
                    </div>

                    <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
                      {diagnosis.correctedConfigSnippet}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-700" />
                <div className="text-xs font-mono">No Diagnosis Generated Yet</div>
                <p className="text-xs max-w-sm mx-auto text-slate-400">
                  Select a common error preset above or paste an integration error from your terminal to trigger deterministic root-cause analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
