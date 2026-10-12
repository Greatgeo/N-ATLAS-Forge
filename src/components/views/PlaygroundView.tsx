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
import { Button, Card, Badge, FormField, Textarea, Select, Toast } from '../ui/index.ts';

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
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

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
    setToastMessage({ type: 'success', message: 'Response copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadSample = (sample: typeof SAMPLE_PROMPTS[0]) => {
    setSystemPrompt(sample.system);
    setUserPrompt(sample.user);
    setLanguage(sample.lang);
    setShowPresetsMenu(false);
    setToastMessage({ type: 'info', message: `Loaded preset: ${sample.title}` });
  };

  const handleSaveTest = () => {
    if (!response) return;
    setToastMessage({ type: 'success', message: 'Test case bookmarked for current workbench session.' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Container */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <span className="font-mono text-[#38BDF8]">N-ATLaS</span> Inference Playground
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Autoregressive generation workbench for Nigeria's sovereign 8B model with token telemetry and hyperparameter controls.
          </p>
        </div>

        {/* Preset quick loader */}
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPresetsMenu(!showPresetsMenu)}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />}
            rightIcon={<ChevronDown className="w-3 h-3 text-[#94A3B8]" />}
          >
            Load Context Preset
          </Button>

          {showPresetsMenu && (
            <div className="absolute right-0 mt-1 w-80 rounded-xl bg-[#172235] border border-[#334155] shadow-2xl py-1 z-30">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[#CBD5E1] font-semibold border-b border-[#334155]">
                Nigerian Socio-Legal & Vernacular Presets
              </div>
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadSample(p)}
                  className="w-full text-left px-3 py-2 text-xs text-[#CBD5E1] hover:bg-[#1E293B] hover:text-[#38BDF8] transition-colors border-b border-[#334155]/60 last:border-0"
                >
                  <div className="font-semibold text-[#F8FAFC]">{p.title}</div>
                  <div className="text-[11px] text-[#94A3B8] truncate mt-0.5">{p.user}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Parameters & Input on left, Output on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Parameters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Controls Bar */}
          <Card variant="standard" padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#334155] pb-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-[#F8FAFC]">
                <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
                Hyperparameters
              </div>
              <div className="text-[11px] font-mono text-[#94A3B8]">Llama-3 Architecture</div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Language Selector */}
              <FormField label="TARGET LANGUAGE" id="lang-select">
                <Select
                  id="lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                >
                  <option value="en">English (Nigerian Socio-Legal Context)</option>
                  <option value="yo">Yoruba (Èdè Yorùbá)</option>
                  <option value="ha">Hausa (Harshen Hausa)</option>
                  <option value="ig">Igbo (Asụsụ Igbo)</option>
                  <option value="pcm">Nigerian Pidgin (Naija)</option>
                </Select>
              </FormField>

              {/* Temperature */}
              <div>
                <div className="flex justify-between text-[#94A3B8] mb-1.5">
                  <label htmlFor="temp-slider" className="font-mono text-[11px] font-medium text-[#CBD5E1]">
                    TEMPERATURE:
                  </label>
                  <span className="font-mono text-[#38BDF8] font-semibold tabular-nums">{temperature.toFixed(2)}</span>
                </div>
                <input
                  id="temp-slider"
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#1D4ED8] h-1.5 bg-[#1E293B] rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                />
                <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono mt-1">
                  <span>0.0 (Deterministic)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.5 (Creative)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <div className="flex justify-between text-[#94A3B8] mb-1.5">
                  <label htmlFor="tokens-slider" className="font-mono text-[11px] font-medium text-[#CBD5E1]">
                    MAX TOKENS:
                  </label>
                  <span className="font-mono text-[#38BDF8] font-semibold tabular-nums">{maxTokens}</span>
                </div>
                <input
                  id="tokens-slider"
                  type="range"
                  min="64"
                  max="2048"
                  step="64"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  className="w-full accent-[#1D4ED8] h-1.5 bg-[#1E293B] rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                />
              </div>
            </div>
          </Card>

          {/* System Instruction */}
          <Card variant="standard" padding="sm" className="space-y-2">
            <FormField
              label="SYSTEM INSTRUCTION (OPTIONAL)"
              helperText="Injected into the Llama-3 header as the primary conditioning prompt."
              id="sys-prompt"
            >
              <Textarea
                id="sys-prompt"
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="System prompt context..."
                className="font-mono text-xs text-[#CBD5E1]"
              />
            </FormField>
          </Card>

          {/* User Prompt */}
          <Card variant="standard" padding="sm" className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="user-prompt" className="font-mono uppercase text-[#CBD5E1] text-xs font-medium">
                User Prompt
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1"
              >
                Clear
              </button>
            </div>
            <Textarea
              id="user-prompt"
              rows={5}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter prompt in English, Pidgin, Yoruba, Hausa, or Igbo..."
              className="text-xs text-[#F8FAFC]"
            />
          </Card>

          {/* Run & Action Buttons */}
          <div className="flex items-center gap-2">
            {!loading ? (
              <Button
                variant="gradient"
                size="lg"
                onClick={handleRun}
                disabled={!userPrompt.trim()}
                className="flex-1"
                leftIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Run N-ATLaS Inference
              </Button>
            ) : (
              <Button
                variant="danger"
                size="lg"
                onClick={handleStop}
                className="flex-1"
                leftIcon={<Square className="w-4 h-4 fill-current" />}
              >
                Stop Generation
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              onClick={handleClear}
              title="Reset prompt"
              aria-label="Reset prompt"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Column: Output & Response Inspector */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex-1 rounded-xl border border-[#334155] bg-[#172235]/70 flex flex-col overflow-hidden min-h-[480px] shadow-lg">
            {/* Output Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155] bg-[#172235]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                    activeTab === 'text'
                      ? 'bg-[#1D4ED8] text-[#F8FAFC] font-semibold shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Output</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  disabled={!response}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                    activeTab === 'json'
                      ? 'bg-[#1D4ED8] text-[#F8FAFC] font-semibold shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>JSON Telemetry</span>
                </button>
              </div>

              {response && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={handleSaveTest}
                    leftIcon={<BookmarkPlus className="w-3 h-3 text-[#38BDF8]" />}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            {/* Mock Notice Bar if in Mock mode (Rule 2 & 16) */}
            {response?.isMock && (
              <div className="px-4 py-2.5 bg-amber-950/60 border-b border-amber-800/80 text-amber-200 text-xs font-mono flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-bold uppercase tracking-wider">DEVELOPMENT MOCK — NOT N-ATLaS OUTPUT:</span>
                  <span className="ml-1 opacity-90">
                    Synthetic test output generated for offline validation.
                  </span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 p-5 overflow-y-auto">
              {loading && (
                <div className="h-full flex flex-col items-center justify-center space-y-3 py-16 text-[#94A3B8]">
                  <div className="w-10 h-10 border-2 border-[#1D4ED8]/30 border-t-[#38BDF8] rounded-full animate-spin" />
                  <div className="text-xs font-mono text-[#F8FAFC]">
                    N-ATLaS autoregressive inference in progress...
                  </div>
                  <div className="text-[11px] text-[#94A3B8] font-mono">
                    Model: NCAIR1/N-ATLaS | Temp: {temperature}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs font-mono">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    INFERENCE FAILURE
                  </div>
                  <div className="text-xs text-rose-200 leading-relaxed font-mono whitespace-pre-wrap">{error}</div>
                  <div className="pt-2 text-[11px] text-[#94A3B8] border-t border-rose-900/40">
                    Tip: Diagnose this failure with the <span className="text-[#38BDF8] font-mono">Integration Doctor</span>.
                  </div>
                </div>
              )}

              {!loading && !error && !response && (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3 text-[#94A3B8]">
                  <Cpu className="w-10 h-10 text-[#334155]" />
                  <div className="text-xs font-mono text-[#CBD5E1]">Workbench Ready</div>
                  <p className="text-xs max-w-sm text-[#94A3B8] leading-relaxed">
                    Enter a prompt or select a Nigerian contextual preset and click <span className="text-[#38BDF8] font-mono">Run N-ATLaS Inference</span>.
                  </p>
                </div>
              )}

              {!loading && !error && response && activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="text-[#F8FAFC] text-sm whitespace-pre-wrap leading-relaxed font-sans selection:bg-[#1D4ED8]/30">
                    {response.text}
                  </div>
                </div>
              )}

              {!loading && !error && response && activeTab === 'json' && (
                <pre className="text-xs font-mono text-[#CBD5E1] bg-[#101827] p-4 rounded-lg overflow-x-auto border border-[#334155]">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
            </div>

            {/* Output Footer / Telemetry */}
            {response && (
              <div className="px-4 py-2.5 bg-[#101827] border-t border-[#334155] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#94A3B8]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[#CBD5E1]">
                    <Cpu className="w-3 h-3 text-[#38BDF8]" />
                    {response.model}
                  </span>
                  <span className="flex items-center gap-1 text-[#CBD5E1]">
                    <Clock className="w-3 h-3 text-[#60A5FA]" />
                    <span className="tabular-nums">{response.latencyMs}</span> ms
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {response.usage ? (
                    <span className="flex items-center gap-1 text-[#CBD5E1] tabular-nums">
                      <Hash className="w-3 h-3 text-indigo-400" />
                      In: {response.usage.inputTokens} | Out: {response.usage.outputTokens}
                    </span>
                  ) : (
                    <span className="text-[#64748B]">Usage tokens: N/A</span>
                  )}
                  <span className="text-[#94A3B8] tabular-nums">
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
