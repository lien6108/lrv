# Claude Code 迷你課 — 協作規範

> 這份文件是 `claude-code-mini-course` 專案的協作規範。
> 任何 AI 或人類協作者在編輯這個專案時，都必須遵守以下慣例。
> Claude Code 進入此資料夾會自動載入這份檔案。

---

## 專案定位

付費迷你課的內容開發空間。學員付費後透過 Teachify 取得內容，所以：

- **不需要「付費升級引導」callout**（NOTE 藍色區塊），學員已經付費
- **可以放付費限定的 pro-kit / skills / templates**（這是付費內容）
- **starter-kit 連結指向公開 repo**（`Raymondhou0917/claude-code-resources`）

---

## 檔案命名規範

### docs/ 教學文

格式：`{章}-{節} {中文空格英文空格}.md`

✅ 正確範例：
- `1-1 開始安裝配置你的 Claude Code.md`
- `1-2 GitHub 與 Git 入門.md`
- `2-2 Claude Code 完整架構速覽.md`

❌ 錯誤範例：
- `1-1-開始安裝配置你的Claude-Code.md`（沒空格、用連字號）
- `1-1 開始安裝配置你的Claude Code.md`（英文前後沒空格）

**規則**：
- 章節編號後接空格（不是連字號）
- 中文和英文之間要有空格
- 英文單字之間也要有空格
- 標點符號用全形（？、！、「」）

### pro-kit/ 武功秘笈

格式：`{編號}-{英文-連字號}.md`

✅ 正確範例：
- `01-agent-folder-setup.md`
- `03-tool-integration.md`
- `04-brainstorm.md`
- `05-social-cards.md`（配 skills/social-cards/）
- `06-landing-page.md`（配 skills/landing-page/）

**規則**：
- 檔名一律英文，方便 URL 引用
- **編號不嚴格對應類別**，依發布順序累加；類別有兩種：
  - 一次性引導工作流（agent 基建 / 設定類）：01 agent setup、02 skill creator、03 tools、04 brainstorm、07 cross-device sync…
  - Skill 安裝引導：pro-kit 只保留行銷段落 + `git sparse-checkout` 指令去 repo 拉 `skills/{name}/`，Skill 本體不再 inline（目前為 05 social-cards、06 landing-page）

### skills/ 招式學習器（常駐 Skill）

**資料夾結構**（正統 Claude Code Skill 格式）：

```
skills/{skill-name}/
├── SKILL.md              ← Claude 讀的主劇本，含 YAML frontmatter
├── README.md             ← 給學員（人）看的安裝 + 使用介紹
├── assets/               ← 模板檔（HTML、Markdown 範例）
├── references/           ← 補充說明文件
├── templates/            ← 可被 SKILL.md 讀取的樣板
└── scripts/              ← 執行用腳本（Python / JS）
```

**SKILL.md frontmatter 標準**：

```yaml
---
name: skill-name           # 對應 /command 名稱，必須跟資料夾同名
version: 1.0.0
description: |
  完整描述（含觸發時機、使用場景）。description 會被模型拿來判斷要不要觸發，前置最重要的關鍵字。
user-invocable: true       # true = 可被 /command 呼叫；false = 純背景知識庫
last-updated: YYYY-MM-DD
author: Raymond Hou
tags:
  - category-1
  - category-2
---
```

**資料夾命名原則**：
- 資料夾名稱跟 `SKILL.md` 的 `name` 欄位**必須一致**（否則 `/command` 不會出現）
- 跨平台通用：不用全形字、不用空格、一律小寫英文 + 連字號
- Skill 內部檔案路徑都是相對於 SKILL.md，例如 `assets/cover.html`、`scripts/screenshot.mjs`

**兩種學員安裝方式**：
1. **資料夾複製** — `cp -r skills/{name}/ ~/.claude/skills/{name}/`（進階學員）
2. **pro-kit 引導安裝** — 學員把 `pro-kit/NN-{name}.md` 貼給 AI，AI 會用 `git sparse-checkout` 從 repo 拉對應的 `skills/{name}/`（推薦）

### 影片腳本

