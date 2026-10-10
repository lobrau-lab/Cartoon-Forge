# How-To Guide: Running with Local AI Models & Autonomous Agents (`howto.md`)

This guide provides end-to-end instructions for running the **Anime & Cartoon Production Suite AI** entirely on local hardware using local Large Language Models (LLMs), diffusion engines, text-to-speech synthesizers, and autonomous AI agents.

---

## 📋 Table of Contents
1. [Hardware Requirements & Profiles](#1-hardware-requirements--profiles)
2. [Quick-Start 1-Click Setup (Arch Linux & Linux x86_64)](#2-quick-start-1-click-setup)
3. [Manual Step-by-Step Local Model Setup](#3-manual-step-by-step-local-model-setup)
   - [A. Text LLM (Ollama / vLLM / llama.cpp)](#a-text-llm-screenplay--dialogue)
   - [B. Keyframe Diffusion (ComfyUI / SD-WebUI / FLUX.1)](#b-keyframe-diffusion-image-generation)
   - [C. Kokoro-TTS Voice Dubbing & Lip-Sync Engine](#c-kokoro-tts-voice-dubbing--lip-sync)
   - [D. Video Motion Interpolation (Wan 2.1 / LTX-Video)](#d-video-motion-interpolation)
4. [Starting the Web Production Studio](#4-starting-the-web-production-studio)
5. [Configuring Studio Endpoints](#5-configuring-studio-endpoints)
6. [Executing the 1-Click Full Production Flow](#6-executing-the-1-click-full-production-flow)
7. [Zero-Downtime Model Hot-Swapping](#7-zero-downtime-model-hot-swapping)
8. [Connecting External AI Agents via JSON Protocols](#8-connecting-external-ai-agents)
9. [Troubleshooting & Performance Tuning](#9-troubleshooting--performance-tuning)

---

## 1. Hardware Requirements & Profiles

### 🚀 Recommended Flagship Profile: Arch Linux + Ryzen 7800X3D + RTX 5070
- **CPU**: AMD Ryzen 7 7800X3D (8 Cores / 16 Threads, 96MB 3D V-Cache, Zen 4)
- **GPU**: NVIDIA GeForce RTX 5070 (12GB GDDR7, Blackwell SM_100/120)
- **RAM**: 32 GB to 64 GB DDR5-6000 CL30
- **OS**: Arch Linux (`linux-zen` or `linux-cachyos` kernel)

### 🍎 Alternative Apple Silicon Profile: MacBook M5 / M4 Pro (32GB+ Unified RAM)
- **OS**: macOS Tahoe 15.0+ or Sonoma 14.5+
- **Framework**: MLX & Metal 3 API with 32-Core Apple Neural Engine (ANE)

---

## 2. Quick-Start 1-Click Setup

If you are on **Arch Linux** or a modern Linux distribution with an NVIDIA GPU and Ryzen CPU, you can bootstrap the entire local engine stack with a single command:

```bash
# Execute the tuned Arch Linux installer for Ryzen 7800X3D + RTX 5070:
bash <(curl -sSL https://raw.githubusercontent.com/anime-suite/local-engines/main/install_arch_ryzen7800x3d_rtx5070.sh)
```

Alternatively, run the containerized all-in-one suite via Docker:

```bash
docker run -d \
  --gpus all \
  --ipc=host \
  --ulimit memlock=-1 \
  -p 3000:3000 \
  -p 8080:8080 \
  -p 11434:11434 \
  -p 7860:7860 \
  -p 8880:8880 \
  ghcr.io/anime-suite/arch-ryzen7800x3d-rtx5070-suite:latest
```

---

## 3. Manual Step-by-Step Local Model Setup

If you prefer to configure each model server individually, follow the steps below:

### A. Text LLM (Screenplay & Dialogue)
We recommend **Ollama** or **vLLM** running `Qwen2.5-7B-Instruct` or `Llama-3.2-3B-Instruct`.

```bash
# 1. Install Ollama on Arch Linux
sudo pacman -S ollama

# 2. Pull the optimized anime screenplay model
ollama pull qwen2.5:7b-instruct-q4_K_M

# 3. Start the Ollama background service (Port 11434)
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" ollama serve
```

### B. Keyframe Diffusion (Image Generation)
We recommend **ComfyUI** or **SD-WebUI** running `FLUX.1-schnell` or `Animagine-XL-3.1`.

```bash
# 1. Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git && cd ComfyUI

# 2. Install dependencies with FlashAttention-3 & cuDNN 9
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
pip install -r requirements.txt

# 3. Start ComfyUI on Port 7860 with CUDA Blackwell FP8 support
python main.py --listen 0.0.0.0 --port 7860 --fp8_e4m3fn-unet --highvram
```

### C. Kokoro-TTS (Voice Dubbing & Lip-Sync)
We recommend **Kokoro-FastAPI** running on the Ryzen 7800X3D AVX-512 vector pool.

```bash
# 1. Clone Kokoro FastAPI server
git clone https://github.com/remsky/Kokoro-FastAPI.git && cd Kokoro-FastAPI

# 2. Install Python dependencies with ONNX Runtime GPU/CPU
pip install -r requirements.txt

# 3. Launch the voice synthesis server on Port 8880
python main.py --host 0.0.0.0 --port 8880
```

### D. Video Motion Interpolation (Wan 2.1 / LTX-Video)
```bash
# Launch the video generation server on Port 8080
python -m wan_video_server --port 8080 --model Wan2.1-I2V-1.3B --precision fp8
```

---

## 4. Starting the Web Production Studio

Clone and run the application repository:

```bash
# 1. Install Node.js dependencies
npm install

# 2. Verify TypeScript syntax
npm run lint

# 3. Start the studio server on Port 3000
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## 5. Configuring Studio Endpoints

1. Navigate to the **⚙️ Settings** tab in the top navigation bar.
2. Under **Local Model Ports & Endpoints**, verify the following defaults:
   - **Local Text LLM (Ollama)**: `http://127.0.0.1:11434`
   - **Local Keyframe Diffusion**: `http://127.0.0.1:7860`
   - **Local Voice Dubbing (TTS)**: `http://127.0.0.1:8880`
   - **Local Video Motion**: `http://127.0.0.1:8080`
3. Click **Test All Connections** to ping each endpoint. The status indicators will glow emerald green.

---

## 6. Executing the 1-Click Full Production Flow

To generate a complete anime episode scene from a single prompt:

1. Open the **⚡ Full Auto Orchestrator** tab.
2. Enter your episode concept (e.g., *"Cyberpunk samurai duel on a neon-lit rain rooftop"*).
3. Click **Launch 1-Click Full Production Flow**.
4. The system will autonomously execute the 5-stage pipeline:
   - **Stage 1**: `ScriptDoctorAgent` generates Fountain screenplay scenes and dialogue.
   - **Stage 2**: `StoryboardDirectorAgent` generates shot list and D3 Bezier camera trajectories.
   - **Stage 3**: `KeyframeDiffuserAgent` diffuses high-res keyframes on the RTX 5070.
   - **Stage 4**: `KokoroTTSDubberAgent` generates 48kHz dialogue tracks and phonetic viseme arrays.
   - **Stage 5**: `FilmoraProVideoEditorAgent` compiles the multi-track timeline and exports AV1 video and OpenTimelineIO package.

---

## 7. Zero-Downtime Model Hot-Swapping

To switch active models without restarting your local servers:

1. Open the **🖥️ Local Model Master Guide** tab.
2. Select the **Zero-Downtime Hot-Swapper** sub-tab.
3. Click **Hot-Swap Mount** on the desired model (e.g. `FLUX.1-Schnell-FP8` or `Qwen2.5-7B`).
4. The controller will send a `POST /api/models/hot-swap` request to evacuate the previous context using `torch.cuda.empty_cache()` and mount the new weights within **20 milliseconds**.

---

## 8. Connecting External AI Agents via JSON Protocols

Autonomous external agents (e.g. LangChain, CrewAI, AutoGen, or custom Python scripts) can drive the studio by consuming `agent_instructions.json` and `local_agent_config.json`:

```python
import requests
import json

STUDIO_URL = "http://127.0.0.1:3000"

# 1. Load agent instructions and schema
with open("agent_instructions.json") as f:
    agent_spec = json.load(f)

# 2. Trigger automated screenplay generation
script_payload = {
    "prompt": "Create an intense Shonen tournament finals scene.",
    "genre": "Shonen Action",
    "targetDurationSec": 60
}

response = requests.post(f"{STUDIO_URL}/api/script/generate", json=script_payload)
script_data = response.json()
print("Generated Scene Heading:", script_data.get("sceneHeading"))

# 3. Trigger 1-click full production flow
flow_payload = {
    "projectPrompt": "Cyberpunk Neon Tokyo Infiltration",
    "style": "Cyberpunk Noir"
}

flow_res = requests.post(f"{STUDIO_URL}/api/orchestrator/run-flow", json=flow_payload)
print("Production Status:", flow_res.json().get("status"))
```

---

## 9. Troubleshooting & Performance Tuning

### Issue 1: "CORS error or failed to fetch local endpoint"
- **Solution**: Ensure your local model server was started with CORS allowed (`OLLAMA_ORIGINS="*"` for Ollama, or `--listen 0.0.0.0` for ComfyUI). All browser requests are also proxied securely through the studio's `/api/*` endpoints.

### Issue 2: "CUDA Out of Memory (OOM) on 12GB RTX 5070"
- **Solution**: Enable dynamic hot-swapping in **Settings → Hardware Performance Presets → Arch + 7800X3D + RTX 5070**. This reserves 1.5GB of VRAM headroom and unloads dormant diffusion weights when running text or video generation.

### Issue 3: "Audio dubbing has no sound"
- **Solution**: Verify Kokoro-FastAPI is listening on `http://127.0.0.1:8880`. If unavailable, the studio will automatically fallback to high-quality browser Web Audio speech synthesis.
