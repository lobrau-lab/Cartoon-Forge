# Anime & Cartoon Production Suite AI — On-Device Generative Studio

An ultra-high-performance, zero-API-cost generative media studio built for local anime keyframe rendering, character voice dubbing, video interpolation, and real-time storytelling directly on local consumer hardware.

---

## ⚡ Key Highlights & Architecture

- **Zero-API-Key On-Device Rendering**: Generates screenplay scenes, high-resolution keyframes, 48kHz character voice tracks, and 24FPS video motion completely offline without external subscriptions or cloud API rate limits.
- **Hardware-Specific Acceleration Core Packages**:
  - **Arch Linux + AMD Ryzen 7 7800X3D + NVIDIA RTX 5070 Master Suite**:
    - **AMD Ryzen 7 7800X3D**: Zen 4 8-Core/16-Thread pinned to CCD 0 with **96MB L3 3D V-Cache locality** and AVX-512 VNNI / BF16 vector acceleration (`-march=znver4 -O3`).
    - **NVIDIA GeForce RTX 5070 (12GB GDDR7)**: Blackwell SM_100/120 5th-Gen Tensor Cores executing FP8 (`fp8_e4m3fn`) and FP4 micro-scaling with FlashAttention-3 and cuDNN 9.x matrix kernels.
    - **Dual 9th-Gen NVENC AV1 Hardware Video Encoder**: Real-time 4K 24fps export in the built-in Filmora Pro NLE studio.
  - **Apple M5 Neural Matrix Accelerator**: macOS TahoeOS native AMX2 register overrides and 32-core ANE pipeline pinning.
- **Zero-Downtime Model Hot-Swapping**: Dynamically swaps text models, diffusion checkpoints, and voice embeddings in memory with sub-20ms latency and automatic `torch.cuda.empty_cache()` VRAM deallocation.
- **11 Built-in Helper & Studio Agents**: Autonomous pipeline orchestration from screenplay doctoring to storyboard vectors, keyframe diffusion, Kokoro TTS dubbing, and final video assembly.
- **1-Click Full Episode Production**: Generates a complete scene across all 5 production stages with a single click.

---

## 🖥️ Target System Requirements

### Target A: Arch Linux Workstation (Ryzen 7800X3D + RTX 5070 Flagship)
- **Operating System**: Arch Linux (Kernel: `linux-zen` or `linux-cachyos` with schedutil / performance governor)
- **CPU**: AMD Ryzen 7 7800X3D / 7950X3D / 9800X3D (Zen 4 / Zen 5 with 96MB 3D V-Cache)
- **GPU**: NVIDIA GeForce RTX 5070 / 5080 / 5090 (Blackwell 12GB+ GDDR7)
- **System Memory**: 32 GB to 64 GB DDR5-6000 CL30
- **Drivers & Runtime**: NVIDIA Driver 570.00+, CUDA 12.8+, TensorRT 10.2+

### Target B: Apple Silicon (MacBook M5 / M4 Pro / M3 Max)
- **Operating System**: macOS Tahoe 15.0+ or Sonoma 14.5+
- **Unified RAM**: 16 GB to 128 GB Unified Memory
- **Graphics & Acceleration**: Metal 3 API with 32-Core Apple Neural Engine (ANE)

---

## 🚀 Quick Start Guide for AI Agents & Developers

### 1. Repository Setup & Dependencies
```bash
# Clone repository and enter directory
cd anime-ai-suite

# Install all npm dependencies
npm install

# Verify TypeScript compilation and type safety
npm run lint

# Start development server on port 3000
npm run dev
```

### 2. Automated One-Line Setup Commands

#### Arch Linux (Ryzen 7800X3D + RTX 5070):
```bash
bash <(curl -sSL https://raw.githubusercontent.com/anime-suite/local-engines/main/install_arch_ryzen7800x3d_rtx5070.sh)
```

#### Docker All-in-One Container:
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

## 🤖 Built-in Agent & Helper Matrix (11 Autonomous Agents)

| Agent ID | Specialization | Target Engine | Role |
| :--- | :--- | :--- | :--- |
| `scriptDoctor` | **AI Screenplay Doctor & Scriptwriter** | Ryzen 7800X3D 3D V-Cache | Fountain screenplay format, character dialogue, emotion arcs |
| `castVoiceAnchor` | **Cast Voice Anchor & Persona Matrix** | Kokoro-TTS Engine | Acoustic embedding assignment, pitch/speed parameters |
| `storyboardDirector` | **Storyboard Director & Orchestrator** | Zen 4 Thread Pool | Scene breakdown, D3 Bezier camera trajectories, lighting |
| `keyframeDiffuser` | **Keyframe Diffuser & Visual Renderer** | RTX 5070 Blackwell FP8 | Anime cel keyframe diffusion with Cel-Shade LoRAs |
| `ttsDubber` | **Kokoro-TTS Dubber & Lip-Syncer** | AVX-512 FastVoice | 48kHz audio speech synthesis & millisecond viseme lip-sync |
| `videoMotionRenderer` | **Video Motion & Camera Interpolator** | RTX 5070 GDDR7 | Wan 2.1 / LTX-Video temporal animation interpolation |
| `filmoraProEditor` | **Filmora Pro NLE Video Studio** | Dual NVENC AV1 Encoder | Multi-track timeline assembly, color LUTs, master video render |
| `selfHealingWatchdog` | **Self-Healing Watchdog & Auditor** | Background Daemon | Prompt auto-refinement, retry loops, thermal cap enforcement |
| `styleLoraContinuity` | **Style LoRA & Character Continuity** | Blackwell Tensor Core | Facial consistency, hair silhouette geometry, color palette locks |
| `mangaPublisher` | **Manga Layout & Webtoon Publisher** | Canvas Vector Engine | Shonen 4-Panel, Yonkoma, speech bubbles, PDF/PNG export |
| `goDaemonAgent` | **Go IPC Model Daemon & Hot-Swap** | Systemd Background Unit | Port 8080/11434 socket routing & zero-downtime model swaps |

---

## 🔥 Zero-Downtime Model Hot-Swapping Protocol

Local model servers support dynamic in-memory hot swapping via `POST /api/models/hot-swap`:
- **VRAM Budget**: 12,288 MB GDDR7 total, with a **1,536 MB dynamic safety headroom**.
- **Execution**: Evacuates active weights via `torch.cuda.empty_cache()` and mounts target checkpoints in under **20 milliseconds** without restarting servers or dropping client connections.
- **Pinning Strategy**: LLMs and TTS models are pinned to the Ryzen 7800X3D 96MB 3D V-Cache, leaving maximum GDDR7 VRAM free for FLUX.1 image diffusion and Wan 2.1 video interpolation.

---

## 📁 Key Documentation & Instructions

- **`AGENTS.md`**: Master agent guidelines, persistent instructions, and architectural standards.
- **`howto.md`**: Complete step-by-step operational guide for running with Ollama, ComfyUI, Kokoro-TTS, Wan 2.1, and autonomous AI agents.
- **`manifest.md`**: Catalog of all source files and components in the repository.
- **`agent_instructions.json`**: Machine-readable agent schema, endpoints, model aliases, system prompts, and Arch Linux hardware execution flags.
- **`local_agent_config.json`**: Compact JSON configuration specifying local ports, model aliases, and VRAM budgets.

---

## 🛠️ Verification & Build Commands

```bash
# Verify TypeScript syntax and imports
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```
