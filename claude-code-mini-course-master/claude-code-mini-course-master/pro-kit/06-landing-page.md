# 引導式 Landing Page 生成 by 雷小蒙：問完問題直接生出銷售頁（`/landing`）

> **ver. 1.0** ｜ **Last edited: 2026-04-18**
> ⭐ 初學者友善｜一次 20-30 分鐘｜適用活動／線上課／數位產品三種銷售頁
> 安裝後 Claude Code 多一個 `/landing` 指令：一次問一個問題、依品牌調性挑設計風格、自動生 HTML 並在瀏覽器打開。

```text
═══════════════════════════════════════════════════════════════
 引導式 Landing Page 生成 by 雷小蒙 · by 雷蒙（Raymond Hou）
───────────────────────────────────────────────────────────────
 Source:      https://cc.lifehacker.tw
 Blog:        https://raymondhouch.com
 Threads:     @raymond0917
 License:     CC BY-NC-SA 4.0 · 個人使用自由；禁止商業用途
───────────────────────────────────────────────────────────────
 依賴：UI UX Pro Max（UUPM）
       https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
       安裝過程會引導學員一起裝（未裝也能 fallback 運作）。
═══════════════════════════════════════════════════════════════
```

## 你可能遇過這三個問題

你想幫自己的課 / 服務 / 數位商品做一個 landing page：

1. **「叫 AI 隨便做一個，結果很醜」** — 藍紫漸層、2015 年感的圓角按鈕、中英文字體不對齊，AI 強項是填空，不是從無到有做決策。
2. **「寫銷售文案時腦袋一片空白」** — 你知道產品好在哪，但要寫成 hero / 痛點 / FAQ 就卡住。文案結構、好壞範例都要自己去查。
3. **「做完發現完全不像我的品牌」** — 色票、字體、整個調性跟你的 IG / 部落格不一致，因為沒人告訴 AI 你的品牌長什麼樣。

**引導式 Landing Page 生成** 就是專治這三個問題的。一次只問你一題、每題附好壞範例、卡住可以說「幫我生」、最後整合 UI UX Pro Max 挑產業對齊的設計系統，讓做出來的頁面看起來像同產業頂尖網站，不像 AI 隨便拼的。

## 裝完之後你會得到什麼

- **一個 `/landing` 指令** — 在 Claude Code 輸入就啟動引導流程
- **17 題結構化問答** — A 產品定位（4 題）、B 內容填入（10 題）、C 倒數與 CTA（3-4 題）
- **每題都有好 / 壞範例** — 不用猜要寫什麼
- **卡住可以「幫我生 3 個」** — AI 根據前面答案生初稿讓你挑
- **UUPM 設計系統整合** — 自動挑產業對齊的字體、顏色、風格
- **11 區塊完整頁面** — Hero / Hook / About / Learn / 見證（可選）/ 受眾 / 資訊 / 價格 / CTA / 講師 / FAQ
- **倒數計時器（可選）** — Hero 大型 + 底部 sticky CTA bar，滾過 Hero 才跳出
- **自動開啟預覽** — 生完 HTML 自動 `open` 在瀏覽器，不用手動點開
- **可重跑** — 改文案用 `/landing --restyle {slug}`（讀 `answers.json` 不用從頭答）

## 雷蒙的經驗：為什麼需要這個 skill

我做過無數張銷售頁，雷蒙三十、課程、產品、活動。每次的流程都是：
1. 寫文案 → 2. 找範本 → 3. 調 CSS → 4. 重寫文案因為結構不合 → 5. 再調 CSS → 6. 心累

後來發現：**好的銷售頁有固定結構**。痛點 → 介紹 → 收穫 → 適合誰 → 資訊 → 價格 → CTA → FAQ。每個 section 要問的問題、好壞範例是什麼，都可以標準化。

那為什麼不做一個 skill，把這套流程交給 AI 執行？

於是有了 `/landing`。每次要做新頁面，跑一次，30 分鐘完成初稿，剩下的時間就拿去磨文案和替換真實素材。

## 什麼時候該用 `/landing`？

| 情境 | 要不要用？ | 原因 |
|:--|:--|:--|
| 新產品 / 課程 / 服務要銷售頁 | **一定要用** | 最能發揮引導式問答的價值 |
| 既有頁面改版 | **建議用** | 重跑一次比手動改結構快 |
| Waitlist / coming soon 頁 | 不建議 | 內容太少、17 題會撐不起來 |
| 作品集 / portfolio | 不適合 | 結構不一樣 |
| 部落格文章頁 | 不適合 | 不是銷售頁 |

**簡單判斷法**：如果頁面要做的事是「讓別人報名 / 購買 / 訂閱」，用 `/landing`。

## 怎麼用？

安裝完成後：

```
/landing
```

AI 會先問你是哪一種銷售頁（實體活動 / 線上課 / 數位產品），接著一題一題引導你填內容。大約 20-30 分鐘後，瀏覽器會自動打開你的銷售頁。

## 怎麼安裝？

把這份文件整份貼給你的 Claude Code，跟它說：「幫我安裝這個 Skill」。

---

<!-- 以下是給 Claude Code 讀的安裝指令 -->

## 安裝指令（AI 執行區）

