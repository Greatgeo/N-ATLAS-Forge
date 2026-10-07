# N-ATLAS Forge — Technical Decisions Log
**NAIC 2026 — PS1: Developer Infrastructure**

---

### Decision 1: Strict Adapter Abstraction (`NAtlasAdapter`)
- **Context:** N-ATLaS can be loaded locally via PyTorch safetensors or reached via an official sovereign cloud endpoint once released.
- **Decision:** Built `NAtlasAdapter` interface decoupling the frontend and client SDKs from inference location. Applications written against Forge require zero refactoring when switching between local GPU testing and cloud deployment.

### Decision 2: Refusal to Invent Fictitious Endpoints (Rule 1)
- **Context:** Many developer prototypes fabricate pretend URLs or mock outputs disguised as sovereign model responses.
- **Decision:** Forge strictly adheres to Rule 1: No fake API endpoints. API mode requires valid user-specified `NATLAS_API_URL` and `NATLAS_API_KEY`. If unconfigured, a clear configuration error is surfaced.

### Decision 3: Deterministic Rule Engine for Evaluation Lab & Integration Doctor
- **Context:** Using an ungrounded secondary LLM to judge localized socio-legal questions introduces uncontrollable hallucinations and non-reproducibility.
- **Decision:** Built deterministic rule engines based on statutory benchmarks (CAMA 2020, Finance Act 2020, FIRS, CBN Circulars, Naira currency checks) and concrete hardware diagnostics (CUDA VRAM thresholds, bitsandbytes 4-bit quantization, Llama-3 special token formatting).

### Decision 4: Transparent Development Mock Watermarking (Rule 2 & 16)
- **Context:** Developers building UI tools on machines without 16GB GPUs need offline layout simulation.
- **Decision:** Mock adapter exists exclusively when explicitly configured with `NATLAS_MODE=mock`. Every mock generation prepends and appends prominent notices (`DEVELOPMENT MOCK — NOT N-ATLaS`) and displays amber warning indicators in the UI.
