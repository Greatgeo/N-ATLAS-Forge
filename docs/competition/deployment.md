# N-ATLAS Forge — Deployment Architecture
**Target:** Hybrid Sovereign Architecture (Decoupled Web Tier + Dedicated Inference Tier)

---

## 1. Decoupled Tier Architecture

In accordance with Rule 36:
- **Web & API Tier:** Node.js / Express + React SPA (deployable to cloud container, Cloud Run, VPS, or Vercel with server routes).
- **Inference Runtime Tier:** Dedicated GPU instance (Ubuntu 22.04 LTS, NVIDIA A10G / L4 / RTX 4090 / A100) running `scripts/run_natlas_worker.py`.

```
                    Internet Users
                          │
                          ▼
            [Forge Web & API Container]
             Port: 3000 (Node / Express)
                          │
                          │ Internal Private VPC / WireGuard
                          ▼
             [N-ATLaS PyTorch Worker]
            Port: 8008 (CUDA Device)
            Model: NCAIR1/N-ATLaS
```

---

## 2. Environment Configuration Matrix

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | number | 3000 | Web/API listening port |
| `NATLAS_MODE` | enum (`local` \| `api` \| `mock`) | `local` | Primary inference routing provider |
| `NATLAS_MODEL_ID` | string | `NCAIR1/N-ATLaS` | Official Hugging Face repo tag |
| `NATLAS_API_URL` | string | (empty) | Remote endpoint URL when `NATLAS_MODE=api` |
| `NATLAS_API_KEY` | string | (empty) | Remote Bearer token |
| `NATLAS_LOCAL_PORT` | number | 8008 | Local Python daemon IPC port |
| `NATLAS_TIMEOUT_MS` | number | 60000 | Inference execution timeout |
