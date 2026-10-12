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
  Award,
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
import { Button, Card, Badge, MetricCard, Toast, ConfirmDialog } from '../ui/index.ts';

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

  // In-app notifications & dialogs replacing window.alert and window.confirm
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [confirmRunAllOpen, setConfirmRunAllOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

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
      setToast({ type: 'success', message: `Evaluation case [${caseId}] completed.` });
    } catch (err: unknown) {
      setToast({ type: 'error', message: `Evaluation failed: ${(err as Error).message}` });
    } finally {
      setLoading(false);
      setRunningCaseId(null);
    }
  };

  const executeRunAll = async () => {
    setConfirmRunAllOpen(false);
    setLoading(true);
    setRunningCaseId('ALL');
    try {
      const res = await runEvaluation(undefined, true);
      await loadData();
      if (res.results.length > 0) {
        setSelectedRun(res.results[0]);
      }
      onRunsUpdated?.();
      setToast({ type: 'success', message: `Completed full 4-axis benchmark suite (${res.results.length} cases).` });
    } catch (err: unknown) {
      setToast({ type: 'error', message: `Evaluation run failed: ${(err as Error).message}` });
    } finally {
      setLoading(false);
      setRunningCaseId(null);
    }
  };

  const executeClear = async () => {
    setConfirmClearOpen(false);
    await clearEvaluations();
    setRuns([]);
    setReport(null);
    setSelectedRun(null);
    onRunsUpdated?.();
    setToast({ type: 'info', message: 'Cleared all session evaluation records.' });
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
    setToast({ type: 'success', message: 'Evaluation JSON report exported.' });
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
    setToast({ type: 'success', message: 'Evaluation Markdown report exported.' });
  };

  const filteredCases = cases.filter((c) => {
    if (activeCategoryFilter !== 'all' && c.category !== activeCategoryFilter) return false;
    if (activeLanguageFilter !== 'all' && c.language !== activeLanguageFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Dialogs replacing native window.confirm() */}
      <ConfirmDialog
        isOpen={confirmRunAllOpen}
        title="Execute Benchmark Suite"
        message="This will run the deterministic 4-axis socio-legal evaluation suite across all curated cases. Proceed?"
        confirmLabel="Run All"
        variant="primary"
        isLoading={loading}
        onConfirm={executeRunAll}
        onCancel={() => setConfirmRunAllOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Clear Evaluation Records"
        message="Are you sure you want to clear all session benchmark runs and reset composite scores?"
        confirmLabel="Clear Records"
        variant="danger"
        onConfirm={executeClear}
        onCancel={() => setConfirmClearOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Evaluation Lab & Benchmark Suite
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical 4-Axis socio-legal evaluation rubric (Accuracy, Relevance, Clarity, Nigerian Cultural & Legal Context).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportJson}
                leftIcon={<Download className="w-3.5 h-3.5 text-amber-400" />}
              >
                Export JSON
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportMarkdown}
                leftIcon={<FileDown className="w-3.5 h-3.5 text-emerald-400" />}
              >
                Export MD
              </Button>
            </>
          )}

          {runs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
            >
              Clear
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmRunAllOpen(true)}
            disabled={loading}
            isLoading={loading && runningCaseId === 'ALL'}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Run All Benchmarks
          </Button>
        </div>
      </div>

      {/* Top Metrics Ribbon */}
      {runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center space-y-2">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            STATUS: NOT YET EVALUATED
          </div>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            All benchmark scores must originate from actual execution runs. Run individual benchmark cases below or click{' '}
            <span className="text-amber-300 font-mono">Run All Benchmarks</span> to generate verified empirical results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Composite Score"
            value={report?.averageScore !== undefined ? report.averageScore.toFixed(1) : '—'}
            unit="/ 5.0"
            subValue="Weighted 4-Axis Rubric"
            tone="amber"
          />
          <MetricCard
            label="Success Rate"
            value={report ? `${report.passedCases} / ${report.totalCases}` : '—'}
            subValue={`${Math.round(((report?.passedCases || 0) / (report?.totalCases || 1)) * 100)}% Passing Cases`}
            tone="green"
          />
          <MetricCard
            label="Mean Latency"
            value={report?.averageLatencyMs !== undefined ? report.averageLatencyMs : '—'}
            unit="ms"
            subValue="Per Autoregressive Run"
            tone="blue"
          />
          <MetricCard
            label="Evaluator Engine"
            value="Deterministic"
            subValue="CAMA / VAT / Naira Validation"
            tone="cyan"
          />
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <span className="font-mono text-slate-400 text-[11px] mr-1">CATEGORY:</span>
          {['all', 'sme_business', 'financial_literacy', 'civic_education', 'everyday_multilingual'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeCategoryFilter === cat
                  ? 'bg-slate-800 text-amber-300 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-slate-400 text-[11px] mr-1">LANGUAGE:</span>
          {['all', 'en', 'pcm', 'yo', 'ha', 'ig'].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLanguageFilter(lang)}
              className={`px-2 py-0.5 rounded text-[11px] uppercase font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
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

                      {/* Statutory citations */}
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
                            className={`font-mono text-sm font-bold flex items-center gap-1 tabular-nums ${
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
                          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                            {run.latencyMs} ms
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500 italic">Not run</span>
                      )}

                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunSingle(testCase.id);
                        }}
                        disabled={isRunning}
                        isLoading={isRunning}
                        leftIcon={<Play className="w-3 h-3 fill-current" />}
                      >
                        {isRunning ? 'Evaluating' : 'Run'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Inspection Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card variant="standard" padding="md" className="space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Benchmark Result Inspector
              </h3>
              {selectedRun && (
                <Badge
                  tone={
                    selectedRun.status === 'passed'
                      ? 'connected'
                      : selectedRun.status === 'warning'
                      ? 'mock'
                      : 'disconnected'
                  }
                  size="xs"
                >
                  {selectedRun.status}
                </Badge>
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
                      <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                        {selectedRun.scores.accuracy.toFixed(1)} / 5.0
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">RELEVANCE</div>
                      <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                        {selectedRun.scores.relevance.toFixed(1)} / 5.0
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">CLARITY</div>
                      <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                        {selectedRun.scores.clarity.toFixed(1)} / 5.0
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">NIGERIAN CONTEXT</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5 tabular-nums">
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
                  <span className="tabular-nums">{selectedRun.latencyMs} ms</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-xs">Select any completed benchmark run on the left to inspect detailed 4-axis criteria breakdown.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
