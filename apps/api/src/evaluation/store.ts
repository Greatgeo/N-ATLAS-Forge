import { EvaluationRunResult, EvaluationReport } from '../../../../packages/shared/types.ts';
import { BENCHMARK_CASES } from './benchmark-cases.ts';

// In-memory evaluation store for genuine runs in the session
const evaluationResults: EvaluationRunResult[] = [];

export function addEvaluationResult(result: EvaluationRunResult): void {
  evaluationResults.unshift(result);
}

export function getAllEvaluationResults(): EvaluationRunResult[] {
  return [...evaluationResults];
}

export function getEvaluationResultById(id: string): EvaluationRunResult | undefined {
  return evaluationResults.find((r) => r.id === id);
}

export function clearEvaluationResults(): void {
  evaluationResults.length = 0;
}

export function generateEvaluationReport(): EvaluationReport | null {
  if (evaluationResults.length === 0) {
    return null;
  }

  const totalCases = evaluationResults.length;
  const passedCases = evaluationResults.filter((r) => r.status === 'passed').length;
  const averageScore =
    Math.round((evaluationResults.reduce((acc, r) => acc + r.aggregateScore, 0) / totalCases) * 10) / 10;
  const averageLatencyMs =
    Math.round(evaluationResults.reduce((acc, r) => acc + r.latencyMs, 0) / totalCases);

  const categoryMap: Record<string, { total: number; sum: number }> = {};
  for (const run of evaluationResults) {
    const testCase = BENCHMARK_CASES.find((c) => c.id === run.caseId);
    const cat = testCase?.category || 'general';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, sum: 0 };
    categoryMap[cat].total++;
    categoryMap[cat].sum += run.aggregateScore;
  }

  const categoryAverages: Record<string, number> = {};
  for (const cat in categoryMap) {
    categoryAverages[cat] = Math.round((categoryMap[cat].sum / categoryMap[cat].total) * 10) / 10;
  }

  const latestRun = evaluationResults[0];

  return {
    id: `report-${Date.now()}`,
    title: 'N-ATLaS Sovereign AI Context Evaluation Report',
    createdAt: new Date().toISOString(),
    model: latestRun.model,
    mode: latestRun.mode,
    isMock: latestRun.isMock,
    totalCases,
    passedCases,
    averageScore,
    categoryAverages,
    averageLatencyMs,
    methodology:
      '4-Axis deterministic rule & semantic evaluation rubric (Accuracy, Relevance, Clarity, Nigerian Socio-Legal Context [1-5 scale]). ' +
      'Rules strictly penalize foreign statutory hallucinations (e.g. IRS, US Dollar assumptions in Nigerian SME tax inquiries) ' +
      'and verify statutory alignment with CAMA 2020, Finance Act, and Central Bank of Nigeria mandates.',
    limitations:
      'Automated checks operate on curated high-impact civic, SME, and multilingual prompt sets. ' +
      'Evaluations run in mock mode carry explicit development disclaimers and must not be submitted as production sovereign AI benchmarks.',
    runs: [...evaluationResults],
  };
}
