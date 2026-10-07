import {
  EvaluationCase,
  EvaluationRunResult,
  GenerateResponse,
} from '../../../../packages/shared/types.ts';

export function evaluateResponseAgainstCase(
  testCase: EvaluationCase,
  genResponse: GenerateResponse
): EvaluationRunResult {
  const text = genResponse.text.toLowerCase();

  // 1. Keyword check
  let keywordMatches = 0;
  const expected = testCase.expectedKeywords || [];
  for (const kw of expected) {
    if (text.includes(kw.toLowerCase())) {
      keywordMatches++;
    }
  }
  const keywordRatio = expected.length > 0 ? keywordMatches / expected.length : 1;

  // 2. Prohibited foreign assumption check (word-boundary safe)
  const avoidedTerms = testCase.mustAvoidTerms || [];
  let violatedAvoidance = false;
  for (const avoid of avoidedTerms) {
    // Avoid false positives (e.g. "IRS" matching inside "FIRS")
    const regex = new RegExp(`\\b${avoid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(genResponse.text)) {
      violatedAvoidance = true;
      break;
    }
  }

  // 3. Statutory citations check
  let statutoryMatch = true;
  if (testCase.statutoryCitations && testCase.statutoryCitations.length > 0) {
    statutoryMatch = testCase.statutoryCitations.some((cite) => {
      const simplified = cite.toLowerCase().replace(/[^a-z0-9]/g, '');
      const rawTextSimplified = text.replace(/[^a-z0-9]/g, '');
      return rawTextSimplified.includes(simplified) || text.includes(cite.toLowerCase().split(' ')[0]);
    });
  }

  // 4. Currency check: should use ₦ or Naira or NGN, not foreign currency exclusively
  const mentionsNaira = text.includes('naira') || text.includes('₦') || text.includes('ngn');
  const mentionsOnlyDollars = (text.includes('$') || text.includes('usd') || text.includes('dollars')) && !mentionsNaira;

  // Calculate 1 to 5 scores
  // Accuracy
  let accuracyScore = 3.0;
  if (keywordRatio >= 0.8) accuracyScore += 1.5;
  else if (keywordRatio >= 0.4) accuracyScore += 0.8;
  if (violatedAvoidance) accuracyScore -= 1.5;
  if (statutoryMatch) accuracyScore += 0.5;
  accuracyScore = Math.max(1, Math.min(5, Math.round(accuracyScore * 10) / 10));

  // Relevance
  let relevanceScore = 3.5;
  if (genResponse.text.length > 60) relevanceScore += 0.8;
  if (keywordRatio >= 0.5) relevanceScore += 0.7;
  relevanceScore = Math.max(1, Math.min(5, Math.round(relevanceScore * 10) / 10));

  // Clarity
  let clarityScore = 4.0;
  if (genResponse.text.length < 30) clarityScore = 2.0;
  if (genResponse.text.includes('\n') || genResponse.text.includes('-')) clarityScore += 0.5; // Good formatting
  clarityScore = Math.max(1, Math.min(5, Math.round(clarityScore * 10) / 10));

  // Nigerian Context
  let contextScore = 3.0;
  if (mentionsNaira) contextScore += 1.0;
  if (mentionsOnlyDollars) contextScore -= 2.0;
  if (violatedAvoidance) contextScore -= 1.0;
  if (keywordRatio >= 0.5) contextScore += 1.0;
  contextScore = Math.max(1, Math.min(5, Math.round(contextScore * 10) / 10));

  const totalRules = (expected.length > 0 ? 1 : 0) + (avoidedTerms.length > 0 ? 1 : 0) + (testCase.statutoryCitations ? 1 : 0) + 1;
  let passedRules = 0;
  if (keywordRatio >= 0.5) passedRules++;
  if (!violatedAvoidance) passedRules++;
  if (statutoryMatch) passedRules++;
  if (!mentionsOnlyDollars) passedRules++;

  const aggregateScore = Math.round(((accuracyScore + relevanceScore + clarityScore + contextScore) / 4) * 10) / 10;

  const status: 'passed' | 'warning' | 'failed' =
    violatedAvoidance ? 'failed' : aggregateScore >= 3.8 ? 'passed' : aggregateScore >= 2.5 ? 'warning' : 'failed';

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    caseId: testCase.id,
    timestamp: new Date().toISOString(),
    model: genResponse.model,
    mode: genResponse.mode,
    isMock: genResponse.isMock,
    prompt: testCase.prompt,
    response: genResponse.text,
    latencyMs: genResponse.latencyMs,
    scores: {
      accuracy: accuracyScore,
      relevance: relevanceScore,
      clarity: clarityScore,
      nigerian_context: contextScore,
    },
    aggregateScore,
    automatedChecks: {
      hasNigerianContextKeywords: keywordRatio >= 0.5,
      avoidsProhibitedAssumptions: !violatedAvoidance,
      hasStatutoryReference: statutoryMatch,
      currencyAccuracy: !mentionsOnlyDollars,
      passedRuleCount: passedRules,
      totalRuleCount: totalRules,
    },
    evaluatorType: 'automated_rule_engine',
    status,
  };
}
