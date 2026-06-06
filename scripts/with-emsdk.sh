#!/bin/sh
set -eu

if command -v emcc >/dev/null 2>&1; then
  exec "$@"
fi

EMSDK_DIR="${EMSDK_PATH:-/root/emsdk}"

if [ ! -f "$EMSDK_DIR/emsdk_env.sh" ]; then
  echo "Unable to find emsdk_env.sh in $EMSDK_DIR" >&2
  echo "Set EMSDK_PATH to the Emscripten SDK directory." >&2
  exit 1
fi

PROJECT_DIR=$(pwd)
export EMSDK_QUIET="${EMSDK_QUIET:-1}"

cd "$EMSDK_DIR"
. ./emsdk_env.sh >/dev/null
cd "$PROJECT_DIR"

export EM_CACHE="${EM_CACHE:-$PROJECT_DIR/.emscripten_cache}"
mkdir -p "$EM_CACHE"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emsdk_env.sh did not make emcc available on PATH." >&2
  exit 1
fi

exec "$@"
