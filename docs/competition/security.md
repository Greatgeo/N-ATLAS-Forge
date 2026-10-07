# N-ATLAS Forge — Security Specification
**Compliance:** Strict Rule 4 (Zero Secrets in Frontend) & Local Sovereign Data Residency

---

## 1. Threat Model & Mitigations

### 1.1 Credential Leakage Prevention (Rule 4)
- **Zero Frontend Secrets:** No Hugging Face tokens, Bearer keys, or internal ports are compiled into Vite client bundles.
- **Environment Isolation:** All sensitive credentials live in `.env` read exclusively by `server.ts`.
- **Sanitized Config Endpoint:** `/api/capabilities` and `/api/natlas/health` expose boolean flags (`apiKeyConfigured: true`) without returning token strings.

### 1.2 Prompt & Input Sanitization
- Input payloads are validated against max character limits to prevent buffer memory exhaustion.
- Control tokens (`<|begin_of_text|>`, `<|eot_id|>`) injected into raw user messages are stripped or neutralized before prompt construction.

### 1.3 Local Sovereign Data Residency
- When configured in `local` mode (`NATLAS_MODE=local`), all prompt tokens stay strictly within the local host boundary (`127.0.0.1:8008`). No prompt telemetry leaves national or enterprise servers.
