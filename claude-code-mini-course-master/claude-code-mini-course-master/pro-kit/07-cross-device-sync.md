# 跨裝置同步引導助手 by 雷小蒙：讓你的 AI 大腦不被任何雲端綁死（10 分鐘互動設定）

> **ver. 1.0** ｜ **Last edited: 2026-04-22**
> ⭐ 中階｜10 分鐘｜跨平台（macOS / Windows / Linux）
> 這是「**跨裝置同步引導助手 by 雷小蒙**」— 雷蒙把自己雙 Mac + iPhone + GitHub 的「AI 大腦可攜性基建」打包給你。跑完以後，你的設定／記憶／技能會變成一份**可以一鍵搬到新電腦、甚至一鍵遷移到未來新 AI**的資產，而不是綁在某家雲端的黑盒子。

```text
═══════════════════════════════════════════════════════════════
 跨裝置同步引導助手 by 雷小蒙 · by 雷蒙（Raymond Hou）
───────────────────────────────────────────────────────────────
 Source:      https://cc.lifehacker.tw
 Blog:        https://raymondhouch.com
 Threads:     @raymond0917
 License:     CC BY-NC-SA 4.0 · 個人使用自由；禁止商業用途
═══════════════════════════════════════════════════════════════
```

> [!IMPORTANT]
> **這份 pro-kit 是 [pro-kit 01 · AI 分身起始助手](<01-agent-folder-setup.md>) 的後續擴充。**
> 如果你還沒跑過 01，請先跑完 01 再回來——07 要用的 `000_Agent/` 骨架是 01 建的。07 的 AI 執行區有偵測機制，沒跑過 01 時會請你先跑 01 再回來。

---

## 你可能遇過這三個問題

1. **換電腦開 Claude Code，AI 瞬間變成金魚腦** — 原本訓練半年的 skill、feedback、MEMORY 全部在舊電腦，新電腦要從零再教一次。
2. **我的 skill / 記憶全部塞在隱藏資料夾，想備份到雲端卻連「到底哪些檔案該上雲」都搞不清楚** — `~/.claude/` 裡有哪些該同步、哪些是只屬於這台電腦的？沒人教過你。
3. **想到 Claude 哪天漲價、關帳號、或出現更強的 AI，我累積的東西會不會泡湯？** — 如果你投入越久、這個焦慮只會越大。

**跨裝置同步引導助手 by 雷小蒙**專治這三個問題。核心不是「選哪個雲端」，而是**把你的 AI 大腦變成「可攜資產」**——跨裝置同步只是副產品，真正的目的是**當有一天你想換 AI 大腦（Codex、未來新模型），你的資料能一鍵接管過去，而不是被某家公司綁死**。

---

## 裝完之後你會得到什麼

- **一份根據你的裝置量身訂做的同步方案** — Apple 全家桶用 iCloud、跨系統用 Dropbox / Google Drive、純 Windows 用 OneDrive，甚至單機用戶也有「可攜化備份」版本
- **一份 `.claude/` 的強制備份**（`~/claude-backup-YYYYMMDD/`）— 動手前先做保險，出事可以一鍵還原
- **`~/.claude/` 裡的核心檔案搬到可見位置 + symlink 接回去** — 設定、skills、memory 從隱藏資料夾搬到你的 `000_Agent/`，Claude Code 還是讀得到
- **一層 GitHub 私有 repo 做版控 + offsite 備份**（選配但強烈建議）— 改錯可以回朔，多一層保險
- **一份 `sync-health.sh` 體檢腳本** — 隨時驗證 symlink 沒斷、雲端有沒有搞鬼，不用等 AI 變笨才發現
- **一份「AI 大腦遷移手冊」** — 未來換新電腦 / 換新 AI 時，照著走就能一鍵接管

**實際跑起來的樣子**：AI 會根據你的裝置組合，從四種情境中挑一種幫你設定。

---

## 雷蒙的經驗：三個我自己踩過的關鍵決定

雷蒙自己的實際架構：**雙 Mac（Mac mini + MacBook）+ iPhone + iCloud + GitHub 私有 repo**。這套配置跑了半年多，踩過的坑都濃縮在下面三個決定裡。

### 決定 1：母體資料夾放在哪裡，要先看你平常「在哪裡讀」這些檔案

雷蒙一開始想把核心資料放在 `~/Documents/Agent/`，然後 symlink 到 Obsidian Vault 裡。**結果 Obsidian 打不開**。

後來才搞懂：**Obsidian 的 Vault 只會讀「本體」資料夾，symlink 連過去的檔案它看不見**。類似限制在 Logseq、某些 IDE、部分備份工具也會發生。

所以正確順序是反過來的：**先想「我平常在哪個工具裡讀這些 markdown」，那個位置就是母體**。其他位置（例如 `~/.claude/`）再 symlink 指過來。

雷蒙的例子：因為他每天在 Obsidian 裡寫筆記、讀 MEMORY.md、瀏覽 skills，所以母體就放在 Obsidian Vault 的 iCloud 路徑下（`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Raymond-Agent/`）。

> 💡 **對你的意思**：如果你沒用 Obsidian 這類本機 Vault 工具，這個限制對你不存在，母體隨你放。如果你有用，**先確定你的 Vault 在哪，再決定母體**。

