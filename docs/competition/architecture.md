# N-ATLAS Forge — Architecture Specification
**National AI Innovation Challenge (NAIC) 2026**
**Track:** Innovation & Enterprise | **Problem Statement:** PS1 — Developer Infrastructure
**Model Target:** `NCAIR1/N-ATLaS` (Official Sovereign Model by NCAIR / FMCIDE)

---

## 1. Executive Summary

Nigeria's sovereign foundational AI model, **NCAIR1/N-ATLaS**, represents a critical national milestone in localized intelligence, multilingual representation (Yoruba, Hausa, Igbo, Nigerian Pidgin, Nigerian English), and cultural preservation. However, developer adoption faces significant infrastructure friction:
1. High hardware barriers for local PyTorch 8B model inference.
2. Inconsistent client-side abstractions and prompt formats.
3. Lack of automated socio-legal evaluation suites (e.g. verifying CAMA 2020 or Naira VAT thresholds vs foreign US tax concepts).
4. Unclear integration debugging tooling for common CUDA OOM, token gating, and timeout errors.

**N-ATLAS Forge** solves this as a unified developer infrastructure workbench adhering to the continuous workflow:
**CONNECT → EXPLORE → TEST → EVALUATE → INTEGRATE**.

---

## 2. High-Level System Architecture

```
                  ┌────────────────────────────────────────┐
                  │          Developer Browser             │
                  │   (Playground / Lab / Doctor / SDK)    │
                  └──────────────────┬─────────────────────┘
                                     │ HTTP / SSE
                                     ▼
                  ┌────────────────────────────────────────┐
                  │           Forge API Server             │
                  │           (Express / Node)             │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                  ┌────────────────────────────────────────┐
                  │            NAtlasAdapter               │
                  │        (Strict Abstraction)            │
                  └───────┬──────────┴──────────┬──────────┘
                          │                     │
               ┌──────────▼─────────┐ ┌─────────▼─────────┐
               │ LocalNAtlasAdapter │ │ NAtlasApiAdapter  │
               └──────────┬─────────┘ └─────────┬─────────┘
                          │                     │
                          │ IPC (8008)          │ HTTPS / Bearer
                          ▼                     ▼
                  ┌───────────────┐     ┌───────────────┐
                  │ Local PyTorch │     │ Official      │
                  │ Worker Daemon │     │ Remote        │
                  │ (NCAIR1/      │     │ Inference     │
                  │  N-ATLaS 8B)  │     │ Endpoint      │
                  └───────────────┘     └───────────────┘
```

---

## 3. Core Architectural Principles

1. **No Invented APIs (Rule 1):** Forge never fabricates fictitious remote endpoints or credentials. Remote API mode requires explicit `NATLAS_API_URL` and `NATLAS_API_KEY`.
2. **Official Model Identification (Rule 2):** Built specifically for `NCAIR1/N-ATLaS`. No silent model substitution (e.g., swapping OpenAI or Gemini as fake N-ATLaS).
3. **Decoupled Adapter Layer (Rule 3):** Applications consuming `@n-atlas-forge/sdk` or the Forge REST API remain indifferent to whether inference occurs on an on-premise GPU workstation or an official sovereign cloud endpoint.
4. **Zero Frontend Secret Exposure (Rule 4):** All keys, tokens, and inference endpoints are gated on the server side.
5. **Empirical Evaluation Evidence (Rule 5):** No pre-fabricated benchmark metrics. Un-evaluated tasks explicitly display `NOT YET EVALUATED`.