格式：`0-影片腳本-{主題}.md`
- `0-` 前綴讓影片腳本類檔案排在其他編號之前

---

## H2 分隔線規範

**每個 `## H2` 前面都必須加一條 `---` 分隔線**（`# H1` 標題下方第一個 H2 除外，因為開頭已有 YAML/導讀區塊分隔）。

GitHub 渲染 Markdown 時，H2 之間如果沒有分隔線，大段落會黏在一起很難閱讀。用 `---` 切開視覺段落。

✅ 正確：
```markdown
內容段落最後一行。

---

## 新的 H2 段落
```

❌ 錯誤：
```markdown
內容段落最後一行。

## 新的 H2 段落    ← 缺分隔線，視覺黏在一起
```

**只適用 H2**。H3/H4 不用，否則切太碎反而亂。

---

## 人稱自由切換規範（以自然、可讀為準）

這份教材在 README.md 的「關於這份教材的撰寫」明確揭露「雷蒙 × 雷小蒙 共筆」的本質，所以讀者讀到語氣切換時不會困惑。基於這個前提：

**兩種人稱都合法，也不強制段落內統一**：
- **第一人稱**（「我」「雷蒙」）：雷蒙本人直接講話、經驗、判斷
- **第三人稱**（「雷蒙...」「雷蒙發現」）：雷小蒙在整理、轉述、補充

**什麼時候混用是加分的？**
- **類似對話/小說的呈現**：雷蒙做了 A，他發現... → 我自己回頭看覺得... — 這種切換有節奏感
- **內觀外觀對照**：第三人稱描述行動、第一人稱補內心思考
- **案例 + 感想**：前面轉述案例用第三人稱、後面加上「我覺得...」

**什麼時候該避開？**
- ❌ 純資訊性段落（步驟指示、FAQ 答案）不要刻意切換，一致比較清楚
- ❌ 同一句話內混用（「雷蒙跟我說...」這種讀起來像第三者在轉述，但作者就是雷蒙本人）

**編輯判斷原則**：朗讀一次，順口就好。不用機械化檢查，**自然、有節奏、讀得懂就是對的**。

---

## 多圖並排規範（HTML table）

**同一段內容如果有 2 張以上的相關截圖，一律用 HTML table 並排，不要單欄堆疊。**

單欄一張一張排會把版面拉得很長，學員要一直滑；並排可以一眼看完整個流程，閱讀性大幅提升。

GitHub 的 sanitizer 會過濾 CSS flexbox / inline style，**只有 HTML table 能穩定渲染並排**。

✅ **標準範本**（兩張圖 + 步驟編號圖說）：

```html
<table>
  <tr>
    <td width="50%"><img src="images/step1.webp" alt="步驟 1" width="100%"></td>
    <td width="50%"><img src="images/step2.webp" alt="步驟 2" width="100%"></td>
  </tr>
  <tr>
    <td align="center">① 圖說 A</td>
    <td align="center">② 圖說 B</td>
  </tr>
</table>
```

**關鍵屬性**：
- `<td width="50%">` 控制左右等寬，`<img width="100%">` 圖片填滿格子
- 第二行 `<tr>` 放圖說，用 `①②③` 編號讓學員看得出順序
- 三張圖就 `width="33%"`，依此類推
- 不需要 `<table border>`、`<table style>`，GitHub 會用預設樣式渲染

**使用時機**：
- 同一個操作流程的連續截圖（步驟 1 → 步驟 2）
- 對比類截圖（前 vs 後、A 方案 vs B 方案）
- 同類選項展示（拼圖驗證 vs 語音驗證）

**不適用**：
- 單獨一張主視覺圖 → 維持 `<p align="center">` + `width="70%"` 的可點擊封面格式
- 圖跟圖之間有大段文字解說 → 維持單欄，並排會把文字脈絡切碎

---

## 外站連結標記慣例

**外站連結（非本 repo 內部連結）在連結文字後面加 `↗` 符號**，提醒學員這會跳出頁面。