> **給 Claude Code 的總覽**：這份文件是「**引導式 Landing Page 生成**」的安裝劇本。完整 Skill 檔案（SKILL.md + references/ 3 個檔案 + templates/ 2 個檔案）都在迷你課 repo 的 `skills/landing-page/` 子資料夾。你要做的是：從 repo 拉整個 `skills/landing-page/` 到用戶的 Skills 目錄，改名為 `landing`，並引導用戶安裝依賴 UUPM（非必要）。
>
> **核心原則**：
> 1. 用 `git sparse-checkout` 只拉 `skills/landing-page/` 一個子資料夾（不是整個 repo）。
> 2. Skills 目錄位置以用戶的專案結構為準（有 `000_Agent/skills/` 就用它，沒有就用 `~/.claude/skills/`）。
> 3. UUPM 依賴非必要，沒裝也能用 fallback 模式跑。用 `AskUserQuestion` 問用戶要不要一起裝。
> 4. 不要覆蓋用戶既有的檔案，已存在先備份。

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

INSTALL_PATH="$SKILLS_DIR/landing"
echo "INSTALL_PATH=$INSTALL_PATH"

# 已存在就備份
if [ -d "$INSTALL_PATH" ]; then
  mv "$INSTALL_PATH" "${INSTALL_PATH}.bak.$(date +%Y%m%d-%H%M%S)"
fi

# 偵測 UUPM
HAS_UUPM="no"
test -d "$HOME/.claude/skills/ui-ux-pro-max" && HAS_UUPM="yes"
test -d "$SKILLS_DIR/ui-ux-pro-max" && HAS_UUPM="yes"
command -v uipro >/dev/null 2>&1 && HAS_UUPM="yes"
echo "HAS_UUPM=$HAS_UUPM"
```

### Section B：從 repo 拉 `skills/landing-page/` 子資料夾

```bash
TMPDIR_LP=$(mktemp -d)
cd "$TMPDIR_LP"

git init -q
git remote add origin https://github.com/lifehacker-tw/claude-code-mini-course.git
git config core.sparseCheckout true
echo "skills/landing-page/" >> .git/info/sparse-checkout
git pull --depth 1 origin master 2>&1 | tail -5

# 驗證結構
find skills/landing-page -type f | sort
```

**驗證標準**：應該看到至少 7 個檔案：
- `SKILL.md`、`README.md`
- `references/question-bank.md`
- `references/uupm-integration.md`
- `references/fallback-design-rules.md`
- `templates/base.html`
- `templates/countdown.js`

**如果 sparse-checkout 失敗**（repo 是 private、網路擋 GitHub），fallback 用 `gh api` 遞迴抓，或提示用戶從 Teachify 下載課程材料後，告訴 AI `skills/landing-page/` 的本地路徑，改用 `cp -r` 複製。

### Section C：搬到 INSTALL_PATH

```bash
cd -
mv "$TMPDIR_LP/skills/landing-page" "$INSTALL_PATH"
rm -rf "$TMPDIR_LP"
ls -la "$INSTALL_PATH"
```

### Section D：引導安裝 UUPM（如果沒裝）

如果 `HAS_UUPM=no`，用 `AskUserQuestion` 跳出選項：

- **問題**：「這個 Skill 建議搭配 UUPM（UI UX Pro Max）使用，會自動依你的產業挑對應的設計系統（字體、配色），出來的頁面質感差很多。要一起裝嗎？」
- **選項 A（推薦）**：好，幫我裝 → 執行 `npm install -g uipro-cli && uipro init --ai claude --global`
- **選項 B**：之後再說 → 跳過，之後 `/landing` 會用 fallback 模式
- **選項 C**：我已經裝過了 → 請用戶確認 `command -v uipro`，若真的有就跳過

如果 `HAS_UUPM=yes`，直接跟用戶說「UUPM 已就位，不用重裝」。

### Section E：驗證

```bash
test -f "$INSTALL_PATH/SKILL.md" && echo "✅ SKILL.md"
test -d "$INSTALL_PATH/references" && echo "✅ references/"
test -d "$INSTALL_PATH/templates" && echo "✅ templates/"
head -5 "$INSTALL_PATH/SKILL.md" | grep "name: landing" && echo "✅ frontmatter OK"
```

驗證通過後跟用戶說：

> ✅ 引導式 Landing Page 生成 安裝完成！位置：`[INSTALL_PATH]`
>
> **下一步**：
> 1. **關掉這個對話、開新的 Claude Code 對話**（讓 Skill 載入 `/` 選單）
> 2. 打 `/landing`，它會從 A1 開始問「要做哪種銷售頁」
> 3. 大約 20-30 分鐘後，瀏覽器會自動打開你的第一張 landing page
>
> **改文案重跑**：`/landing --restyle {slug}`（讀既有 answers.json 不用從頭答）

---

## 授權

- **License**：CC BY-NC-SA 4.0 · 個人使用、學習、分享自由；禁止商業用途
- 出自 雷蒙三十 Starter Kit — cc.lifehacker.tw | CC BY-NC-SA 4.0
- [迷你課](https://lifehacker.tw/courses/24hr-claude-code-tutorial) · [週報](https://raymondhouch.com/subscribe) · [Threads @raymond0917](https://www.threads.com/@raymond0917)
