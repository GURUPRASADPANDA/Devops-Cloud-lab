#!/usr/bin/env bash
# install.sh — One-command setup for DevOps Sandbox
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}"
cat <<'EOF'
  ____             ___            ____                    _ _               
 |  _ \  _____   _/ _ \ _ __  __|  _ \  ___ __ _ _  __ | | |__   _____  __
 | | | |/ _ \ \ / / | | | '_ \/ __| |_  / __/ _` | '_ \| | '_ \ / _ \ \/ /
 | |_| |  __/\ V /| |_| | |_) \__ \___| (_| (_| | | | | | |_) | (_) >  < 
 |____/ \___| \_/  \___/| .__/|___/     \___\__,_|_| |_|_|_.__/ \___/_/\_\
                         |_|                                                 
EOF
echo -e "${RESET}"

echo -e "${GREEN}[1/4] Checking prerequisites...${RESET}"
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install Docker first."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose v2 not found."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 not found."; exit 1; }
echo "✅ Prerequisites OK"

echo -e "${GREEN}[2/4] Setting up environment...${RESET}"
if [ ! -f .env ]; then
  cp .env .env.bak 2>/dev/null || true
  echo "✅ .env file ready"
fi

echo -e "${GREEN}[3/4] Installing CLI...${RESET}"
pip3 install --quiet -e cli/ --break-system-packages 2>/dev/null || pip3 install --quiet -e cli/
echo "✅ sandbox CLI installed"

echo -e "${GREEN}[4/4] Starting DevOps Sandbox...${RESET}"
sandbox deploy --auto-approve

echo ""
echo -e "${BOLD}${GREEN}🎉 DevOps Sandbox is ready!${RESET}"
echo ""
echo "  🖥️  UI Dashboard:    http://localhost:3000"
echo "  🔌 Backend API:     http://localhost:3001"
echo "  ☁️  LocalStack:      http://localhost:4566"
echo ""
echo "  CLI: sandbox status | sandbox logs | sandbox destroy"
echo ""
