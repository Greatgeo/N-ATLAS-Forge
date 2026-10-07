import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Key,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { NAtlasHealth, NAtlasMode } from '../../../packages/shared/types.ts';
import { updateSettings, fetchCapabilities } from '../../lib/api.ts';

interface SettingsViewProps {
  health: NAtlasHealth | null;
  onRefreshHealth: () => void;
  healthLoading: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  health,
  onRefreshHealth,
  healthLoading,
}) => {
  const [mode, setMode] = useState<NAtlasMode>(health?.mode || 'local');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [timeoutMs, setTimeoutMs] = useState(60000);
  const [localWorkerPort, setLocalWorkerPort] = useState(8008);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedWorkerCommand, setCopiedWorkerCommand] = useState(false);

  useEffect(() => {
    if (health?.mode) {
      setMode(health.mode);
    }
  }, [health]);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateSettings({
        mode,
        apiUrl: apiUrl.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        timeoutMs,
        localWorkerPort,
      });
      setSavedSuccess(true);
      onRefreshHealth();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      alert(`Failed to save settings: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const workerCmd = `python scripts/run_natlas_worker.py --port ${localWorkerPort} --model NCAIR1/N-ATLaS`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(workerCmd);
    setCopiedWorkerCommand(true);
    setTimeout(() => setCopiedWorkerCommand(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            Runtime Settings & Provider Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure inference execution routing between local PyTorch daemon, official remote API, or offline mock sandbox.
          </p>
        </div>

        <button
          onClick={onRefreshHealth}
          disabled={healthLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Test Connection</span>
        </button>
      </div>

      {/* Mode warning if mock is active */}
      {mode === 'mock' && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold uppercase font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            DEVELOPMENT MOCK MODE ACTIVE (Rule 2 & 16)
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed">
            Outputs generated in this mode are synthetic and labeled with prominent disclaimers. Mock results must never be presented as evidence of N-ATLaS sovereign model integration.
          </p>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Mode Selector Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="text-xs font-mono font-bold uppercase text-slate-300">
              Select Inference Provider Mode
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Local */}
              <div
                onClick={() => setMode('local')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  mode === 'local'
                    ? 'border-amber-500 bg-amber-950/20 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Cpu className={`w-5 h-5 ${mode === 'local' ? 'text-amber-400' : 'text-slate-500'}`} />
                  {mode === 'local' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <div className="font-bold text-xs text-white">Local PyTorch</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connects to on-premise GPU daemon on port {localWorkerPort}. Zero cloud cost.
                </p>
              </div>

              {/* API */}
              <div
                onClick={() => setMode('api')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  mode === 'api'
                    ? 'border-amber-500 bg-amber-950/20 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Server className={`w-5 h-5 ${mode === 'api' ? 'text-amber-400' : 'text-slate-500'}`} />
                  {mode === 'api' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <div className="font-bold text-xs text-white">Remote Endpoint</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connects to official cloud inference endpoint with Bearer authorization.
                </p>
              </div>

              {/* Mock */}
              <div
                onClick={() => setMode('mock')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  mode === 'mock'
                    ? 'border-amber-500 bg-amber-950/20 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Terminal className={`w-5 h-5 ${mode === 'mock' ? 'text-amber-400' : 'text-slate-500'}`} />
                  {mode === 'mock' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <div className="font-bold text-xs text-white">Development Mock</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Synthetic testbed for offline UI layout validation. Disclaimed in outputs.
                </p>
              </div>
            </div>
          </div>

          {/* Mode-Specific Parameters */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="text-xs font-mono font-bold uppercase text-slate-300">
              Runtime Parameters
            </div>

            <div className="space-y-4 text-xs">
              {/* Model ID */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                  HUGGING FACE MODEL REPO (Rule 2)
                </label>
                <input
                  type="text"
                  disabled
                  value="NCAIR1/N-ATLaS"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs cursor-not-allowed opacity-90"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Fixed to official sovereign repository. Substituting generic foreign models is strictly forbidden.
                </span>
              </div>

              {/* Local Port if local mode */}
              {mode === 'local' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                    LOCAL WORKER IPC PORT
                  </label>
                  <input
                    type="number"
                    value={localWorkerPort}
                    onChange={(e) => setLocalWorkerPort(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              {/* Remote API Settings if API mode */}
              {mode === 'api' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                      NATLAS_API_URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://official-natlas.ncair.gov.ng"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Rule 1: Forge does not invent endpoints. Enter the official government or enterprise endpoint URL.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                      NATLAS_API_KEY
                    </label>
                    <input
                      type="password"
                      placeholder="Bearer token or authorization key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Stored in server memory only. Never compiled into React frontend bundles (Rule 4).
                    </span>
                  </div>
                </>
              )}

              {/* Timeout */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                  INFERENCE TIMEOUT (MILLISECONDS)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Recommended: 60000ms for GPU, 120000ms for CPU inference.
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Applying Settings...' : 'Save & Apply Configuration'}</span>
              </button>

              {savedSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  Configuration updated successfully!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Local Worker Terminal helper */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Launch PyTorch Daemon
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              To activate the real local sovereign model, execute the worker script in your Python virtual environment:
            </p>

            <div className="relative group">
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                {workerCmd}
              </pre>
              <button
                onClick={handleCopyCmd}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Copy command"
              >
                {copiedWorkerCommand ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-1">
              Supports <code className="text-amber-300">--load-in-4bit</code> flag for consumer GPUs with &lt;16GB VRAM.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
