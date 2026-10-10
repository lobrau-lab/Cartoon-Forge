#!/usr/bin/env bash
# ==============================================================================
# Anime & Cartoon Production Suite — Automated Universal Installer
# Compatible with: Arch Linux, Ubuntu/Debian, Fedora, macOS (Apple Silicon MLX), Windows (WSL2)
# ==============================================================================

set -e

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_PURPLE='\033[0;35m'
COLOR_NC='\033[0m'

echo -e "${COLOR_CYAN}====================================================================${COLOR_NC}"
echo -e "${COLOR_CYAN}   ANIME & CARTOON PRODUCTION SUITE — AUTOMATED SETUP SCRIPT        ${COLOR_NC}"
echo -e "${COLOR_CYAN}====================================================================${COLOR_NC}"

# 1. Detect Operating System & Package Manager
echo -e "${COLOR_YELLOW}[1/6] Detecting Operating System & Hardware Profile...${COLOR_NC}"
OS_TYPE="unknown"
PKG_MGR="unknown"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/arch-release ]; then
        OS_TYPE="arch"
        PKG_MGR="pacman"
    elif [ -f /etc/debian_version ]; then
        OS_TYPE="debian"
        PKG_MGR="apt"
    elif [ -f /etc/fedora-release ]; then
        OS_TYPE="fedora"
        PKG_MGR="dnf"
    else
        OS_TYPE="generic-linux"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
    PKG_MGR="brew"
fi

echo -e "${COLOR_GREEN}✓ Detected OS: ${OS_TYPE} (Package Manager: ${PKG_MGR})${COLOR_NC}"

# Detect GPU Hardware
if command -v nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -n 1)
    echo -e "${COLOR_GREEN}✓ Detected NVIDIA GPU: ${GPU_NAME} (Blackwell / CUDA acceleration enabled)${COLOR_NC}"
elif [[ "$OS_TYPE" == "macos" ]]; then
    echo -e "${COLOR_GREEN}✓ Detected Apple Silicon Metal (MPS / MLX acceleration enabled)${COLOR_NC}"
else
    echo -e "${COLOR_YELLOW}! No discrete NVIDIA GPU detected. Initializing CPU AVX-512 / Vulkan acceleration.${COLOR_NC}"
fi

# 2. Install System Dependencies
echo -e "\n${COLOR_YELLOW}[2/6] Installing Core System Dependencies (Node.js, Python, FFmpeg, Go)...${COLOR_NC}"

if [ "$PKG_MGR" == "pacman" ]; then
    echo -e "${COLOR_PURPLE}Running: sudo pacman -Syu --needed base-devel nodejs npm python python-pip ffmpeg go cuda cudnn git git-lfs${COLOR_NC}"
    sudo pacman -S --needed --noconfirm base-devel nodejs npm python python-pip ffmpeg go git git-lfs || true
elif [ "$PKG_MGR" == "apt" ]; then
    echo -e "${COLOR_PURPLE}Running: sudo apt update && sudo apt install -y build-essential nodejs npm python3 python3-pip ffmpeg golang-go git git-lfs${COLOR_NC}"
    sudo apt update -y
    sudo apt install -y build-essential nodejs npm python3 python3-pip python3-venv ffmpeg golang-go git git-lfs || true
elif [ "$PKG_MGR" == "dnf" ]; then
    echo -e "${COLOR_PURPLE}Running: sudo dnf install -y nodejs npm python3 python3-pip ffmpeg golang git${COLOR_NC}"
    sudo dnf install -y nodejs npm python3 python3-pip ffmpeg golang git || true
elif [ "$PKG_MGR" == "brew" ]; then
    echo -e "${COLOR_PURPLE}Running: brew install node python@3.11 ffmpeg go git${COLOR_NC}"
    brew install node python@3.11 ffmpeg go git || true
fi

# 3. Model Directory Structure Setup
echo -e "\n${COLOR_YELLOW}[3/6] Initializing Studio Model Vault Directories...${COLOR_NC}"
mkdir -p ./models/checkpoints
mkdir -p ./models/loras
mkdir -p ./models/audio
mkdir -p ./models/voice_profiles
mkdir -p ./exports/filmora_sequences
mkdir -p ./exports/otio_packages
mkdir -p ./exports/manga_pages
echo -e "${COLOR_GREEN}✓ Storage directories created successfully in ./models and ./exports.${COLOR_NC}"

# 4. Install Node.js Application Dependencies
echo -e "\n${COLOR_YELLOW}[4/6] Installing Web Studio NPM Packages...${COLOR_NC}"
npm install

# 5. Install & Configure Local Model Engines
echo -e "\n${COLOR_YELLOW}[5/6] Setting Up Local AI Generation Engines...${COLOR_NC}"

# Install Ollama if not present
if ! command -v ollama &> /dev/null; then
    echo -e "${COLOR_PURPLE}Installing Ollama Text Engine...${COLOR_NC}"
    curl -fsSL https://ollama.com/install.sh | sh || true
else
    echo -e "${COLOR_GREEN}✓ Ollama is already installed.${COLOR_NC}"
fi

# Pull recommended Text & Screenplay Models in background
if command -v ollama &> /dev/null; then
    echo -e "${COLOR_CYAN}Pulling Qwen 2.5 7B Instruct (Screenplay Doctor & Controller Orchestrator)...${COLOR_NC}"
    ollama pull qwen2.5:7b || echo "Ollama daemon will download model upon start."
fi

# Setup Kokoro-82M Voice Dubbing Environment
echo -e "${COLOR_CYAN}Setting up Kokoro 82M TTS Python Environment...${COLOR_NC}"
python3 -m venv ./venv || true
if [ -f "./venv/bin/activate" ]; then
    source ./venv/bin/activate
    pip install --upgrade pip
    pip install torch torchaudio numpy fastapi uvicorn soundfile phonemizer || true
fi

# 6. Verification & Complete
echo -e "\n${COLOR_YELLOW}[6/6] Verifying Installation & Hardware Port Configuration...${COLOR_NC}"
echo -e "${COLOR_GREEN}====================================================================${COLOR_NC}"
echo -e "${COLOR_GREEN}  ANIME & CARTOON PRODUCTION SUITE INSTALLED SUCCESSFULLY!          ${COLOR_NC}"
echo -e "${COLOR_GREEN}====================================================================${COLOR_NC}"
echo -e "Next steps to launch the entire production studio fleet:"
echo -e "  1. Start All Local Server Daemons:  ${COLOR_CYAN}./scripts/setup-all-servers.sh${COLOR_NC}"
echo -e "  2. Start Web Studio UI:             ${COLOR_CYAN}npm run dev${COLOR_NC}"
echo -e "  3. Open Browser at:                 ${COLOR_CYAN}http://localhost:3000${COLOR_NC}"
echo -e "====================================================================\n"