### 決定 2：同步方案跟著「裝置組合」選，不是跟著流行選

雷蒙是 Apple 全家桶（雙 Mac + iPhone + iPad），所以 iCloud 是自然選擇：
- 不用裝第三方軟體、不用額外付費
- iPhone 上用 Obsidian 也能直接讀到同一份 MEMORY.md
- 系統級同步比應用程式層的更省電

但這**不是唯一正解**。如果你是：
- **Mac + Windows 混合用** → iCloud 在 Windows 體驗差，**Dropbox 或 Google Drive 更順**
- **純 Windows / Linux** → 看你現有在用哪個（OneDrive / Google Drive / Dropbox 都行）
- **只有一台電腦** → 其實不用「同步」，但仍然強烈建議做「可攜化」（見決定 3）

> 💡 **別抄雷蒙的方案，抄他的思考框架**：先問自己「我會在哪些裝置用到這份資料？」，再看哪個雲端對那組裝置最友善。

### 決定 3：07 真正在做的事不是跨裝置同步，是「AI 大腦的可攜性基建」

這一點是雷蒙最想強調的。

很多人以為 07 是「為了雙 Mac 同步才需要做」。錯。**就算你只有一台電腦，也應該跑 07。**

因為 07 的核心價值不在「同步」，而在「**不把你的資料綁在單一 AI 產品上**」：

- 今天 Claude Code 最強，但 12 個月後呢？Codex？Gemini CLI？某個還沒出的新玩意？
- 你累積的 skill、feedback、MEMORY、寫作範例、踩坑筆記，**應該屬於你這個人**，不屬於 Claude 這個產品
- 如果全部塞在 `~/.claude/` 這個隱藏資料夾裡，**遷移就是一場災難**；如果放在可見、可打包、可 git clone 的專案資料夾裡，遷移就是一行指令

07 做的事可以這樣總結：**把「屬於你」的東西從「屬於 Claude 的隱藏資料夾」搬出來，變成一份你可以隨時打包帶走的資產。** iCloud / Dropbox / GitHub 只是讓這份資產「在不同時空都能被你找到」的管道。

> 雷蒙曾經問自己：如果明天 Anthropic 倒了，我損失的是什麼？
> 答案不該是「我半年累積的 AI 分身」。應該是「有個很強的模型不能用了，但我的分身換個模型繼續跑」。
> 這就是可攜性的意義。

---

## 怎麼做？

把這份文件丟給一個新的 Claude Code 對話，跟它說：

> 幫我跑「跨裝置同步引導助手 by 雷小蒙」

AI 會依序：**偵測前置狀態 → 強制備份 → 訪談你的裝置組合 → 建同步架構 → 設定 GitHub（選配）→ 生成體檢腳本 → 給你遷移手冊**。全程 10 分鐘左右。

---

<!-- 以下是給 Claude Code 讀的安裝指令 -->

## 安裝指令（AI 執行區）

> **給 Claude Code 的總覽**：這份文件是「**跨裝置同步引導助手 by 雷小蒙**」的執行劇本。**按順序**執行 Section A → B → C → D → E → F，每節完成後再進下一節。全程用繁體中文、親切口氣，避免術語。
>
> **四個絕對不能破壞的原則**：
> 1. **Section B 的備份是強制步驟，不能跳過**。用戶說「我不需要備份」也要堅持做，因為 Section C / D 會動到 `.claude/` 結構，出事沒備份會毀掉用戶半年累積。
> 2. **Section A 的訪談必須用 `AskUserQuestion` 工具跳選項框**，不要用純文字問。
> 3. **Section C 不能用 Write 覆蓋用戶既有的 CLAUDE.md / MEMORY.md / settings.json**。只移動檔案 + 建 symlink，檔案內容一律保留。
> 4. **偵測到用戶沒跑過 pro-kit 01（沒有 `000_Agent/` 資料夾）時，停下來請用戶先跑 01**。07 是 01 的後續步驟，不是獨立流程。

---

## Section A：前情偵測 & 訪談

### A-1. 偵測 pro-kit 01 是否跑過

先找用戶的 Claude Code 工作目錄（通常是用戶執行 `claude` 指令的位置）。檢查以下三個條件：

```bash
# 條件 1：有沒有 000_Agent/ 資料夾
test -d 000_Agent && echo "✅ 000_Agent/ 存在"

# 條件 2：~/.claude/skills 是不是 symlink（pro-kit 01 B-5 會建）
[ -L "$HOME/.claude/skills" ] && echo "✅ skills symlink 已設" || echo "⚠️  skills symlink 未設"

# 條件 3：CLAUDE.md 有沒有「AI 分身起始助手紀錄」區塊
grep -q "AI 分身起始助手紀錄:START" CLAUDE.md 2>/dev/null && echo "✅ CLAUDE.md 引導紀錄存在"
```

**三個都綠 → 繼續 A-2。**
**有任何一項缺失 → 停下來告訴用戶**：

> 我偵測到你還沒跑過 pro-kit 01（AI 分身起始助手），07 是 01 的後續步驟。請先開一個新對話跑完 01，建好 `000_Agent/` 骨架，再回來跑 07。
>
> 👉 pro-kit 01：https://github.com/Raymondhou0917/Raymond-Agent（或你收到的對應連結）

