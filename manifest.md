# Project File Manifest (`manifest.md`)

This document provides a comprehensive catalog of all files in the **Anime & Cartoon Production Suite AI** codebase, detailing their architectural role, key exports, and integration hooks.

---

## 📁 Root Configuration & Documentation Files

| File Path | Category | Role & Purpose |
| :--- | :--- | :--- |
| `AGENTS.md` | Agent Guidelines | Persistent system instructions, architectural standards, 11-agent matrix, hardware optimization flags, and verification protocols. |
| `README.md` | Documentation | Master setup manual, hardware architecture, target systems (Arch Linux + 7800X3D + RTX 5070, Apple M5), hot-loading rules, and one-click commands. |
| `howto.md` | Operational Guide | Step-by-step instructions for running with local AI models (Ollama, vLLM, ComfyUI, Kokoro-TTS, Wan 2.1), Arch Linux tuning, and production verification. |
| `manifest.md` | Manifest | This comprehensive catalog of all files and modules within the application. |
| `agent_instructions.json` | Agent Specification | Machine-readable schema, endpoint URLs, model aliases, hot-swap payloads, system prompts, and Arch Linux hardware flags for local autonomous agents. |
| `local_agent_config.json` | Agent Config | Compact JSON configuration specifying local ports, model aliases, VRAM budgets, and production verification flags. |
| `server.ts` | Backend Server | Express API server (Port 3000) providing proxying for AI LLM script generation, keyframe diffusion, Kokoro audio dubbing, video motion, hot-swapping, and Vite SPA middleware. |
| `metadata.json` | Platform Config | Application metadata, display name, description, frame permissions, and server-side capability definitions. |
| `.env.example` | Environment Variables | Template for environment variables (`GEMINI_API_KEY`, `LOCAL_OLLAMA_URL`, `LOCAL_COMFYUI_URL`, `LOCAL_TTS_URL`, etc.). |
| `.gitignore` | Git Config | Excludes `node_modules`, `dist/`, build artifacts, and local secrets from version control. |
| `package.json` | Node Manifest | Defines project metadata, build/dev/start/lint scripts, and all frontend and backend dependencies. |
| `package-lock.json` | Dependency Lock | Deterministic dependency tree lockfile. |
| `bun.lock` | Alternative Lockfile | Bun package manager dependency lockfile. |
| `tsconfig.json` | TypeScript Config | TypeScript compiler configuration targeting ESNext and React 19 JSX runtime. |
| `vite.config.ts` | Vite Config | Vite dev server and build configuration integrating Tailwind CSS 4 and React plugins. |
| `index.html` | Entry HTML | Main single-page application entry point with viewport meta tags and root DOM container. |
| `autobuild.sh` | Shell Script | Bash script for running automated builds, dependency checks, and dev server launches. |
| `go_backend_harness.go` | Go Daemon | Native Go IPC daemon for high-throughput model hot-swapping, socket monitoring, and background execution on Linux. |

---

## 📁 Core Application Engine (`/src`)

| File Path | Role & Purpose |
| :--- | :--- |
| `/src/main.tsx` | Application entry point that mounts the root React component onto the DOM with strict error boundaries. |
| `/src/App.tsx` | Main application shell orchestrating navigation tabs, active project state, floating HUDs, auto-saving, and view routing. |
| `/src/types.ts` | Global TypeScript definitions, data structures, and enums for projects, scenes, shots, keyframes, audio tracks, visemes, and hardware configurations. |
| `/src/index.css` | Global CSS styling importing Tailwind CSS 4 (`@import "tailwindcss";`) and custom scrollbar/canvas rules. |

---

## 📁 Hardware & Self-Healing Utilities (`/src/utils`)

| File Path | Role & Purpose |
| :--- | :--- |
| `/src/utils/hardwareEngine.ts` | On-device hardware detection, WebGPU/CUDA capability profiling, Ryzen 7800X3D 3D V-Cache pinning flags, RTX 5070 Blackwell FP8 settings, and benchmark routines. |
| `/src/utils/autoConnectRouter.ts` | Dynamic endpoint resolver that pings and routes requests to active local model servers (Ollama on 11434, ComfyUI on 7860, Kokoro on 8880, Go daemon on 8080). |
| `/src/utils/selfHealingEngine.ts` | Autonomous anomaly detection, prompt auto-refinement, retry loop management, and thermal throttling protection logic. |

---

## 📁 Sample Data & Presets (`/src/data`)

| File Path | Role & Purpose |
| :--- | :--- |
| `/src/data/sampleProjects.ts` | Pre-built anime and cartoon project templates (Cyberpunk Neon 2077, Mecha Eclipse, Fantasy Isekai) with complete scenes, shots, voice castings, and storyboard manifests. |

---

## 📁 Studio Components & Views (`/src/components`)

