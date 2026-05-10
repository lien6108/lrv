# 社群圖卡產生器 by 雷小蒙：不會設計也能一句話出 IG 圖卡

> **ver. 1.0** ｜ **Last edited: 2026-04-18**
> ⭐ 初學者友善｜10 分鐘安裝｜跨平台（macOS / Linux / Windows WSL）
> 丟一篇文章給 AI，它自動拆成一組品牌風格統一的 IG 圖卡，預覽確認後一鍵匯出 2x PNG。

```text
═══════════════════════════════════════════════════════════════
 社群圖卡產生器 by 雷小蒙 · by 雷蒙（Raymond Hou）
───────────────────────────────────────────────────────────────
 Source:      https://cc.lifehacker.tw
 Blog:        https://raymondhouch.com
 Threads:     @raymond0917
 License:     CC BY-NC-SA 4.0 · 個人使用自由；禁止商業用途
═══════════════════════════════════════════════════════════════
```

## 你可能遇過這個問題

你寫了一篇文章、做了一份教學筆記，想分享到 IG。

打開 Canva，光選模板就花了 20 分鐘。調字體、換顏色、對齊圖片，弄了一個多小時，出來的東西還是不滿意，配色不統一、每次做出來都長不一樣。

或者你根本不想碰設計軟體，覺得「我只是想把這段文字變成好看的圖而已，為什麼這麼麻煩」。

**社群圖卡產生器**專治這個問題。你跟 AI 說「幫我把這篇做成圖卡」，它會自動幫你：拆成適合 IG 的一張張圖、套上統一的品牌配色、讓你預覽修改、最後一鍵匯出可以直接發的 PNG。

## 裝完之後你會得到什麼

- **一個 `/cards` 指令** — 說「做圖卡」或 `/cards` 就會觸發
- **2 套品牌配色可選**：
  - 🔵 **藍黑系** — 深色科技感，適合教學、工具介紹
  - 🟠 **橘白系** — 明亮溫暖，適合觀點分享、心得
- **4 種卡片版型**：封面（cover）、純文字（content-text）、文字+圖片（content-image）、結尾呼籲（cta）
- **2 種尺寸**：4:5（1080×1350，IG 最常用）、1:1（1080×1080，IG / X 通用）
- **AI 自動拆卡** — 你只要給內容，AI 判斷要拆幾張、每張放什麼
- **預覽 → 修改 → 匯出** — 先在瀏覽器看完整效果，改到滿意再匯出 2x PNG
- **@handle 記憶** — 第一次設定你的帳號，之後自動帶入

## 雷蒙的經驗：為什麼需要這個 skill

我經營雷蒙三十、柚智夫妻，每週都要做 IG 圖卡把課程觀點、工具筆記、讀書心得轉成社群內容。

早期用 Canva：光對齊字就 20 分鐘，做 5 張要 1 小時，而且每次做出來風格還不一樣，這張深藍、那張淺灰，追蹤者看久了覺得我沒有個人品牌。

後來我寫了一套 HTML 模板，用 Tailwind 統一字體、配色、留白，用 Playwright 截圖成 2x PNG，每張 30 秒。

這個 Skill 就是**把拆卡邏輯交給 AI、把模板打包成隨插即用的組件**。你只丟一段文字，AI 自動拆 5-8 張、套模板、打開預覽、等你確認、匯出。從 20 分鐘縮成 3 分鐘，而且風格永遠一致。（當然，這只是個模版範本，你完全值得輸入自己喜歡的樣式、風格或是品牌的配色進去，讓它成為你們品牌的版本）

## 怎麼用？

安裝完成後，三種使用方式：

```
# 給網址
/cards https://你的文章網址.com

# 給檔案
/cards 200 Notes/我的讀書筆記.md

# 直接打字
做圖卡
（然後貼上你的文字內容）
```

AI 會帶你走完整個流程：選配色 → 選尺寸 → 確認帳號 → 自動拆卡 → 預覽 → 修改 → 匯出 PNG。

## 怎麼安裝？

把這份文件整份貼給你的 Claude Code，跟它說：「幫我安裝這個 Skill」。

---

<!-- 以下是給 Claude Code 讀的安裝指令 -->

## 安裝指令（AI 執行區）

