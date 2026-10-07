#!/usr/bin/env python3
"""
N-ATLAS Forge — Local PyTorch/Transformers Inference Daemon
Model: NCAIR1/N-ATLaS (https://huggingface.co/NCAIR1/N-ATLaS)
National AI Innovation Challenge 2026 — PS1 Developer Infrastructure
"""

import os
import sys
import json
import time
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler

def main():
    parser = argparse.ArgumentParser(description="Run N-ATLaS Local Inference Worker")
    parser.add_argument("--model", default=os.environ.get("NATLAS_MODEL_ID", "NCAIR1/N-ATLaS"), help="Hugging Face model ID")
    parser.add_argument("--port", type=int, default=int(os.environ.get("NATLAS_LOCAL_PORT", "8008")), help="IPC port")
    parser.add_argument("--load-in-4bit", action="store_true", help="Enable bitsandbytes 4-bit NF4 quantization for <16GB VRAM")
    args = parser.parse_args()

    print(f"==================================================")
    print(f"  N-ATLAS Forge — Sovereign Model Worker Daemon")
    print(f"  Model: {args.model}")
    print(f"  Port:  {args.port}")
    print(f"==================================================")

    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
    except ImportError:
        print("[ERROR] PyTorch or Transformers is not installed.", file=sys.stderr)
        print("Please run: pip install torch transformers accelerate bitsandbytes", file=sys.stderr)
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[N-ATLaS] Hardware accelerator detected: {device}")

    try:
        print(f"[N-ATLaS] Loading tokenizer for {args.model}...")
        tokenizer = AutoTokenizer.from_pretrained(args.model)

        print(f"[N-ATLaS] Loading weights for {args.model}...")
        model_kwargs = {
            "device_map": "auto" if device == "cuda" else None,
            "low_cpu_mem_usage": True,
        }

        if args.load_in_4bit:
            from transformers import BitsAndBytesConfig
            model_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16
            )
        elif device == "cuda":
            model_kwargs["torch_dtype"] = torch.bfloat16
        else:
            model_kwargs["torch_dtype"] = torch.float32

        model = AutoModelForCausalLM.from_pretrained(args.model, **model_kwargs)
        is_ready = True
        init_error = None
        print(f"[N-ATLaS] Model {args.model} successfully loaded and ready for queries!")
    except Exception as e:
        is_ready = False
        init_error = str(e)
        print(f"[N-ATLaS ERROR] Failed to load model weights: {e}", file=sys.stderr)

    class InferenceHandler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            return # Suppress default access log noise

        def do_GET(self):
            if self.path == "/health":
                self.send_response(200 if is_ready else 503)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                status = {
                    "status": "ready" if is_ready else "error",
                    "model": args.model,
                    "device": device,
                    "cuda_available": torch.cuda.is_available(),
                    "memory_allocated_mb": round(torch.cuda.memory_allocated() / (1024*1024), 2) if torch.cuda.is_available() else 0
                }
                if init_error:
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
                    self.wfile.write(json.dumps({"error": f"Model failed to initialize: {init_error}"}).encode("utf-8"))
                    return

                content_len = int(self.headers.get("Content-Length", 0))
                payload = json.loads(self.rfile.read(content_len).decode("utf-8"))
                prompt = payload.get("prompt", "")
                temperature = max(0.01, float(payload.get("temperature", 0.7)))
                max_tokens = int(payload.get("max_tokens", 512))

                start_time = time.time()
                inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
                input_count = inputs["input_ids"].shape[1]

                with torch.no_grad():
                    output_ids = model.generate(
                        **inputs,
                        max_new_tokens=max_tokens,
                        temperature=temperature,
                        do_sample=temperature > 0.05,
                        pad_token_id=tokenizer.eos_token_id
                    )

                gen_tokens = output_ids[0][input_count:]
                output_text = tokenizer.decode(gen_tokens, skip_special_tokens=True)
                latency_ms = int((time.time() - start_time) * 1000)

                resp = {
                    "text": output_text,
                    "model": args.model,
                    "latency_ms": latency_ms,
                    "usage": {
                        "input_tokens": input_count,
                        "output_tokens": len(gen_tokens)
                    }
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(resp).encode("utf-8"))
            else:
                self.send_response(404)
                self.end_headers()

    server = HTTPServer(("127.0.0.1", args.port), InferenceHandler)
    print(f"[N-ATLaS] HTTP IPC bridge listening on http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[N-ATLaS] Worker shut down gracefully.")

if __name__ == "__main__":
    main()