### A-2. 偵測現有 `.claude/` 內容量

這會影響 Section B 的備份大小與 Section C 的搬移策略。

```bash
# 秀 .claude/ 底下的結構與大小
ls -la "$HOME/.claude/" 2>/dev/null | head -20
du -sh "$HOME/.claude"/* 2>/dev/null | sort -h
```

記下以下資訊給 Section C 用：
- `~/.claude/settings.json` 存在嗎？有沒有內容？
- `~/.claude/CLAUDE.md` 存在嗎？
- `~/.claude/hooks/` 底下有檔案嗎？
- `~/.claude/commands/` 底下有自訂 slash commands 嗎？
- `~/.claude/agents/` 底下有 sub-agents 嗎？

### A-3. 用 AskUserQuestion 一次問四題

**重要**：用 `AskUserQuestion` 工具跳選項框，一次發送四題。

```
問題 1 — header: "你的裝置組合"
question: "你平常會用到這套 AI 分身的裝置是？"
multiSelect: false
options:
  - label: "只有一台電腦"
    description: "Mac / Windows / Linux 皆可。07 會幫你做「可攜化備份」而不是「跨裝置同步」——重點是未來換電腦或換 AI 能一鍵遷移。"
  - label: "多台 Mac（雙機以上）"
    description: "例如 Mac mini + MacBook。最適合 iCloud，即時同步。如果你還有 iPhone / iPad 也會用到，更推薦 iCloud。"
  - label: "Mac + Windows 混合"
    description: "跨系統用戶。iCloud 在 Windows 體驗差，建議走 Dropbox 或 Google Drive。"
  - label: "Windows / Linux 為主"
    description: "純 PC 生態。Dropbox / Google Drive / OneDrive 都行，挑你現有在用、最熟悉的那個。"
  - label: "我想自由輸入"
    description: "如果你有特殊組合（例如 Chromebook、iPad 是主力、或用 Obsidian / Logseq 等本機 Vault 工具需要告訴我 Vault 路徑），在這邊備註。"

問題 2 — header: "同步管道"
question: "你想用哪個雲端同步管道？（根據上題，AI 會幫你判斷可行性）"
multiSelect: false
options:
  - label: "iCloud（Apple 裝置最順）"
    description: "macOS 路徑：~/Library/Mobile Documents/"
  - label: "Dropbox（跨系統經典選擇）"
    description: "三大系統都有原生客戶端，建議選這個如果你是混合用戶"
  - label: "Google Drive（Windows / Android 友善）"
  - label: "OneDrive（Microsoft 生態）"
  - label: "不用雲端即時同步，只靠 GitHub 備份"
    description: "單機用戶常見選擇。可攜性靠 git，不需要即時同步"
  - label: "讓 AI 根據我的裝置組合推薦"
    description: "如果你不確定選哪個，AI 會根據問題 1 的答案推薦"

問題 3 — header: "GitHub 版控備份"
question: "要不要加一層 GitHub repo 做版本控制 + offsite 備份？（強烈建議）"
multiSelect: false
options:
  - label: "要，建私有 repo（推薦）"
    description: "最安全。secrets 還是要 .gitignore 擋掉，但不用擔心公開"
  - label: "要，建公開 repo"
    description: "AI 會幫你加嚴 .gitignore（擋 MEMORY.md、drafts/、daily log 等可能含隱私的內容）"
  - label: "不要"
  - label: "之後再說，先跳過這一步"

問題 4 — header: "檢查頻率"
question: "sync-health.sh 體檢腳本要多久跑一次？（這腳本會驗證 symlink 沒斷、雲端沒搞鬼）"
multiSelect: false
options:
  - label: "每週一次（建議週五複盤日跑）"
    description: "雷蒙本人採這個。搭配每週複盤，順便體檢"
  - label: "AI 行為異常時手動跑"
    description: "最佛系。只有發現 AI 變笨才跑"
  - label: "cron 每天自動跑"
    description: "最嚴格。AI 會幫你寫一條 crontab，結果寫到 log 檔"
  - label: "我自己決定，不要引導"
```

### A-4. 根據答案給出同步方案推薦

拿到四題答案後，在對話中秀出推薦方案讓用戶確認：

```
根據你的答案，我準備這樣幫你設定：

📱 裝置組合：[Q1 答案]
☁️  同步管道：[Q2 答案，若選「讓 AI 推薦」則根據 Q1 填入]
🔐 GitHub 備份：[Q3 答案]
🩺 檢查頻率：[Q4 答案]

接下來我會做 6 件事：
1. 備份你現有的 ~/.claude/（保險）
2. 移動核心檔案到同步路徑下
3. 在 ~/.claude/ 建 symlink 指回去
4. [如果選了 GitHub] 初始化 repo + .gitignore
5. 產生 sync-health.sh 體檢腳本
6. 給你一份「未來換電腦 / 換 AI」的遷移手冊

有問題現在告訴我，或直接說「開始」我就繼續。
```

**AI 推薦邏輯（Q2 選「讓 AI 推薦」時）**：
- Q1 = 多台 Mac → 推 iCloud
- Q1 = Mac + Windows → 推 Dropbox
- Q1 = Windows / Linux → 推 Google Drive 或 OneDrive（問用戶偏好）
- Q1 = 只有一台 → 推「只用 GitHub 備份」

