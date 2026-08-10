#!/usr/bin/env bash
set -euo pipefail

cd /workspace

if [ ! -f out/chatting/application/Server.class ]; then
  ./scripts/cloud-agent-install.sh
fi
