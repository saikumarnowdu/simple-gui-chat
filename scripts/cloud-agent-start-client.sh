#!/usr/bin/env bash
set -euo pipefail

cd /workspace

for _ in $(seq 1 60); do
  if (echo >/dev/tcp/127.0.0.1/6001) >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! (echo >/dev/tcp/127.0.0.1/6001) >/dev/null 2>&1; then
  echo "Chat server is not listening on port 6001" >&2
  exit 1
fi

exec java -cp out:src chatting.application.Client