GitHub 渲染 Markdown 時會過濾 `target="_blank"`，沒辦法強制另開分頁。解法是：
1. 文字加 `↗` 作視覺提示
2. 每篇教學文在**第一個外站連結出現前**放一個 TIP callout，教學員 Cmd/Ctrl+點擊另開分頁

✅ 正確：
```markdown
點[這支影片 ↗](https://youtu.be/xxx)看完整示範。
[Obsidian ↗](https://obsidian.md) 是一個免費的編輯器。
```

❌ 不需要加 `↗` 的情境：
- 指向 repo 內部檔案：`[1-2 單元](<docs/1-2 xxx.md>)`
- 指向同 repo pro-kit / skills：`[pro-kit 01](<../pro-kit/01-xxx.md>)`

**TIP callout 範本**（放在第一個外站連結出現前）：
```markdown
> [!TIP]
> **點外站連結時，記得另開分頁**
> 只要看到連結後面有 `↗` 符號，就是會跳去外站。
> - **Mac**：按住 `Cmd` 再點
> - **Windows**：按住 `Ctrl` 再點
```

---

## Alert Callout 使用規範

**本專案只用 4 種 callout**（學員已有完整內容，不使用 NOTE 藍色區塊）：

```markdown
> [!TIP]
> **實用小技巧**
> 分享額外的小撇步、替代方案、或是容易忽略但很有用的資訊。

> [!IMPORTANT]
> **升級包（starter-kit / pro-kit / Skill）**
> 標示「這段搭配哪個升級包」。學員看到紫色區塊就知道：有東西可以直接餵給 AI 安裝。

> [!WARNING]
> **常見踩坑提醒**
> 標示「很多人在這裡踩過坑」的段落，預防學員犯同樣的錯。

> [!CAUTION]
> **危險操作警告**
> 標示「做錯了可能會丟資料或造成不可逆的後果」的操作。
```

**使用時機**：
- `TIP` — 替代方案、小撇步、延伸工具推薦
- `IMPORTANT` — 「搭配這個升級包一起用」的引導（最重要的區塊）
- `WARNING` — 常見踩坑、安全提醒、授權注意事項
- `CAUTION` — 真的會丟資料的危險操作

**絕對不用 `[!NOTE]`**

---

## 可點擊封面圖統一格式

需要做「大圖點擊跳轉」的封面圖時，**不要用 Markdown `![]()` 語法**（滿版太壓迫）。
一律用以下 HTML 格式：

```html
<p align="center">
  <a href="目標網址">
    <img src="圖片網址" alt="描述" width="70%">
  </a>
</p>
```

**三個關鍵屬性**：
1. `<p align="center">` — 居中顯示
2. `width="70%"` — 留呼吸感，不佔滿整行
3. `<a>` 包起來讓整張圖可點擊

**使用時機**：
- YouTube 影片縮圖 + 跳轉
- WordPress 文章封面 + 跳轉
- Landing Page 預覽圖 + 跳轉
- 任何「點這張圖去那邊」的入口

**不適用的情境**：
- 文章內的說明截圖 → 用 Markdown `![]()` 就好
- Callout 區塊內的小圖示
- 多張圖並列的 gallery

**為什麼不用 Markdown 語法**：
- 無法調整寬度（永遠 100% 滿版）
- 無法居中
- 視覺壓迫感太重，擠壓文字閱讀空間

**範例參考**：`docs/1-1 開始安裝配置你的 Claude Code.md` 的開頭區塊

---

## 圖片資源位置

### docs/images/ — 教學文用圖

截圖、說明圖放這裡：
- `obsidian-editor-overview.jpg`
- `claude-code-error-example.jpg`
- `github-commit-history.jpg`

### R2 圖床 — 封面圖、共用素材

跨平台共用的圖片用 R2：
- YouTube 縮圖：`https://image.lifehacker.tw/youtube/cc-tutorial-上集.jpg`
- WP 文章封面：從 `https://raymondhouch.com/wp-content/uploads/...` 直接引用

R2 圖片索引：`000_Agent/memory/auto-memory/reference_reusable-image-assets.md`

---

## 寫作語氣與受眾

**受眾**：已經付費的迷你課學員，大多是非工程師的超級個體 / 創作者 / 自由工作者。

