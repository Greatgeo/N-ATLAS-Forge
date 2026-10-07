import React, { useState, useRef } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Cpu,
  Hash,
  Sliders,
  ChevronDown,
  Sparkles,
  BookmarkPlus,
  Code,
  FileText,
} from 'lucide-react';
import {
  GenerateResponse,
  SupportedLanguage,
  NAtlasHealth,
} from '../../../packages/shared/types.ts';
import { generateCompletion } from '../../lib/api.ts';

interface PlaygroundViewProps {
  health: NAtlasHealth | null;
}

const SAMPLE_PROMPTS = [
  {
    title: 'SME VAT Exemption (English)',
    lang: 'en' as SupportedLanguage,
    system: 'You are N-ATLaS, the sovereign AI model of Nigeria. Provide legally grounded business advice.',
    user: 'My provision store in Surulere generates around ₦15 million annually. Do I need to register for and remit Value Added Tax (VAT) with the FIRS?',
  },
  {
    title: 'NIBSS Instant Transfer Reversal (Pidgin)',
    lang: 'pcm' as SupportedLanguage,
    system: 'You are N-ATLaS. Answer in clear, everyday Nigerian Pidgin for market business owners.',
    user: 'I do bank transfer with USSD code to buy goods, dem debit my account but the seller no see the money. How dis NIBSS NIP thing dey work and how many days before bank return my money?',
  },
  {
    title: 'Yoruba Agricultural Advisory (Èdè Yorùbá)',
    lang: 'yo' as SupportedLanguage,
    system: 'You are N-ATLaS. Answer natively in grammatically correct Èdè Yorùbá.',
    user: 'Se alaye bi mo se le gbin agbado ni asiko ojo ati bi a se n toju ile lati ri ikore to dara.',
  },
  {
    title: 'Hausa Clean Water & Health (Harshen Hausa)',
    lang: 'ha' as SupportedLanguage,
    system: 'You are N-ATLaS. Answer natively in fluent Harshen Hausa.',
    user: 'Yi bayani a Harshen Hausa game da yadda za a tafasa ko tace ruwan sha don kauce wa cutar kwalara a unguwarmu.',
  },
  {
    title: 'Igbo Community Development (Asụsụ Igbo)',
    lang: 'ig' as SupportedLanguage,
    system: 'You are N-ATLaS. Answer natively in standard Asụsụ Igbo.',
    user: 'Kowaa n\'asusu Igbo uru ogbako obodo na mmemme mmepe bara n\'inye aka wuo ogige ogwu ma obu ulo akwukwo.',
  },
];

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ health }) => {
  const [systemPrompt, setSystemPrompt] = useState(
    'You are N-ATLaS, Nigeria\'s Sovereign AI Foundation Model (NCAIR1/N-ATLaS). Provide culturally grounded, socio-legally accurate responses.'
  );
  const [userPrompt, setUserPrompt] = useState(
    'Explain the requirements to register a Business Name with the Corporate Affairs Commission (CAC) under CAMA 2020.'
  );
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [savedNotification, setSavedNotification] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRun = async () => {
    if (!userPrompt.trim()) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const messages = [];
      if (systemPrompt.trim()) {
        messages.push({ role: 'system' as const, content: systemPrompt.trim() });
      }
      messages.push({ role: 'user' as const, content: userPrompt.trim() });

      const res = await generateCompletion({
        messages,
        temperature,
        maxTokens,
        language,
      });

      setResponse(res);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message || 'Generation failed');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUserPrompt('');
    setResponse(null);
    setError(null);
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadSample = (sample: typeof SAMPLE_PROMPTS[0]) => {
    setSystemPrompt(sample.system);
    setUserPrompt(sample.user);
    setLanguage(sample.lang);
  };

  const handleSaveTest = () => {
    if (!response) return;
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="font-mono text-amber-400">N-ATLaS</span> Inference Playground
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive prompt workbench for Nigeria's sovereign 8B model with token telemetry and parameter controls.
          </p>
        </div>

        {/* Preset quick loader */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Presets:</span>
          <div className="relative inline-block text-left group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Context Preset</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute right-0 mt-1 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-20 hidden group-hover:block hover:block">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSample(p)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-amber-300 transition-colors border-b border-slate-800/60 last:border-0"
                >
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.user}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters & Input on left, Output on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Parameters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Hyperparameters
              </div>
              <div className="text-[11px] font-mono text-slate-500">AutoModelForCausalLM</div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Language Selector */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">TARGET LANGUAGE</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50"
                >
                  <option value="en">English (Nigerian Socio-Legal Context)</option>
                  <option value="yo">Yoruba (Èdè Yorùbá)</option>
                  <option value="ha">Hausa (Harshen Hausa)</option>
                  <option value="ig">Igbo (Asụsụ Igbo)</option>
                  <option value="pcm">Nigerian Pidgin (Naija)</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-mono text-[11px]">TEMPERATURE:</span>
                  <span className="font-mono text-amber-300 font-semibold">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>0.0 (Deterministic)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.5 (Creative)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="font-mono text-[11px]">MAX TOKENS:</span>
                  <span className="font-mono text-amber-300 font-semibold">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="64"
                  max="2048"
                  step="64"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* System Instruction */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-mono uppercase text-slate-400 text-[11px]">System Instruction (Optional)</label>
              <span className="text-[10px] font-mono text-slate-500">Llama-3 Header</span>
            </div>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="System prompt context..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-amber-500/50 resize-y"
            />
          </div>

          {/* User Prompt */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-mono uppercase text-slate-400 text-[11px]">User Prompt</label>
              <button
                onClick={handleClear}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <textarea
              rows={6}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter prompt in English, Pidgin, Yoruba, Hausa, or Igbo..."
              className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50 resize-y"
            />
          </div>

          {/* Run & Action Buttons */}
          <div className="flex items-center gap-2">
            {!loading ? (
              <button
                onClick={handleRun}
                disabled={!userPrompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run N-ATLaS Inference</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Generation</span>
              </button>
            )}

            <button
              onClick={handleClear}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset prompt"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Output & Response Inspector */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col overflow-hidden min-h-[460px]">
            {/* Output Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    activeTab === 'text'
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Generated Output
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  disabled={!response}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    activeTab === 'json'
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-500 hover:text-slate-300 disabled:opacity-40'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  JSON Inspector
                </button>
              </div>

              {response && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Copy response"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSaveTest}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Bookmark this test"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Test</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification on save */}
            {savedNotification && (
              <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                Prompt and output saved to local test workbench session!
              </div>
            )}

            {/* Mock Notice Bar if in Mock mode (Rule 2 & 16) */}
            {response?.isMock && (
              <div className="px-4 py-2.5 bg-amber-950/80 border-b border-amber-800/80 text-amber-200 text-xs font-mono flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold uppercase tracking-wider">DEVELOPMENT MOCK — NOT N-ATLaS:</span>
                  <span className="ml-1 opacity-90">
                    This synthetic output is generated strictly for offline UI layout validation. It must not be cited as real sovereign AI inference.
                  </span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 p-5 overflow-y-auto">
              {loading && (
                <div className="h-full flex flex-col items-center justify-center space-y-3 py-16 text-slate-400">
                  <div className="relative">
                    <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    N-ATLaS is generating autoregressively...
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Model: NCAIR1/N-ATLaS | Temp: {temperature}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs font-mono">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    INFERENCE FAILURE
                  </div>
                  <div className="text-xs text-rose-200 leading-relaxed">{error}</div>
                  <div className="pt-2 text-[11px] text-slate-400 border-t border-rose-900/40">
                    Tip: Use the <span className="text-amber-300 font-mono">Integration Doctor</span> tab to diagnose this error.
                  </div>
                </div>
              )}

              {!loading && !error && !response && (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3 text-slate-500">
                  <Cpu className="w-10 h-10 text-slate-700" />
                  <div className="text-xs font-mono">Workbench Ready</div>
                  <p className="text-xs max-w-sm text-slate-400">
                    Enter a prompt or select a Nigerian contextual preset and click <span className="text-amber-300 font-mono">Run N-ATLaS Inference</span>.
                  </p>
                </div>
              )}

              {!loading && !error && response && activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="text-slate-100 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                    {response.text}
                  </div>
                </div>
              )}

              {!loading && !error && response && activeTab === 'json' && (
                <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
            </div>

            {/* Output Footer / Telemetry */}
            {response && (
              <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Cpu className="w-3 h-3 text-amber-400" />
                    {response.model}
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {response.latencyMs} ms
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {response.usage ? (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Hash className="w-3 h-3 text-purple-400" />
                      In: {response.usage.inputTokens} | Out: {response.usage.outputTokens}
                    </span>
                  ) : (
                    <span className="text-slate-500">Usage tokens: N/A in current stream</span>
                  )}
                  <span className="text-slate-500">
                    {new Date(response.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