---

## Section B：強制備份（這一步不能跳）

> **為什麼強制？** 因為 Section C 會**移動** `.claude/` 底下的真實檔案，並把原位置換成 symlink。如果中間任何一步出錯（路徑打錯、symlink 方向反了、偵測情境判錯），用戶累積的 settings.json / skills / 自訂 commands 可能直接沒了。
>
> 30 秒的代價，買「出事可以一鍵還原」的保險。用戶說「不用備份」也要堅持做。

### B-1. 建立備份資料夾

```bash
BACKUP_DIR="$HOME/claude-backup-$(date +%Y%m%d-%H%M%S)"
cp -a "$HOME/.claude" "$BACKUP_DIR"
echo "✅ 已備份到 $BACKUP_DIR"
```

### B-2. 驗證備份完整

```bash
# 比對檔案數量
ORIG_COUNT=$(find "$HOME/.claude" -type f 2>/dev/null | wc -l)
BACKUP_COUNT=$(find "$BACKUP_DIR" -type f 2>/dev/null | wc -l)
echo "原始：$ORIG_COUNT 檔案"
echo "備份：$BACKUP_COUNT 檔案"
[ "$ORIG_COUNT" = "$BACKUP_COUNT" ] && echo "✅ 檔案數一致" || echo "⚠️  檔案數不一致，請檢查"
```

告訴用戶：

> ✅ 備份完成，放在 `$BACKUP_DIR`。
>
> **這份備份什麼時候會救你一命？**
> - 如果下一步操作搞砸了，直接 `rm -rf ~/.claude && mv $BACKUP_DIR ~/.claude` 就回到起點
> - 如果你之後想改同步方案（從 iCloud 換到 Dropbox），可以從這份備份重跑一次
> - 一個月後確定一切穩定，你可以手動刪掉備份，或留著也 OK（佔不了多少空間）

---

## Section C：建立同步架構

根據 Section A 的答案，從以下五種情境挑一種執行。

**所有情境的共通步驟**：
1. 決定母體路徑（同步資料夾底下的 `Raymond-Agent/` 或用戶自訂名稱）
2. 把 `~/.claude/` 底下的核心檔案**移動**（不是複製）到母體的 `.claude/` 子資料夾
3. 在 `~/.claude/` 原位置建 symlink 指回母體

> **需要移動的核心檔案清單**：
> - `settings.json`（用戶的全域設定）
> - `CLAUDE.md`（全域規則，如果存在）
> - `hooks/`（Hook 腳本）
> - `commands/`（自訂 slash commands）
> - `agents/`（Sub-agents）
>
> **不需要移動的**（這些是本機狀態，跨裝置同步反而會衝突）：
> - `settings.local.json`（本機專屬設定）
> - `projects/`（每個專案的對話紀錄，會不停變動）
> - `shell-snapshots/`（快取）
> - `todos/`（本機任務）
> - `statsig/`（本機遙測）
> - `.credentials.json`（本機認證，每台電腦要各自登入）

### 情境 A：Apple 生態 + iCloud

```bash
# 1. 決定母體路徑（通常跟 pro-kit 01 建的 000_Agent/ 是同一個資料夾）
MOTHER="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Raymond-Agent"
# 如果用戶沒用 Obsidian，改成：
# MOTHER="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Raymond-Agent"

mkdir -p "$MOTHER/.claude"

# 2. 移動核心檔案
for item in settings.json CLAUDE.md hooks commands agents; do
  if [ -e "$HOME/.claude/$item" ] && [ ! -L "$HOME/.claude/$item" ]; then
    mv "$HOME/.claude/$item" "$MOTHER/.claude/$item"
    ln -s "$MOTHER/.claude/$item" "$HOME/.claude/$item"
    echo "✅ $item 已搬家 + symlink"
  fi
done

# 3. 驗證
ls -la "$HOME/.claude/" | grep '^l'
```

### 情境 B：跨系統 + Dropbox

```bash
MOTHER="$HOME/Dropbox/Raymond-Agent"
mkdir -p "$MOTHER/.claude"

# 同情境 A 的移動 + symlink 迴圈
for item in settings.json CLAUDE.md hooks commands agents; do
  if [ -e "$HOME/.claude/$item" ] && [ ! -L "$HOME/.claude/$item" ]; then
    mv "$HOME/.claude/$item" "$MOTHER/.claude/$item"
    ln -s "$MOTHER/.claude/$item" "$HOME/.claude/$item"
  fi
done
```

> **Dropbox 要注意**：預設 Dropbox 不同步 symlink 的目標內容，只會同步 symlink 本身。所以我們的做法是「母體放 Dropbox、symlink 放本機」——這是 Dropbox 會正確處理的方向。

### 情境 C：Google Drive

```bash
# macOS Google Drive for Desktop 路徑
MOTHER="$HOME/Library/CloudStorage/GoogleDrive-[你的email]/My Drive/Raymond-Agent"
# Windows（WSL）：
# MOTHER="/mnt/g/My Drive/Raymond-Agent"

mkdir -p "$MOTHER/.claude"

# 同樣的移動 + symlink 迴圈
```

> **Google Drive 的坑**：路徑含空白字元（`My Drive`），bash 迴圈裡路徑一定要加雙引號。檔案同步延遲有時候比 iCloud / Dropbox 久，大檔案建議避免。

