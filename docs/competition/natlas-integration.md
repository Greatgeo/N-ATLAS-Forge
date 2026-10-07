# N-ATLaS Integration Specification
**Model Target:** `NCAIR1/N-ATLaS`
**Hugging Face Hub Repository:** https://huggingface.co/NCAIR1/N-ATLaS

---

## 1. Official Model Profile

| Parameter | Specification |
|---|---|
| Repository | `NCAIR1/N-ATLaS` |
| Organization | National Centre for AI and Robotics (NCAIR) / FMCIDE Nigeria |
| Base Architecture | Llama-3-8B-Instruct Base |
| Context Window | 8,192 tokens |
| Native Weights Format | safetensors (bfloat16) |
| Target Linguistic Scope | English (Nigerian socio-cultural context), Yoruba, Hausa, Igbo, Nigerian Pidgin |

---

## 2. Prompt Template Specification

N-ATLaS inherits the Llama-3 special tokenization delimiters:

```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are N-ATLaS, the sovereign multilingual AI model of Nigeria.<|eot_id|><|start_header_id|>user<|end_header_id|>

Explain CAMA 2020 annual returns for small business.<|eot_id|><|start_header_id|>assistant<|end_header_id|>

```

Trailing stop tokens `<|eot_id|>` and `<|end_of_text|>` are cleanly trimmed by Forge before output delivery to client SDKs.

---

## 3. Local Inference Runtime Setup

### Prerequisites
- Python 3.10+
- PyTorch with CUDA 12.1+ (or Apple Metal MPS / CPU fallback)
- 16GB+ VRAM for bfloat16, or 6GB–8GB VRAM with 4-bit NF4 quantization

### Worker Daemon Launch
```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install PyTorch & Transformers
pip install torch transformers accelerate bitsandbytes

# 3. Authenticate with Hugging Face (accept NCAIR1/N-ATLaS license)
huggingface-cli login

# 4. Launch daemon bridge
python scripts/run_natlas_worker.py --port 8008 --model NCAIR1/N-ATLaS
```

The daemon hosts internal endpoints:
- `GET /health` -> reports model status, CUDA device, and memory usage.
- `POST /generate` -> executes autoregressive token generation.
