#!/bin/sh
set -eu

[ "${CI:-}" = "true" ] && exit 0

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
git -C "$root" config core.hooksPath .githooks
chmod +x "$root/.githooks/pre-push"
