#!/usr/bin/env bash
# setup-hooks.sh — 一次性初始化 git hooks
#
# 新 clone 此 repo 後請跑一次：
#     bash scripts/setup-hooks.sh
#
# 它會把 git hooks 目錄指向 repo 內的 .githooks/
# 效果：commit 時自動剝離 Obsidian 的 `created` / `updated` frontmatter
#       （只剝 git 要存的內容，本地檔案完全不動）

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

current=$(git config --get core.hooksPath 2>/dev/null || echo "")

if [ "$current" = ".githooks" ]; then
    echo "✅ Git hooks 已設定（core.hooksPath = .githooks）"
    exit 0
fi

git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true

echo "✅ 已啟用 repo 內建的 pre-commit hook"
echo "   - core.hooksPath = .githooks"
echo "   - 以後 commit 時會自動剝離 Obsidian 的 created/updated frontmatter"
echo "   - 本地 working tree 不會被動，Obsidian 照常運作"
