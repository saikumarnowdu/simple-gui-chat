#!/usr/bin/env bash
set -euo pipefail

cd /workspace
mkdir -p out
find src -name '*.java' -print0 | xargs -0 javac -d out -sourcepath src