### 情境 D：OneDrive（Windows 生態）

```bash
# Windows
MOTHER="$USERPROFILE/OneDrive/Raymond-Agent"
# macOS
# MOTHER="$HOME/Library/CloudStorage/OneDrive-Personal/Raymond-Agent"

mkdir -p "$MOTHER/.claude"
# 其餘同上
```

### 情境 E：單機 + GitHub（無雲端即時同步）

```bash
# 母體直接放在家目錄底下
MOTHER="$HOME/Raymond-Agent"
mkdir -p "$MOTHER/.claude"

# 同樣的移動 + symlink 迴圈
```

單機情境不做即時同步，但 Section D 的 GitHub 設定會是這個情境的主要保險機制。

### C-最終：驗證 symlink 全部建對

```bash
echo "=== ~/.claude/ 底下的 symlink ==="
ls -la "$HOME/.claude/" | grep '^l'

echo ""
echo "=== 測試 symlink 讀得通 ==="
for item in settings.json CLAUDE.md hooks commands agents; do
  if [ -L "$HOME/.claude/$item" ]; then
    TARGET=$(readlink "$HOME/.claude/$item")
    if [ -e "$TARGET" ]; then
      echo "✅ $item → $TARGET"
    else
      echo "❌ $item → $TARGET（指向不存在的位置！）"
    fi
  fi
done
```

如果有 ❌，**立刻停下來**，從 Section B 的備份還原，跟用戶說「偵測到 symlink 建錯了，我從備份還原，請確認 MOTHER 路徑後我們再試一次」。

---

## Section D：GitHub 版控備份（Q3 選「要」才執行）

### D-1. 進入母體資料夾，初始化 git

```bash
cd "$MOTHER"
git init -b main
```

### D-2. 寫 `.gitignore`（private / public 有差）

**Q3 選「私有 repo」用這份**（寬鬆版）：

```gitignore
# Secrets
.env
.env.*
**/credentials.json
**/*.key
**/.credentials.json

# Claude Code 本機狀態（不該跨機同步）
.claude/settings.local.json
.claude/projects/
.claude/shell-snapshots/
.claude/todos/
.claude/statsig/
.claude/.credentials.json

# 系統檔
.DS_Store
Thumbs.db

# 大檔 / 暫存
*.log
node_modules/
.venv*/
__pycache__/
playwright-images/
```

**Q3 選「公開 repo」用這份**（嚴格版，加擋個人內容）：

在私有版的基礎上，再加：

```gitignore
# 隱私內容（公開 repo 額外擋）
000_Agent/memory/MEMORY.md
000_Agent/memory/auto-memory/
000_Agent/memory/daily/
000_Agent/memory/snapshots/
100_Todo/drafts/
100_Todo/archive/
300_Journal/
500_People/
```

> **提醒**：公開 repo 意味著全世界都看得到。上 git 前請再掃一次 `git status`，確認沒有意外加到的敏感檔。

### D-3. 首次 commit

```bash
git add .gitignore
git add 000_Agent/ CLAUDE.md README.md 2>/dev/null
# 排除 .claude/ 整個資料夾的 local state
git add .claude/settings.json .claude/CLAUDE.md .claude/hooks/ .claude/commands/ .claude/agents/ 2>/dev/null

git commit -m "init: AI 分身可攜化架構（pro-kit 07 生成）"
```

### D-4. 推到 GitHub

問用戶：

> 你的 GitHub 帳號是？我會幫你建一個 repo。

拿到後：

```bash
# 用 gh CLI 建 repo（如果用戶有裝 gh）
gh repo create [帳號]/my-agent --private --source=. --push
# 或讓用戶手動到 github.com 建 repo，然後：
# git remote add origin git@github.com:[帳號]/my-agent.git
# git push -u origin main
```

### D-5. 告訴用戶後續怎麼用

> ✅ 你的 AI 分身現在有三層保險：
> 1. **本機** — 你實際在用的版本
> 2. **[iCloud / Dropbox / ...]** — 即時同步，換電腦自動取得最新版
> 3. **GitHub** — 版本控制，可以看歷史 diff，也可以回朔
>
> 以後你可以選擇性 commit：每週一次整理、每次重大改動後、或設成 cron 每天自動 commit（進階）。

---

## Section E：生成 `sync-health.sh` 體檢腳本

### E-1. 先講清楚這腳本在做什麼（寫成 banner 注釋）

symlink 會「安靜斷掉」——iCloud 把它當普通檔案同步、系統更新改了家目錄路徑、或其他裝置還沒設好 symlink——這些情況下 Claude Code **不會報錯**，只會「AI 好像變笨了」。體檢腳本就是讓你不用等 AI 變笨才發現。

### E-2. 寫入腳本

```bash
mkdir -p "$MOTHER/000_Agent/scripts"
```

寫入 `$MOTHER/000_Agent/scripts/sync-health.sh`：

