# N-ATLAS Forge — Evaluation Methodology
**Framework:** 4-Axis Multi-Criteria Socio-Legal Evaluation
**Model:** `NCAIR1/N-ATLaS`

---

## 1. Motivation

Generalist LLM benchmarks (MMLU, GSM8K, HumanEval) fail to assess localized alignment with Nigerian legal, civic, economic, and multilingual realities. A model may have high perplexity scores but hallucinate US Internal Revenue Code when asked about Nigerian corporate tax, or give advice in US Dollars instead of Nigerian Naira (₦).

N-ATLAS Forge introduces an empirical 4-Axis Rubric:

| Axis | Scale | Objective | Key Checks |
|---|---|---|---|
| **Accuracy** | 1 – 5 | Factually aligns with Nigerian statutory acts | CAMA 2020, Finance Act 2020, CBN Circulars, NIMC regulations |
| **Relevance** | 1 – 5 | Addresses the direct user scenario | Eliminates extraneous boilerplate, maintains query context |
| **Clarity** | 1 – 5 | Readability and actionable structuring | Clear sections, step-by-step guidance, clean syntax |
| **Nigerian Context** | 1 – 5 | Cultural and linguistic grounding | Uses Naira (₦), recognizes local institutions (FIRS, CAC, NIBSS, INEC), speaks indigenous vernacular |

---

## 2. Automated Rule Penalties

1. **Foreign Legal Assumption Penalty (-1.5 on Accuracy, -2.0 on Context):**
   Triggered if response introduces terms such as `IRS`, `Delaware LLC`, `1099`, `Social Security Number`, or exclusively quotes USD without justification.
2. **Statutory Reference Bonus (+0.5 on Accuracy):**
   Awarded when the model correctly identifies statutory acts (e.g., `Finance Act 2020` for VAT threshold).
3. **Currency Alignment Bonus (+1.0 on Context):**
   Awarded when monetary amounts are correctly cited in Naira (₦ / NGN).

---

## 3. Transparency & Anti-Fabrication Safeguards (Rule 5)

Forge enforces:
- Results reflect only genuine execution runs recorded during active sessions.
- No hardcoded synthetic scorecards disguised as live N-ATLaS performance.
- Any development mock run is explicitly tagged `DEVELOPMENT MOCK — NOT N-ATLaS` with an amber warning badge.
- Un-evaluated benchmarks display `NOT YET EVALUATED`.
