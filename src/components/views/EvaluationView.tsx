import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Filter,
  FileDown,
  Layers,
  Award,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  EvaluationCase,
  EvaluationRunResult,
  EvaluationReport,
  NAtlasHealth,
} from '../../../packages/shared/types.ts';
import {
  fetchEvaluationCases,
  fetchEvaluations,
  runEvaluation,
  clearEvaluations,
} from '../../lib/api.ts';

interface EvaluationViewProps {
  health: NAtlasHealth | null;
  onRunsUpdated?: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ health, onRunsUpdated }) => {
  const [cases, setCases] = useState<EvaluationCase[]>([]);
  const [runs, setRuns] = useState<EvaluationRunResult[]>([]);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningCaseId, setRunningCaseId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeLanguageFilter, setActiveLanguageFilter] = useState<string>('all');
  const [selectedRun, setSelectedRun] = useState<EvaluationRunResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const casesData = await fetchEvaluationCases();
      setCases(casesData.cases);

      const evalsData = await fetchEvaluations();
      setRuns(evalsData.runs);
      setReport(evalsData.report);
      if (evalsData.runs.length > 0 && !selectedRun) {
        setSelectedRun(evalsData.runs[0]);
      }
    } catch (err) {
      console.error('Failed to load evaluation data', err);
    }
  };

  const handleRunSingle = async (caseId: string) => {
    setLoading(true);
    setRunningCaseId(caseId);
    try {
      const res = await runEvaluation(caseId, false);
      await loadData();
      if (res.results.length > 0) {
        setSelectedRun(res.results[0]);
      }
      onRunsUpdated?.();
    } catch (err: unknown) {
      alert(`Evaluation failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setRunningCaseId(null);
    }
  };

  const handleRunAll = async () => {
    if (!confirm('Run complete 4-axis socio-legal benchmark suite across all cases?')) return;
    setLoading(true);
    setRunningCaseId('ALL');
    try {
      const res = await runEvaluation(undefined, true);
      await loadData();
      if (res.results.length > 0) {
        setSelectedRun(res.results[0]);
      }
      onRunsUpdated?.();
    } catch (err: unknown) {
      alert(`Evaluation run failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setRunningCaseId(null);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all session evaluation records?')) return;
    await clearEvaluations();
    setRuns([]);
    setReport(null);
    setSelectedRun(null);
    onRunsUpdated?.();
  };

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `natlas-evaluation-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    let md = `# N-ATLAS Forge — Empirical Evaluation Report\n`;
    md += `**Date:** ${report.createdAt}\n`;
    md += `**Target Model:** ${report.model}\n`;
    md += `**Provider Mode:** ${report.mode.toUpperCase()}${report.isMock ? ' (DEVELOPMENT MOCK)' : ''}\n`;
    md += `**Average Score:** ${report.averageScore} / 5.0\n`;
    md += `**Passed Benchmarks:** ${report.passedCases} / ${report.totalCases}\n\n`;
    md += `## 4-Axis Methodology\n${report.methodology}\n\n`;
    md += `## Benchmark Executions\n\n`;

    report.runs.forEach((r, idx) => {
      md += `### ${idx + 1}. [${r.caseId}] Score: ${r.aggregateScore}/5.0 (${r.status.toUpperCase()})\n`;
      md += `- **Prompt:** ${r.prompt}\n`;
      md += `- **Accuracy:** ${r.scores.accuracy}/5 | **Relevance:** ${r.scores.relevance}/5 | **Clarity:** ${r.scores.clarity}/5 | **Context:** ${r.scores.nigerian_context}/5\n`;
      md += `- **Latency:** ${r.latencyMs}ms\n`;
      md += `- **Response Snippet:**\n> ${r.response.slice(0, 250).replace(/\n/g, ' ')}...\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `natlas-evaluation-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCases = cases.filter((c) => {
    if (activeCategoryFilter !== 'all' && c.category !== activeCategoryFilter) return false;
    if (activeLanguageFilter !== 'all' && c.language !== activeLanguageFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Evaluation Lab & Benchmark Suite
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical 4-Axis Socio-Legal Evaluation Rubric (Accuracy, Relevance, Clarity, Nigerian Cultural Context).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report && (
            <>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                title="Download JSON Report"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                title="Download Markdown Report"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export MD</span>
              </button>
            </>
          )}

          {runs.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-rose-300 transition-colors"
              title="Clear runs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={handleRunAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading && runningCaseId === 'ALL' ? 'Running Benchmark Suite...' : 'Run All Benchmarks'}</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Ribbon (Only shown if evaluations have actually run) */}
      {runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center space-y-2">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            STATUS: NOT YET EVALUATED
          </div>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Per Rule 5, no synthetic scores are shown prior to execution. Run individual benchmark cases below or click{' '}
            <span className="text-amber-300 font-mono">Run All Benchmarks</span> to generate verified empirical results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Composite Score</div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
              {report?.averageScore.toFixed(1)} <span className="text-xs text-slate-500">/ 5.0</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Weighted 4-Axis Rubric</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Success Rate</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {report?.passedCases} / {report?.totalCases}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              {Math.round(((report?.passedCases || 0) / (report?.totalCases || 1)) * 100)}% Passing
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Mean Latency</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {report?.averageLatencyMs} <span className="text-xs text-slate-500">ms</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Per Autoregressive Run</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Evaluator Engine</div>
            <div className="text-sm font-bold font-mono text-purple-300 mt-2 truncate">
              Deterministic Rules
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">CAMA / VAT / Naira Check</div>
          </div>
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-slate-400 text-[11px]">CATEGORY:</span>
          {['all', 'sme_business', 'financial_literacy', 'civic_education', 'everyday_multilingual'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-colors ${
                activeCategoryFilter === cat
                  ? 'bg-slate-800 text-amber-300 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 text-[11px]">LANGUAGE:</span>
          {['all', 'en', 'pcm', 'yo', 'ha', 'ig'].map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLanguageFilter(lang)}
              className={`px-2 py-0.5 rounded text-[11px] uppercase font-mono transition-colors ${
                activeLanguageFilter === lang
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Test Cases on left, Inspection Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Benchmark List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase">
            Curated Benchmark Cases ({filteredCases.length})
          </div>

          <div className="space-y-2.5">
            {filteredCases.map((testCase) => {
              const run = runs.find((r) => r.caseId === testCase.id);
              const isRunning = loading && (runningCaseId === testCase.id || runningCaseId === 'ALL');
              const isSelected = selectedRun?.caseId === testCase.id;

              return (
                <div
                  key={testCase.id}
                  onClick={() => run && setSelectedRun(run)}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-amber-500/50 bg-slate-900/90 shadow-md'
                      : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
                  } ${run ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-300">
                          [{testCase.id}]
                        </span>
                        <span className="text-xs font-bold text-white">{testCase.title}</span>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {testCase.language}
                        </span>

                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            testCase.source === 'MODEL_CARD_REFERENCE'
                              ? 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                          }`}
                        >
                          {testCase.source === 'MODEL_CARD_REFERENCE'
                            ? 'MODEL CARD REFERENCE'
                            : 'FORGE ORIGINAL'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{testCase.prompt}</p>

                      {/* Criteria tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        {testCase.statutoryCitations?.map((cite) => (
                          <span
                            key={cite}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/30 text-amber-300 border border-amber-900/40"
                          >
                            § {cite}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Action / Score */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {run ? (
                        <div className="text-right">
                          <div
                            className={`font-mono text-sm font-bold flex items-center gap-1 ${
                              run.status === 'passed'
                                ? 'text-emerald-400'
                                : run.status === 'warning'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {run.status === 'passed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : run.status === 'warning' ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {run.aggregateScore.toFixed(1)} / 5.0
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {run.latencyMs} ms
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500 italic">Not run</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunSingle(testCase.id);
                        }}
                        disabled={isRunning}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isRunning ? 'Evaluating...' : 'Run'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Inspection Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Benchmark Result Inspector
              </h3>
              {selectedRun && (
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded uppercase font-semibold ${
                    selectedRun.status === 'passed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : selectedRun.status === 'warning'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {selectedRun.status}
                </span>
              )}
            </div>

            {selectedRun ? (
              <div className="space-y-4 text-xs">
                {/* 4-Axis Scorecard */}
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">
                    4-Axis Socio-Legal Rubric:
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">ACCURACY</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {selectedRun.scores.accuracy.toFixed(1)} / 5.0
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">RELEVANCE</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {selectedRun.scores.relevance.toFixed(1)} / 5.0
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">CLARITY</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {selectedRun.scores.clarity.toFixed(1)} / 5.0
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">NIGERIAN CONTEXT</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5">
                        {selectedRun.scores.nigerian_context.toFixed(1)} / 5.0
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automated Rule Diagnostics */}
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Automated Rule Diagnostics:
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Context Keywords Detected</span>
                    <span
                      className={
                        selectedRun.automatedChecks.hasNigerianContextKeywords
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      {selectedRun.automatedChecks.hasNigerianContextKeywords ? 'PASSED' : 'FLAGGED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Avoided Foreign Assumptions</span>
                    <span
                      className={
                        selectedRun.automatedChecks.avoidsProhibitedAssumptions
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      {selectedRun.automatedChecks.avoidsProhibitedAssumptions ? 'PASSED' : 'VIOLATED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Currency Grounding (Naira ₦)</span>
                    <span
                      className={
                        selectedRun.automatedChecks.currencyAccuracy ? 'text-emerald-400' : 'text-rose-400'
                      }
                    >
                      {selectedRun.automatedChecks.currencyAccuracy ? 'PASSED' : 'FLAGGED'}
                    </span>
                  </div>
                </div>

                {/* Response Text Preview */}
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Generated Model Response:
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 max-h-56 overflow-y-auto text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedRun.response}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1">
                  <span>Model: {selectedRun.model}</span>
                  <span>{selectedRun.latencyMs} ms</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-xs">Select any completed benchmark run on the left to inspect detailed 4-axis criteria breakdown.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