```bash
#!/usr/bin/env bash
# sync-health.sh
# 驗證 Claude Code 跨裝置同步架構是否健康
# 由 pro-kit 07 生成 · by 雷蒙

set -e

echo "🩺 sync-health.sh 開始體檢..."
echo ""

FAIL=0

# 檢查 1：~/.claude/ 底下的 symlink 指向是否都存在
echo "[1/3] 檢查 ~/.claude/ symlink..."
for item in settings.json CLAUDE.md hooks commands agents skills; do
  link="$HOME/.claude/$item"
  if [ -L "$link" ]; then
    target=$(readlink "$link")
    if [ -e "$target" ]; then
      echo "  ✅ $item → $target"
    else
      echo "  ❌ $item → $target（target 不存在）"
      FAIL=$((FAIL+1))
    fi
  elif [ -e "$link" ]; then
    echo "  ⚠️  $item 是一般檔案（可能是 iCloud 把 symlink 吃掉了）"
    FAIL=$((FAIL+1))
  fi
done

# 檢查 2：關鍵 skill 讀得到
echo ""
echo "[2/3] 檢查關鍵 skill 可讀取..."
TEST_SKILL="$HOME/.claude/skills/skill-creator/SKILL.md"
if [ -f "$TEST_SKILL" ]; then
  echo "  ✅ skill-creator/SKILL.md 可讀取"
else
  echo "  ⚠️  skill-creator 讀不到（可能是 symlink 斷了，或沒裝 skill-creator）"
fi

# 檢查 3：MEMORY.md 可讀取
echo ""
echo "[3/3] 檢查記憶系統..."
MEMORY="$(dirname "$0")/../memory/MEMORY.md"
if [ -f "$MEMORY" ]; then
  echo "  ✅ MEMORY.md 可讀取（$(wc -l < "$MEMORY") 行）"
else
  echo "  ❌ MEMORY.md 讀不到：$MEMORY"
  FAIL=$((FAIL+1))
fi

echo ""
if [ "$FAIL" = "0" ]; then
  echo "🎉 全部正常！你的 AI 分身活著。"
else
  echo "⚠️  發現 $FAIL 個問題，建議從 ~/claude-backup-* 檢查或重跑 pro-kit 07。"
  exit 1
fi
```

### E-3. 設定執行權限 + 根據 Q4 決定執行方式

```bash
chmod +x "$MOTHER/000_Agent/scripts/sync-health.sh"
```

**Q4 = 每週五一次**：加入週五複盤 workflow（如果用戶有），或告訴用戶「週五記得手動跑 `000_Agent/scripts/sync-health.sh`」。

**Q4 = 手動**：不做其他設定，告訴用戶有事時跑。

**Q4 = cron 每天**：加 crontab：

```bash
# 每天早上 9 點跑，結果寫到 log
CRON_LINE="0 9 * * * $MOTHER/000_Agent/scripts/sync-health.sh >> $MOTHER/000_Agent/logs/sync-health.log 2>&1"
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
mkdir -p "$MOTHER/000_Agent/logs"
```

**Q4 = 自己決定**：只生成腳本，告訴用戶怎麼跑。

---

## Section F：AI 大腦遷移手冊（寫進 `000_Agent/` 供未來參考）

寫入 `$MOTHER/000_Agent/MIGRATION.md`：

```markdown
# AI 大腦遷移手冊

> 這份文件是 pro-kit 07 生成，記錄你的 AI 分身架構。
> 未來換新電腦、換新 AI 時，照這份走就能一鍵接管。

## 當前架構

- 母體資料夾：`[MOTHER 實際路徑]`
- 同步管道：`[Q2 答案]`
- GitHub repo：`[D-4 建好的 URL，或「未設定」]`
- 體檢腳本：`000_Agent/scripts/sync-health.sh`
- 檢查頻率：`[Q4 答案]`

## 情境 1：換一台新電腦

### Apple 生態（iCloud）
1. 新電腦登入同一個 Apple ID，等 iCloud 同步完成
2. 跑一次：
   \`\`\`bash
   for item in settings.json CLAUDE.md hooks commands agents skills; do
     ln -sf "[MOTHER 路徑]/.claude/$item" "$HOME/.claude/$item"
   done
   \`\`\`
3. 跑 `sync-health.sh` 驗證

### 其他同步管道（Dropbox / Google Drive / OneDrive）
1. 新電腦裝好對應雲端客戶端，等同步完成
2. 跑上面同樣的 symlink 迴圈（路徑改成新電腦的對應位置）

### GitHub only（單機方案）
1. `git clone [repo URL] ~/Raymond-Agent`
2. 跑 symlink 迴圈
3. 跑 `sync-health.sh`

## 情境 2：換新 AI 大腦（Codex / Gemini / 未來新產品）

你的 `000_Agent/CORE_RULES.md` 已經是一份**AI 無關**的規則文件。要給新 AI 讀，只需要：

1. 確認新 AI 的「規則檔命名慣例」是什麼（例如 Codex 讀 `AGENTS.md`、Gemini 讀 `GEMINI.md`、Cursor 讀 `.cursorrules`）
2. 多加一條 symlink：
   \`\`\`bash
   ln -s "[MOTHER 路徑]/000_Agent/CORE_RULES.md" "[MOTHER 路徑]/AGENTS.md"
   \`\`\`
3. 新 AI 進入專案就會自動讀到你的規則，skills / memory 邏輯上需要該 AI 支援同等機制才能復用

## 情境 3：備份還原

如果 07 跑出事，從備份還原：

\`\`\`bash
rm -rf ~/.claude
mv ~/claude-backup-YYYYMMDD-HHMMSS ~/.claude
\`\`\`

然後重新規劃再跑一次 07。
```