| Component File | Major Studio Functionality |
| :--- | :--- |
| `ActiveShotFloatingPanel.tsx` | Quick-access floating drawer displaying active shot details, camera angles, lighting, and action prompts. |
| `AudioSpectrumVisualizer.tsx` | Real-time audio waveform and frequency spectrum visualizer for dialogue playback and sound effects. |
| `AutoSaveDialog.tsx` | Modal dialog confirming background state snapshots and cloud/local persistence timestamps. |
| `BezierCameraPathEditor.tsx` | Interactive cubic Bezier curve editor for animating camera positions, tracking shots, pans, and dolly zooms. |
| `CastView.tsx` | Character cast manager for assigning voice anchors, acoustic traits, visual reference turnarounds, and personality vectors. |
| `CharacterTurnaroundSuite.tsx` | Multi-angle character model sheet generator (Front, 3/4 Left, Profile, Back) ensuring cross-scene visual consistency. |
| `D3CameraTrajectoryGraph.tsx` | D3.js powered 3D/2D vector space visualizer for scene camera choreography and focal point trajectories. |
| `DashboardView.tsx` | Production overview dashboard showing episode completion progress, active shot counts, render queue status, and system load. |
| `DubbingView.tsx` | Dialogue dubbing studio with live Kokoro-TTS generation, waveform scrubber, pitch/speed controls, and viseme inspector. |
| `EmotionRadarKeyframeStudio.tsx` | Recharts Radar Chart mapping 6 emotional dimensions per shot (*Intensity, Melodrama, Sorrow, Tension, Joy, Urgency*) with baseline vs keyframe comparison. |
| `ErrorBoundary.tsx` | React error boundary catching rendering exceptions and offering one-click state restoration. |
| `ExportView.tsx` | Master production exporter generating OpenTimelineIO (`.otio.json`), Fountain screenplay (`.fountain`), FCPX XML, and CMX 3600 EDL. |
| `FilmoraProVideoEditorView.tsx` | 4-quadrant professional NLE video editor with multi-track timeline (V1-V3, A1-A3), preview monitor, cut tools, and NVENC AV1 export. |
| `FoolproofAutoConnectHud.tsx` | Persistent HUD widget auto-detecting and displaying connection health for all local model backends. |
| `GoAgentHarnessTerminal.tsx` | Interactive terminal interface for monitoring and issuing commands to the Go IPC model daemon. |
| `Header.tsx` | Top studio navigation header with project switcher, view tabs, hardware status badge, and global action buttons. |
| `ImageFrameEditorView.tsx` | Photoshop/GIMP grade frame editor with multi-layer canvas, brushes, vector shapes, manga speedlines, screentone overlays, and LUT color grading. |
| `LocalLlamaMlxLinker.tsx` | Connection bridge and configuration panel for local Ollama, llama.cpp, and MLX model endpoints. |
| `LocalModelOperatorGuide.tsx` | Interactive hardware master guide for Arch Linux + 7800X3D + RTX 5070, zero-downtime hot-swapping, agent verification, and 1-click test suite. |
| `LocalRenderingPackagesView.tsx` | One-click installer and performance preset selector for Arch Linux, RTX 5070 Blackwell, Ryzen 7800X3D, and Apple M5. |
| `LocalSettingsView.tsx` | Settings configuration panel for custom API ports, VRAM limits, CPU thread count, and governor caps. |
| `MangaLayoutPublisher.tsx` | Manga page layout publisher supporting Shonen 4-Panel, Yonkoma, speech bubbles, halftone dots, and high-res PDF/PNG export. |
| `MlxBuiltInAgentsPanel.tsx` | Status panel for managing built-in agent pipelines and MLX/ONNX hardware execution targets. |
| `ModelVaultView.tsx` | Local AI model manager showing downloaded GGUF, SafeTensors, and ONNX weights with one-click load/unload controls. |
| `Mp4ExportModal.tsx` | Video export configuration modal with resolution selection (1080p, 4K), framerate (24fps, 60fps), and AV1/H.264 codec toggles. |
| `MultiTrackAudioTimeline.tsx` | Multi-track audio mixer and timeline synchronizing dialogue, music, and sound effects with sub-frame accuracy. |
| `NarrativeTreeGraph.tsx` | Visual node-based tree editor for branching storylines, episode story arcs, and scene transitions. |
| `OrchestraPositionPromptInjector.tsx` | Spatial audio and visual staging tool for positioning characters across the stereo/surround soundstage. |
| `OrchestratorView.tsx` | Full production orchestration dashboard for launching automated 5-stage batch generation pipelines. |
| `PrecisionScrubber.tsx` | High-precision timeline scrubber with frame-by-frame stepping (`HH:MM:SS:FF`) and audio scrubbing. |
| `SceneShotFlowVisualizer.tsx` | Visual flow graph connecting screenplay scenes to storyboard shots and render nodes. |
| `ScriptView.tsx` | Fountain-standard screenplay editor with AI script doctoring, auto-formatting, and dialogue cue generation. |
| `SelfHealingFloatingWidget.tsx` | Floating widget showing real-time self-healing watchdog alerts and automatic prompt recovery actions. |
| `SelfHealingModal.tsx` | Detailed diagnostic modal reviewing recovered errors, retry logs, and thermal protection history. |
| `SeriesBibleView.tsx` | Master world-building and character bible documenting lore, factions, rules, and visual style guides. |
| `StoryContinuanceView.tsx` | AI-assisted story continuator generating next scene beats and dialogue suggestions based on narrative context. |
| `StoryboardView.tsx` | Visual storyboard grid with thumbnail cards, camera angle selectors, shot reordering, and diffusion render triggers. |
| `StyleMatrixView.tsx` | Art style preset manager (Modern Anime, 90s Retro Cel, Cyberpunk Noir, Chibi) with custom LoRA weight sliders. |
| `TimelineView.tsx` | Master animation timeline showing shot durations, transition cues, and playback controls. |
| `VideoGeneratorView.tsx` | Video motion generator harnessing Wan 2.1 and LTX-Video to animate static keyframes into fluid 24fps motion clips. |
| `VoiceVaultView.tsx` | Audio sample library and voice cloning anchor manager for storing and previewing character vocal profiles. |
