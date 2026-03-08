#!/usr/bin/env bash

# ensure Docker daemon is available (works on WSL + Linux)
if ! docker info >/dev/null 2>&1; then
  echo "⚠️  Docker daemon not available, starting Docker Desktop on Windows…"
  powershell.exe -Command "Start-Process 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe'"
  until docker info >/dev/null 2>&1; do sleep 1; done
fi

# bring containers up as before
docker compose up --build -d