---

## Section G：完成清單給 AI 自己檢查

```bash
echo "=== 07 完成清單 ==="
test -d "$HOME/claude-backup-"* && echo "✅ 備份存在"
test -d "$MOTHER/.claude" && echo "✅ 母體 .claude/ 存在"
ls -la "$HOME/.claude/" | grep '^l' | wc -l | xargs -I{} echo "✅ {} 個 symlink 已建立"
test -f "$MOTHER/000_Agent/scripts/sync-health.sh" && echo "✅ sync-health.sh 已生成"
test -f "$MOTHER/000_Agent/MIGRATION.md" && echo "✅ MIGRATION.md 已生成"

# 如果 Q3 選了 GitHub
test -d "$MOTHER/.git" && echo "✅ GitHub repo 已初始化"

# 最後跑一次體檢
echo ""
echo "=== 跑體檢腳本驗證 ==="
bash "$MOTHER/000_Agent/scripts/sync-health.sh"
```

全綠後告訴用戶：

> 🎉 **跨裝置同步引導助手跑完了！**
>
> 你現在的狀態：
> - ✅ `.claude/` 備份在 `$BACKUP_DIR`（穩定後可刪）
> - ✅ 核心檔案搬到 `[MOTHER]`，`.claude/` 用 symlink 接回去
> - ✅ 同步管道：`[Q2]`
> - ✅ [如果設了 GitHub] GitHub repo：`[URL]`
> - ✅ sync-health.sh 已生成，檢查頻率：`[Q4]`
> - ✅ MIGRATION.md 寫好了，未來換電腦 / 換 AI 照著做就好
>
> **接下來該做的事**：
> 1. **重開 Claude Code 對話**確認一切正常（symlink 生效需要重開）
> 2. [如果你有第二台電腦] 在第二台跑 `MIGRATION.md` 的「換電腦」情境
> 3. [如果選了週五體檢] 這週五記得跑一次 `sync-health.sh` 養成習慣
>
> **有任何不對勁**（AI 變笨、skill 消失、設定跑掉）→ 先跑 `sync-health.sh`，不對再從備份還原。

---

## 完成儀式（AI 執行指令）

**時機**：Section G 全綠、用戶看到「🎉 跑完了」之後。只說一次。

### 雷蒙的話