**語氣**：
- 繁體中文
- 親切、不說教、不擺架子
- 技術術語要先用白話文解釋（例如「CronJob = 鬧鐘」「MCP = AI 的 USB 插座」）
- 允許用「你」「我」「雷蒙」第一人稱，像跟朋友聊天一樣
- 避免簡體中文用詞（視頻→影片、信息→訊息、用戶→學員 / 使用者）

**敘事風格**：
- 先講「你會遇到的問題」（痛點共鳴）
- 再講「為什麼這樣做」（動機）
- 最後才是「怎麼做」（步驟）
- 用真實案例和比喻（Google Drive、遊戲存檔、新助理⋯）

---

## 教學文結構模板

```markdown
# 標題

> 迷你課第 N-N 單元｜入門篇 / 基礎篇 / 應用篇
> 一兩句話說明這篇在教什麼

---

## 痛點切入（你一定遇過這個問題）

具體描述學員的困擾，讓他們覺得「對，就是我」

---

## 核心觀念（用比喻講清楚）

白話文解釋概念，用熟悉的東西類比

---

## 動手做（步驟 / 搭配升級包）

> [!IMPORTANT]
> **升級包**
> - 對應的 starter-kit / pro-kit

---

## 常見問題 FAQ

---

## 這篇學完你有了什麼

- ✅ ...
- ✅ ...

**下一步**：N-N 會教你 ...
```

---

## Git commit 規範

遵循 `000_Agent/skills/git-conventions/SKILL.md` 的規範：

- 中文 commit message
- 類型前綴：`feat:` / `fix:` / `docs:` / `style:` / `refactor:` / `chore:`
- 用戶說「推上去」= add + commit + push 一次完成

### Obsidian Frontmatter 自動剝離

這個專案的 `.md` 檔案雷蒙會用 Obsidian 編輯，Obsidian 會自動在檔頭寫入：

```yaml
---
created: 2026-04-15T12:00
updated: 2026-04-16
---
```

**這類 frontmatter 不該進 GitHub**（GitHub 已有 commit 歷史，重複且會污染學員看到的教學文預覽）。但也不該從本地剝掉（Obsidian 會再加回來，造成 diff 噪音）。

**解法**：`.githooks/pre-commit` 會在 commit 時自動從 **git index** 剝離只含 `created` / `updated` 的 frontmatter，**working tree 完全不動**，Obsidian 繼續開心。Skill / 其他合法 frontmatter（含 `name:` / `description:` / `tags:` 等）不會被剝。

#### AI 協作者：進入這個 repo 第一件事

**Session 首次在這個 repo 動到 git 之前，必須檢查 hooksPath 是否已啟用**：

```bash
[ "$(git config --get core.hooksPath)" = ".githooks" ] || bash scripts/setup-hooks.sh
```

- 如果已設 → 什麼都不會發生
- 如果沒設 → 自動跑 `scripts/setup-hooks.sh` 啟用
- **不要**等用戶說「推上去」才發現 hook 沒啟用

#### AI 協作者：其他原則

- 不要主動去刪用戶 working tree 的 Obsidian frontmatter（那是 Obsidian 的工作）
- commit 前不用手動處理 frontmatter，hook 會自動做
- 如果遇到「某檔案推上去後還有 frontmatter」→ 表示協作者 clone 後沒跑 setup-hooks.sh，提醒對方跑一次
- 幫用戶修復歷史 commit 裡的 frontmatter 時，一次清多檔再一起 commit（避免噪音 commit）

---

## 開發狀態追蹤

每次教學文進度變動，同步更新：
1. `README.md` 的「課綱總覽」表格（狀態欄位）
2. `README.md` 的「開發狀態」表格

狀態用語：
- `雷蒙編輯中` — 雷蒙在寫原始草稿
- `雷蒙修潤中` — 雷蒙在修潤 AI 草稿
- `Chase 編輯中` — 設計師在做校正
- `📝 草稿完成` — 草稿齊了，等下一步
- `🔧 優化中` — 正在迭代
- `— 待開發` — 尚未開始

---

*Last Updated: 2026-04-18*
