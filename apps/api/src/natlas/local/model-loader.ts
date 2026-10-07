/**
 * Official loading configuration for NCAIR1/N-ATLaS
 * Source: https://huggingface.co/NCAIR1/N-ATLaS
 */

export const OFFICIAL_MODEL_METADATA = {
  modelId: 'NCAIR1/N-ATLaS',
  organization: 'NCAIR (National Centre for AI and Robotics)',
  baseArchitecture: 'Llama-3-8B-Instruct Base',
  torchDtype: 'bfloat16',
  contextWindow: 8192,
  requiredVramGb: 16, // recommended for bfloat16, or 6GB with 4-bit NF4 quantization
  license: 'Llama 3 Community License / Sovereign AI Initiative',
  primaryFocus: 'Nigerian Socio-Cultural, Linguistic (Yoruba, Hausa, Igbo, Nigerian Pidgin, English) & Economic Context',
};

export function generatePythonWorkerScript(): string {
  return `"""
N-ATLaS Forge — Local Python/PyTorch Inference Bridge for NCAIR1/N-ATLaS
Official Repository: https://huggingface.co/NCAIR1/N-ATLaS
"""

import sys
import os
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = os.environ.get("NATLAS_MODEL_ID", "NCAIR1/N-ATLaS")
PORT = int(os.environ.get("NATLAS_WORKER_PORT", "8008"))

print(f"[N-ATLaS Worker] Initializing loader for {MODEL_ID}...")
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

print(f"[N-ATLaS Worker] Target Device: {device}, Precision: {dtype}")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
        device_map="auto" if device == "cuda" else None,
        low_cpu_mem_usage=True
    )
    is_ready = True
    print(f"[N-ATLaS Worker] Model {MODEL_ID} successfully loaded into memory.")
except Exception as e:
    is_ready = False
    init_error = str(e)
    print(f"[N-ATLaS Worker] Failed to load model weights: {init_error}", file=sys.stderr)

class InferenceHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200 if is_ready else 503)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status = {
                "status": "ready" if is_ready else "error",
                "model": MODEL_ID,
                "device": device,
                "cuda_available": torch.cuda.is_available(),
                "memory_allocated_mb": round(torch.cuda.memory_allocated() / (1024*1024), 2) if torch.cuda.is_available() else 0
            }
            if not is_ready:
                status["error"] = init_error
            self.wfile.write(json.dumps(status).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/generate":
            if not is_ready:
                self.send_response(503)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Model not loaded: {init_error}"}).encode("utf-8"))
                return

            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length).decode("utf-8"))
            prompt = body.get("prompt", "")
            temperature = max(0.01, float(body.get("temperature", 0.7)))
            max_new_tokens = int(body.get("max_tokens", 512))

            start_t = time.time()
            inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
            input_tokens = inputs["input_ids"].shape[1]

            with torch.no_grad():
                output_ids = model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    do_sample=temperature > 0.05,
                    pad_token_id=tokenizer.eos_token_id
                )

            gen_ids = output_ids[0][input_tokens:]
            generated_text = tokenizer.decode(gen_ids, skip_special_tokens=True)
            latency_ms = int((time.time() - start_t) * 1000)

            response = {
                "text": generated_text,
                "model": MODEL_ID,
                "latency_ms": latency_ms,
                "usage": {
                    "input_tokens": input_tokens,
                    "output_tokens": len(gen_ids)
                }
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), InferenceHandler)
    print(f"[N-ATLaS Worker] Listening on http://127.0.0.1:{PORT}")
    server.serve_forever()
`;
}