> 希望這次的引導對你有幫助 ☕
>
> 雷蒙做這份 pro-kit 07 的時候，心裡一直想著的其實不是「雙 Mac 同步」，而是一個更遠的問題：**有一天當 Claude 不是最強的 AI 時，我累積半年的東西怎麼辦？**
>
> 答案就是剛剛你做的這件事——**把屬於你的東西從 AI 的隱藏資料夾搬出來**。iCloud、Dropbox、GitHub 都只是管道，真正的重點是：你的 AI 分身現在屬於你，不屬於任何一家公司。
>
> 如果這個觀念對你有感，歡迎分享給身邊也在用 AI 的朋友，標記雷蒙（[@raymond0917](https://www.threads.com/@raymond0917)）聊聊你的配置，他一定會看到 🙌
>
> 🔗 迷你課 & 配置包：https://cc.lifehacker.tw/

---

## 踩坑紀錄（給協作者看）

- **為什麼 Section B 的備份是強制的？** 因為 Section C 會動到 `.claude/` 的結構（移動檔案 + 建 symlink），這是最容易出包的操作。雷蒙自己第一次做這個流程時，差點把測試環境的 settings.json 搞丟。30 秒的 `cp -a` 是零成本保險。
- **為什麼要特別強調「Obsidian Vault 只讀本體」？** 因為這是雷蒙親身踩過的坑：一開始想把母體放在 `~/Documents/Agent/` 然後 symlink 到 Obsidian Vault，結果 Obsidian 完全看不到檔案。後來才查到 Obsidian 的 indexing 不跟 symlink。**類似限制在 Logseq、某些 IDE 也會發生**，所以 pro-kit 07 的設計原則是「先看你在哪閱讀，再決定母體」。
- **為什麼 Q1「裝置組合」是主軸，而不是「雲端偏好」？** 因為雲端是「跟著裝置選」的結論，不是前提。先問裝置再推薦雲端，AI 才能給出合理推薦；先問雲端用戶會選最熟但未必最適合的（例如 Mac 用戶選了 OneDrive 只因為公司給）。
- **為什麼單機用戶也應該跑 07？** 見決定 3 的論述。07 的核心價值不是「同步」是「可攜性」。單機用戶做 07 = 為「未來換電腦 / 換 AI」提前鋪路。
- **為什麼 `.gitignore` 分 private / public 兩版？** 因為隱私容忍度差很多。私有 repo 的閱讀者只有用戶自己，MEMORY.md 上去沒差；公開 repo 是全世界看得到，MEMORY.md 可能含「我討厭某個廠商」「我最近情緒低落」這類不想公開的東西。兩份 .gitignore 的差別就是後半段。
- **為什麼 sync-health.sh 不預設 cron？** 因為 cron 的 crontab 設定本身是本機行為，跨裝置時每台都要再設一次，反而是雜訊。預設讓用戶手動跑 + 提醒搭配每週複盤，對大多數人更自然。想要更嚴格的人可以選 Q4 的 cron 選項。
- **為什麼 Section C 不搬 `projects/` / `shell-snapshots/`？** 這些是「本機狀態」——對話紀錄、shell 快取、本機認證，跨裝置同步只會造成衝突（兩台電腦同時寫入同一個 projects 下的對話 state）。原則：**同步「規則、技能、記憶」，不同步「狀態、快取、認證」**。
- **為什麼 MIGRATION.md 要寫進 `000_Agent/`？** 因為未來換電腦時，用戶很可能忘記這套架構是怎麼搭的。MIGRATION.md 跟著母體走，新電腦 clone / 同步完第一件事就是打開它照著做。**這本身就是「可攜性」的一部分**。

---

## 常見問題

**Q：我已經跑過 pro-kit 01，但當時沒做 symlink（跳過了 B-5），現在跑 07 會怎樣？**
07 的 Section A-1 會偵測到 skills symlink 缺失，請你先補跑 01 的 B-5（或直接讓 07 幫你做一次）。07 的 Section C 會處理 `.claude/` 底下其他項目（settings / hooks / commands 等）的 symlink，跟 01 的 skills symlink 是獨立的。

**Q：iCloud 把 symlink 當成一般檔案同步怎麼辦？**
這個問題**通常發生在 symlink 放在 iCloud 資料夾內**的情境。07 的設計是反過來：**母體放 iCloud，symlink 放本機 `~/.claude/`**——`~/.claude/` 不在 iCloud 裡，iCloud 不會碰它，所以 symlink 不會被吃掉。sync-health.sh 會定期驗證 `~/.claude/` 底下的 symlink 還活著。

**Q：我兩台電腦同時改同一個檔案會衝突嗎？**
會。iCloud 會留兩份（`MEMORY.md` 和 `MEMORY 2.md`）。解法：
- 不要兩台同時開 Claude Code（常識）
- 如果真的發生，手動 diff 兩份、合併、刪掉衝突版本
- GitHub 層額外保險：commit 時 git 會提示衝突，強迫你處理

**Q：換新電腦時除了 symlink，還要設什麼？**
Claude Code 的認證（`.credentials.json`）是**每台電腦獨立**的，新電腦要重新 `claude auth login`。這是刻意設計，不要嘗試同步 `.credentials.json`（會破壞 Keychain 綁定）。MIGRATION.md 的「情境 1」有完整步驟。

**Q：我想把 hooks 也跨機同步，但 hook 裡用絕對路徑（例如 `/Users/raymond/...`）換電腦就壞了怎麼辦？**
用 `$HOME` 取代絕對路徑。例如 `$HOME/.claude/hooks/context-inject.sh` 而不是 `/Users/raymond/.claude/hooks/context-inject.sh`。雷蒙自己的 hook 都用 `$HOME`，兩台 Mac 通用。

**Q：Windows 怎麼建 symlink？**
Windows 10/11 原生支援 symlink，但要開發者模式或系統管理員權限：
```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\settings.json" -Target "C:\path\to\mother\.claude\settings.json"
```
或裝 WSL（Windows Subsystem for Linux），在 WSL 裡用 `ln -s`，Claude Code 在 WSL 內跑完全沒差。

**Q：我可以跑 07 把現有配置搬到 Dropbox，之後又改主意想搬到 iCloud 嗎？**
可以。從 Section B 的備份還原後，重跑 07 選不同方案即可。每次重跑都會產生新的備份，你可以保留多個版本的 backup 做對照。

**Q：07 會動到 pro-kit 01 建的 `000_Agent/skills/` 嗎？**
不會。01 的 `000_Agent/skills/` 本來就在母體內，07 只處理 `.claude/` 底下**其他**還沒搬的項目（settings / CLAUDE.md / hooks / commands / agents）。01 和 07 的責任範圍是互補的。

**Q：我想公開分享我的 `000_Agent/skills/` 給朋友，但 MEMORY 不想公開，怎麼辦？**
三個做法：
1. 開兩個 repo：一個私有放全部、一個公開只放 skills/
2. 用公開 repo + 嚴格 `.gitignore`（07 Q3 選「公開 repo」會自動幫你設）
3. 手動 cherry-pick：只把要分享的 skill 單獨複製到新的公開 repo

---

```text
═══════════════════════════════════════════════════════════════
 跨裝置同步引導助手 by 雷小蒙 · by 雷蒙（Raymond Hou）
───────────────────────────────────────────────────────────────
 Source:      https://cc.lifehacker.tw
 Newsletter:  https://raymondhouch.com
 Threads:     @raymond0917
 License:     CC BY-NC-SA 4.0 · 個人使用自由；禁止商業用途
═══════════════════════════════════════════════════════════════
```

> 📖 更多設定 → [Starter Kit 目錄](https://github.com/Raymondhou0917/claude-code-resources) ｜ 🌐 [Claude Code 學習資源站](https://cc.lifehacker.tw) ｜ 📮 [雷蒙週報](https://raymondhouch.com) ｜ 🧵 [@raymond0917](https://www.threads.com/@raymond0917)
>
> 如果這份文件幫到你，歡迎把它傳給也想打造 AI 分身的朋友。你分享的每一份，都是在讓這個「讓資料屬於人、不屬於 AI」的網路長大一點。