> **給 Claude Code 的總覽**：這份文件是「**社群圖卡產生器**」的安裝劇本。完整 Skill 檔案（SKILL.md + 8 個 HTML 模板 + screenshot.mjs）都在迷你課 repo 的 `skills/social-cards/` 子資料夾。你要做的是：從 repo 拉整個 `skills/social-cards/` 到用戶的 Skills 目錄，改名為 `cards`，安裝 Playwright。
>
> **核心原則**：
> 1. 用 `git sparse-checkout` 只拉 `skills/social-cards/` 一個子資料夾（不是整個 repo）。
> 2. Skills 目錄位置以用戶的專案結構為準（有 `000_Agent/skills/` 就用它，沒有就用 `~/.claude/skills/`）。
> 3. 不要覆蓋用戶既有的檔案，已存在先備份。

---

### Section A：偵測環境

```bash
# 偵測 Skills 目錄位置
if [ -d "000_Agent/skills" ]; then
  SKILLS_DIR="000_Agent/skills"
elif [ -d "$HOME/.claude/skills" ]; then
  SKILLS_DIR="$HOME/.claude/skills"
else
  mkdir -p "$HOME/.claude/skills"
  SKILLS_DIR="$HOME/.claude/skills"
fi

INSTALL_PATH="$SKILLS_DIR/cards"
echo "SKILLS_DIR=$SKILLS_DIR"
echo "INSTALL_PATH=$INSTALL_PATH"

# 已存在就備份
if [ -d "$INSTALL_PATH" ]; then
  mv "$INSTALL_PATH" "${INSTALL_PATH}.bak.$(date +%Y%m%d-%H%M%S)"
  echo "既有資料夾已備份"
fi

# 確認 Node.js
node --version || { echo "❌ 請先裝 Node.js"; exit 1; }
```

### Section B：從 repo 拉 `skills/social-cards/` 子資料夾

```bash
TMPDIR_CARDS=$(mktemp -d)
cd "$TMPDIR_CARDS"

git init -q
git remote add origin https://github.com/lifehacker-tw/claude-code-mini-course.git
git config core.sparseCheckout true
echo "skills/social-cards/" >> .git/info/sparse-checkout
git pull --depth 1 origin master 2>&1 | tail -5

# 驗證結構
find skills/social-cards -type f | sort
```

**驗證標準**：應該看到至少 11 個檔案：
- `SKILL.md`、`README.md`
- `assets/blue-dark/{cover,content-text,content-image,cta}.html`（4 個）
- `assets/orange-light/{cover,content-text,content-image,cta}.html`（4 個）
- `scripts/screenshot.mjs`

**如果 sparse-checkout 失敗**（repo 是 private、網路擋 GitHub），fallback 用 `gh api` 遞迴抓，或提示用戶手動從 Teachify 下載課程材料後，告訴 AI `skills/social-cards/` 的本地路徑，改用 `cp -r` 複製。

### Section C：搬到 INSTALL_PATH + 安裝 Playwright

```bash
cd -
mv "$TMPDIR_CARDS/skills/social-cards" "$INSTALL_PATH"
rm -rf "$TMPDIR_CARDS"

cd "$INSTALL_PATH"
npm init -y > /dev/null
npm install playwright
npx playwright install chromium
```

### Section D：驗證

```bash
# 核心檔案都在
test -f "$INSTALL_PATH/SKILL.md" && echo "✅ SKILL.md"
test -d "$INSTALL_PATH/assets/blue-dark" && echo "✅ blue-dark 模板"
test -d "$INSTALL_PATH/assets/orange-light" && echo "✅ orange-light 模板"
test -f "$INSTALL_PATH/scripts/screenshot.mjs" && echo "✅ screenshot.mjs"
test -d "$INSTALL_PATH/node_modules/playwright" && echo "✅ Playwright"
```

驗證通過後跟用戶說：

> ✅ 社群圖卡產生器安裝完成！位置：`[INSTALL_PATH]`
>
> 以後只要跟我說「做圖卡」或 `/cards`，再給我一篇文章、一段文字、或一個網址，我就會幫你自動拆成 IG 圖卡。
>
> 兩套配色可選：🔵 藍黑系（科技感）和 🟠 橘白系（溫暖感），兩種尺寸（4:5 和 1:1）。
>
> **下一步**：開一個新對話，打 `/cards` 測試它會出現在 `/` 選單。

---

## 授權

- **License**：CC BY-NC-SA 4.0 · 個人使用、學習、分享自由；禁止商業用途
- 出自 雷蒙三十 Starter Kit — cc.lifehacker.tw | CC BY-NC-SA 4.0
- [迷你課](https://lifehacker.tw/courses/24hr-claude-code-tutorial) · [週報](https://raymondhouch.com/subscribe) · [Threads @raymond0917](https://www.threads.com/@raymond0917)
