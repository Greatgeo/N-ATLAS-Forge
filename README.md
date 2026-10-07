# N-ATLAS Forge

> **Build. Test. Evaluate. Integrate with Nigeria's Sovereign AI.**
> Developed for the **National AI Innovation Challenge (NAIC) 2026**
> Track: **Innovation & Enterprise** | Problem Statement: **PS1 — Developer Infrastructure**
> Official Sovereign Model: [`NCAIR1/N-ATLaS`](https://huggingface.co/NCAIR1/N-ATLaS)

---

## 1. What is N-ATLAS Forge?

**N-ATLAS Forge** is an enterprise-grade developer infrastructure workbench designed specifically for Nigeria's sovereign 8-billion parameter foundation model, **`NCAIR1/N-ATLaS`** (created by the National Centre for AI and Robotics, NCAIR, under the Federal Ministry of Communications, Innovation and Digital Economy, FMCIDE).

Rather than presenting another generic chatbot, Forge equips Nigerian and pan-African software engineers with the critical developer tooling needed to adopt, test, evaluate, and integrate sovereign AI into mission-critical applications:

```
CONNECT ──► EXPLORE ──► TEST ──► EVALUATE ──► INTEGRATE
```

---

## 2. Why N-ATLAS Forge Exists (The Problem)

Adopting an 8B sovereign LLM poses real-world infrastructure obstacles for Nigerian engineering teams:
1. **Hardware Barriers:** Loading raw 16-bit PyTorch weights demands 16GB+ VRAM, leaving teams on consumer laptops or cloud CPU instances stranded with CUDA Out-Of-Memory errors.
2. **Evaluation Inadequacy:** Global academic benchmarks (e.g. MMLU, GSM8K) fail to detect hallucinations regarding Nigerian statutory frameworks (e.g. quoting US IRS statutes instead of CAMA 2020 or FIRS VAT thresholds, or quoting USD instead of Naira ₦).
3. **No Developer SDK Abstraction:** Teams write fragile, ad-hoc HTTP scripts directly to local ports, creating tight coupling to local environments.
4. **Integration Diagnostics Deficit:** When timeouts, gated repository token errors, or connection refusals occur, developers lack deterministic root-cause troubleshooting.

---

## 3. Architecture & Adapter Pattern

Forge is designed with strict adapter isolation (`NAtlasAdapter`) so frontend and consuming applications are decoupled from inference host topology:

```
                   Browser / Client Applications
                                 │
                                 ▼
                     Forge API (Express / Node)
                                 │
                                 ▼
                           NAtlasAdapter
                     ┌───────────┴───────────┐
                     ▼                       ▼
            LocalNAtlasAdapter       NAtlasApiAdapter
                     │                       │
           IPC Port 8008             HTTPS / Bearer
                     │                       │
                     ▼                       ▼
             PyTorch Worker             Official Cloud
           (NCAIR1/N-ATLaS 8B)             Endpoint
```

### Non-Negotiable Engineering Rules
- **Rule 1 (No Invented APIs):** Forge never fabricates fictitious URLs or endpoints. API mode requires valid user-specified `NATLAS_API_URL` and `NATLAS_API_KEY`.
- **Rule 2 (Official Model Identification):** Hardwired to `NCAIR1/N-ATLaS`. No silent substitution of OpenAI, Claude, Gemini, or Llama for N-ATLaS.
- **Rule 3 (Adapter Decoupling):** Unified JavaScript/TypeScript SDK `@n-atlas-forge/sdk` and REST contracts.
- **Rule 4 (Zero Secrets in Frontend):** All credentials, tokens, and endpoints remain strictly server-side.
- **Rule 5 (Empirical Evaluation):** Benchmark cards display actual execution runs only. Un-evaluated suites show `NOT YET EVALUATED`.

---

## 4. Key Capabilities & Modules

1. **Dashboard:** Live N-ATLaS runtime indicator (Connected, Not Connected, Mock), model identifier, latency, and session evaluation metrics.
2. **Inference Playground:** Interactive prompt testing with preset Nigerian socio-legal prompts, language presets (English, Èdè Yorùbá, Harshen Hausa, Asụsụ Igbo, Nigerian Pidgin), hyperparameter controls, token usage telemetry, and raw JSON response inspection.
3. **Evaluation Lab:** Reproducible 4-Axis socio-legal benchmark suite (Accuracy, Relevance, Clarity, Nigerian Cultural Context) with automated statutory rule checks (CAMA 2020, FIRS VAT ₦25M threshold, CBN NIBSS transfer guidelines, Naira currency verification), and exportable JSON/Markdown reports.
4. **API & SDK Explorer:** Interactive test sandbox generating code for TypeScript (`@n-atlas-forge/sdk`), Python, cURL, and PyTorch Transformers.
5. **Integration Doctor:** Deterministic troubleshooting workbench for CUDA Out-Of-Memory, Hugging Face license gating, proxy socket timeouts, and malformed JSON payloads.
6. **Technical Documentation:** Comprehensive architecture guides, Hugging Face model specs, and NAIC competition evidence logs.

---

## 5. Getting Started

### Installation
```bash
# Clone repository
git clone https://github.com/example/n-atlas-forge.git
cd n-atlas-forge

# Install Node dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default parameters:
```env
NATLAS_MODE=local
NATLAS_MODEL_ID=NCAIR1/N-ATLaS
NATLAS_TIMEOUT_MS=60000
PORT=3000
```

### Running Locally
```bash
# Start full-stack development server (Express API + Vite React UI)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Local PyTorch Worker Setup

To run inference directly with the official Hugging Face weights:
```bash
# 1. Install PyTorch & Transformers
pip install torch transformers accelerate bitsandbytes

# 2. Login to Hugging Face (accept license at https://huggingface.co/NCAIR1/N-ATLaS)
huggingface-cli login

# 3. Launch Forge PyTorch worker daemon
python scripts/run_natlas_worker.py --port 8008 --model NCAIR1/N-ATLaS

# For GPUs with <16GB VRAM, enable 4-bit NF4 quantization:
python scripts/run_natlas_worker.py --port 8008 --load-in-4bit
```

---

## 7. JavaScript / TypeScript SDK (`@n-atlas-forge/sdk`)

```typescript
import { NAtlas } from "@n-atlas-forge/sdk";

const client = new NAtlas({
  apiKey: process.env.NATLAS_API_KEY,
  timeoutMs: 60000,
});

const result = await client.generate({
  messages: [
    {
      role: "user",
      content: "Explain CAC business name registration requirements under CAMA 2020."
    }
  ],
  language: "en",
  temperature: 0.7,
  maxTokens: 512
});

console.log(result.text);
```

---

## 8. NAIC 2026 PS1 Competition Compliance

- **Problem Statement:** PS1 — Developer Infrastructure
- **Track:** Innovation & Enterprise
- **Beta Testing Status:** PENDING — At least two genuine external Nigerian beta testers are required prior to competition submission; detailed protocol in [`docs/competition/beta-testing.md`](docs/competition/beta-testing.md).
- **Evidence Structure:** Auditable directories under [`evidence/`](evidence/).

---

## 9. License

Licensed under the Apache-2.0 License. Model weights subject to the Llama 3 Community License and NCAIR Sovereign AI terms.
