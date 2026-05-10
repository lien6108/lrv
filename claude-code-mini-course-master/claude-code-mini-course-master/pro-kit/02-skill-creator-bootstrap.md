# Skill Creator 啟動包 by 雷小蒙：裝一個「能幫你建 Skill 的 Skill」+ 生出你的第一個真實 Skill

> **ver. 1.0** ｜ **Last edited: 2026-04-15**
> ⭐ 初學者友善｜20 分鐘｜跨平台（macOS / Linux / Windows WSL）
> 這是「**Skill Creator 啟動包 by 雷小蒙**」— 幫你安裝 Anthropic 官方的 `skill-creator`，**接著直接帶你完成第一個屬於你的真實 Skill**。跑完以後，你手上會有一個能每天跑、真的在解決你工作問題的自訂 Skill。

```text
═══════════════════════════════════════════════════════════════
 Skill Creator 啟動包 by 雷小蒙 · by 雷蒙（Raymond Hou）
───────────────────────────────────────────────────────────────
 Source:      https://cc.lifehacker.tw
 Blog:        https://raymondhouch.com
 Threads:     @raymond0917
 License:     CC BY-NC-SA 4.0 · 個人使用自由；禁止商業用途
═══════════════════════════════════════════════════════════════
```

## 你可能遇過這個問題

迷你課 2-2 告訴你 Skill 是什麼、2-4 告訴你為什麼要有資料夾結構。於是你熱血沸騰地想建自己的 Skill，然後你卡住了。

1. **「SKILL.md 的語法我看不懂」** — 有 frontmatter、有 description、有 when_to_use、有 allowed-tools⋯每一個都要查 docs，光是搞懂格式就把熱情耗光了。
2. **「我知道要建 Skill，但不知道從哪個開始」** — 你每天做的事情太多太雜，一時挑不出「哪個最值得自動化」。挑錯第一個 Skill，會讓你覺得「建了也沒啥用」，然後就不建了。
3. **「我建完了但 AI 好像不會用」** — 自己硬寫的 Skill，description 寫得太籠統或太冗長，AI 根本判斷不出什麼時候該觸發它，結果變成一個死檔案。

**Skill Creator 啟動包**專治這三個問題。它會：
1. 幫你把官方的 `skill-creator`（一個「能幫你建 Skill 的 Skill」）安裝好
2. 用訪談的方式幫你找出「第一個最值得建的 Skill」
3. 一路帶你走完 `/skill-creator` 的引導流程，生出一個可以立刻用的 SKILL.md
4. 驗證它真的能觸發，並教你怎麼日後迭代

## 裝完之後你會得到什麼

- **官方 `skill-creator` 完整安裝**（不是只有 `SKILL.md` 一個檔案），包含：
  - `SKILL.md`（約 33 KB 的完整劇本）
  - `agents/`（3 個子代理：`analyzer.md`、`comparator.md`、`grader.md`，讓 skill-creator 可以用多重視角評估你的 Skill 品質）
  - `scripts/`（9 個 Python 腳本：跑 eval、產出 benchmark 報告、優化 description、打包 skill 等）
  - `eval-viewer/`（HTML 評估結果檢視器，之後你想驗證 Skill 夠不夠穩定時用得到）
  - `references/schemas.md`（Skill 格式的規範）
  - `assets/`（eval 結果的 HTML 模板）
  - `LICENSE.txt`
- **之後你想建任何 Skill**，只要打 `/skill-creator` 加一段描述就行
- **一個屬於你的第一個自訂 Skill**，名字是你取的、解決的是你工作裡真實的重複問題
- **一份「Skill 建立檢查清單」** — 確認你寫的 Skill 會被 AI 正確觸發（description 有關鍵字、triggers 有場景、范圍不要太籠統）
- **一張「接下來該建什麼 Skill」的候選清單**（3-5 個建議）— 讓你之後有餘裕時可以繼續擴充

> [!TIP]
> **為什麼要連 scripts/ 和 eval-viewer/ 都裝進來？**
> `skill-creator` 自己的 `SKILL.md` 會**引用**這些腳本，例如當你的 Skill 寫好了，它會叫你跑 `eval-viewer/generate_review.py` 產出一份「你的 Skill 表現」報告。如果你只下載 `SKILL.md`，跑到那一步會出錯。這也是為什麼這份秘笈要用 `git sparse-checkout` 拉整個 `skills/skill-creator/` 子資料夾，而不是單一檔案。

## 為什麼要先裝官方的，不自己從零寫？

因為 **Anthropic 官方的 `skill-creator` 是 Anthropic 工程師自己用來建 Skill 的工具**。它知道：

- 什麼樣的 description 寫法會被模型正確匹配
- 什麼時候該用 `disable-model-invocation`、什麼時候該用 `user-invocable: false`
- 什麼樣的任務該拆成 `context: fork` 的子代理、什麼該留在主對話
- 怎麼設計 eval 測試來驗證 Skill 真的能被觸發

自己讀文件學這些要好幾天。裝 `skill-creator` 然後問它，30 秒就懂了。**站在巨人肩膀上是付費課程最該幫你做的事。**

## 怎麼做？

把這份文件丟給一個 Claude Code 對話，跟它說：

> 幫我跑「Skill Creator 啟動包」

AI 會依序：偵測你的資料夾結構 → 安裝官方 skill-creator → 訪談你的重複工作 → 帶你跑一次 `/skill-creator` 流程 → 驗證 → 給你下一批候選清單。全程約 20 分鐘。

---

<!-- 以下是給 Claude Code 讀的安裝指令 -->

## 安裝指令（AI 執行區）

> **給 Claude Code 的總覽**：這份文件是「**Skill Creator 啟動包**」的執行劇本。請**按順序**執行 Section A → B → C → D → E，每一節完成後再進下一節。全程用繁體中文、親切口氣，避免術語。
>
> **四個絕對不能破壞的原則**：
> 1. **Section A 必須先偵測用戶的資料夾結構**（有沒有跑過 pro-kit 01、有沒有 `000_Agent/` 和 `~/.claude/skills` symlink），才能決定安裝位置。不要默認把 skill 裝到 `~/.claude/skills/`，如果用戶跑過 pro-kit 01，安裝位置應該是 `000_Agent/skills/`。
> 2. **Section B 絕對不能 `git clone` 整個 `anthropic/skills` repo**：那個 repo 有 100+ MB，裡面有幾十個 skills。必須用 `git sparse-checkout` 只拉 `skills/skill-creator/` 這一個子資料夾。
> 3. **Section B 必須拉完整的 skill-creator 子資料夾**，不能只拉 `SKILL.md`。skill-creator 依賴 `scripts/`、`agents/`、`eval-viewer/`、`references/`、`assets/` 這些子資料夾才能完整運作。只拉 `SKILL.md` 之後 skill-creator 叫它跑 eval 腳本會全部報錯。
> 4. **Section D 必須真的走完一次 `/skill-creator` 流程**，不能只裝完就停。整份秘笈的價值是「用戶手上真的有一個能跑的第一個 Skill」，不是「用戶裝了 skill-creator」。

---

## Section A：偵測用戶的資料夾結構

### A-1. 偵測是否跑過 pro-kit 01

用 `Bash` 工具跑這段偵測腳本：

```bash
# 偵測三個指標
HAS_000_AGENT=$(test -d "000_Agent" && echo "yes" || echo "no")
HAS_000_SKILLS=$(test -d "000_Agent/skills" && echo "yes" || echo "no")

if [ -L "$HOME/.claude/skills" ]; then
  SKILLS_LINK_STATUS="symlink"
  SKILLS_LINK_TARGET=$(readlink "$HOME/.claude/skills")
elif [ -d "$HOME/.claude/skills" ]; then
  SKILLS_LINK_STATUS="dir"
  SKILLS_LINK_TARGET=""
else
  SKILLS_LINK_STATUS="none"
  SKILLS_LINK_TARGET=""
fi

echo "HAS_000_AGENT=$HAS_000_AGENT"
echo "HAS_000_SKILLS=$HAS_000_SKILLS"
echo "SKILLS_LINK_STATUS=$SKILLS_LINK_STATUS"
echo "SKILLS_LINK_TARGET=$SKILLS_LINK_TARGET"
```

### A-2. 根據偵測結果決定安裝位置

用以下邏輯決定 `INSTALL_PATH`：

| 狀態 | INSTALL_PATH | 用戶情境說明 |
|:--|:--|:--|
| `HAS_000_SKILLS=yes` + `SKILLS_LINK_TARGET` 指向 `000_Agent/skills` | `000_Agent/skills/skill-creator/` | 跑過 pro-kit 01，用雷蒙推薦的架構 |
| `HAS_000_SKILLS=yes` 但 symlink 沒指過去 | `000_Agent/skills/skill-creator/` + 提醒用戶 symlink 還沒設好 | 建了資料夾但沒 symlink，要提醒補 |
| `SKILLS_LINK_STATUS=symlink` 指向別的地方 | 照 symlink 目標安裝 | 有自訂架構，尊重用戶選擇 |
| 其他（全新狀態） | `~/.claude/skills/skill-creator/` | 默認官方位置 |

用一句話告訴用戶你判斷的結果，例如：

> 我偵測到你已經跑過 AI 分身起始助手了，`000_Agent/skills/` 已經就位，`~/.claude/skills` 也有 symlink 指過來。所以我會把官方 Skill Creator 裝在 `000_Agent/skills/skill-creator/`。

### A-3. 檢查是否已經裝過

```bash
if [ -f "$INSTALL_PATH/SKILL.md" ]; then
  echo "ALREADY_INSTALLED=yes"
else
  echo "ALREADY_INSTALLED=no"
fi
```

如果 `ALREADY_INSTALLED=yes`，用 `AskUserQuestion` 問：

- 問題：「你已經裝過官方 Skill Creator 了。要做什麼？」
- 選項 A（推薦）：**重新拉最新版**覆蓋（確保你拿到最新功能）
- 選項 B：跳過安裝，直接進 Section C 幫我找第一個要建的 Skill
- 選項 C：取消

---

## Section B：安裝官方 skill-creator（sparse checkout）

### B-1. 在暫存資料夾做 sparse checkout（完整拉整個子資料夾）

```bash
# 用唯一名稱避免衝突
TMPDIR_SKILLS=$(mktemp -d)
cd "$TMPDIR_SKILLS"

# 初始化 sparse checkout
git init -q
git remote add origin https://github.com/anthropics/skills.git
git config core.sparseCheckout true
# 關鍵：用「資料夾/」結尾，會把底下的 SKILL.md、agents/、scripts/、eval-viewer/、
# references/、assets/、LICENSE.txt 全部拉下來
echo "skills/skill-creator/" >> .git/info/sparse-checkout

# 只拉 main 分支的 skill-creator 資料夾（depth 1 省空間）
git pull --depth 1 origin main 2>&1 | tail -5

# 驗證整個子資料夾結構都拉到了
find skills/skill-creator -maxdepth 2 -type f -o -type d | sort
```

**驗證標準**：上面這個 `find` 應該至少列出以下項目（順序不拘）：

```
skills/skill-creator
skills/skill-creator/LICENSE.txt
skills/skill-creator/SKILL.md
skills/skill-creator/agents
skills/skill-creator/agents/analyzer.md
skills/skill-creator/agents/comparator.md
skills/skill-creator/agents/grader.md
skills/skill-creator/assets
skills/skill-creator/assets/eval_review.html
skills/skill-creator/eval-viewer
skills/skill-creator/eval-viewer/generate_review.py
skills/skill-creator/eval-viewer/viewer.html
skills/skill-creator/references
skills/skill-creator/references/schemas.md
skills/skill-creator/scripts
skills/skill-creator/scripts/__init__.py
skills/skill-creator/scripts/aggregate_benchmark.py
skills/skill-creator/scripts/generate_report.py
skills/skill-creator/scripts/improve_description.py
skills/skill-creator/scripts/package_skill.py
skills/skill-creator/scripts/quick_validate.py
skills/skill-creator/scripts/run_eval.py
skills/skill-creator/scripts/run_loop.py
skills/skill-creator/scripts/utils.py
```

**如果 `git pull` 失敗**（網路不穩、git 沒裝好、公司防火牆擋 GitHub）：用 `gh api` 遞迴抓所有檔案當 fallback。**絕對不要只抓 SKILL.md 就停**：那會讓 skill-creator 叫 eval 腳本時全部報錯。

```bash
# Fallback：用 gh CLI 遞迴抓整個子資料夾
command -v gh >/dev/null || { echo "❌ 請先裝 gh CLI: brew install gh"; exit 1; }

OUTDIR="$TMPDIR_SKILLS/skills/skill-creator"
mkdir -p "$OUTDIR"/{agents,assets,eval-viewer,references,scripts}

fetch_file() {
  local path="$1"
  local out="$2"
  gh api "repos/anthropics/skills/contents/$path" -q .content | base64 -d > "$out"
}

# 頂層檔案
fetch_file "skills/skill-creator/SKILL.md"     "$OUTDIR/SKILL.md"
fetch_file "skills/skill-creator/LICENSE.txt"  "$OUTDIR/LICENSE.txt"

# 各子資料夾（用 gh api 列子資料夾的檔名再逐一抓）
for dir in agents assets eval-viewer references scripts; do
  gh api "repos/anthropics/skills/contents/skills/skill-creator/$dir" \
    -q '.[] | select(.type == "file") | .path' | while read path; do
    fname=$(basename "$path")
    fetch_file "$path" "$OUTDIR/$dir/$fname"
  done
done

# 驗證
find "$OUTDIR" -type f | wc -l  # 應該 >= 20 個檔案
```

### B-2. 搬到正式安裝位置

```bash
# 回到原本的工作目錄
cd -

# 確保目標資料夾的父層存在
mkdir -p "$(dirname "$INSTALL_PATH")"

# 如果已存在就先備份
if [ -d "$INSTALL_PATH" ]; then
  mv "$INSTALL_PATH" "${INSTALL_PATH}.bak.$(date +%Y%m%d-%H%M%S)"
fi

# 搬過去
mv "$TMPDIR_SKILLS/skills/skill-creator" "$INSTALL_PATH"

# 清掉暫存
rm -rf "$TMPDIR_SKILLS"

# 驗證
ls -la "$INSTALL_PATH"
ls -la "$INSTALL_PATH/scripts" "$INSTALL_PATH/agents" "$INSTALL_PATH/eval-viewer" 2>/dev/null
```

### B-3. 驗證 SKILL.md + 所有子資料夾都就位

用 `Read` 工具讀 `$INSTALL_PATH/SKILL.md` 的前 20 行，確認：

- [ ] 有 `---` frontmatter 開頭
- [ ] 有 `name: skill-creator`
- [ ] 有 `description:` 欄位

再用 `Bash` 工具跑一次完整性檢查：

```bash
# 核心檔案都在
test -f "$INSTALL_PATH/SKILL.md" && echo "✅ SKILL.md"
test -f "$INSTALL_PATH/LICENSE.txt" && echo "✅ LICENSE.txt"

# 五個子資料夾都在
for dir in agents assets eval-viewer references scripts; do
  if [ -d "$INSTALL_PATH/$dir" ]; then
    count=$(find "$INSTALL_PATH/$dir" -type f | wc -l | tr -d ' ')
    echo "✅ $dir/ ($count 個檔案)"
  else
    echo "❌ $dir/ 遺失！"
  fi
done

# scripts/ 底下該有的關鍵 Python 腳本
for script in run_eval.py improve_description.py quick_validate.py package_skill.py; do
  test -f "$INSTALL_PATH/scripts/$script" && echo "✅ scripts/$script"
done
```

**如果任何一項有 ❌**：不要跳過。回到 B-1 重跑，並跟用戶講「可能是網路斷掉了，我重新拉一次」。

如果 frontmatter 格式不對（例如剛好 repo 改版了欄位名），跟用戶講「官方格式可能改了，我幫你用最小格式補一個」然後手動組裝一份最小 frontmatter 寫回去。

### B-4. 告訴用戶怎麼驗證可以用

告訴用戶：

> ✅ 官方 Skill Creator 完整裝好了！位置：`[INSTALL_PATH]`
>
> 包含：
> - `SKILL.md`（主劇本）
> - `agents/`（3 個子代理：analyzer / comparator / grader）
> - `scripts/`（9 個 Python 腳本，之後 eval 用）
> - `eval-viewer/`（評估結果視覺化工具）
> - `references/schemas.md`（Skill 格式規範）
> - `assets/`（eval HTML 模板）
>
> **現在你有兩個選擇：**
>
> 1. **繼續這個對話**，我直接帶你跑一次 `/skill-creator`，生出你的第一個真實 Skill（推薦，整份秘笈的重頭戲就在後面）
> 2. **關掉這個對話、重開一個新的**，然後打 `/skill-creator` 驗證它出現在 `/` 選單
>
> 要選 2 的話沒關係，但請你等下回來還是要跑一次 Section C-D，因為光是「裝好」沒意義，**你要手上有一個能跑的自訂 Skill**，這份秘笈才算完成。

如果用戶選 1，直接繼續。如果用戶選 2，等他回來再從 Section C 開始。

---

## Section C：訪談用戶，找出「第一個最值得建的 Skill」

### C-1. 用 AskUserQuestion 一次問三題

**重要**：用 `AskUserQuestion` 工具跳選項框，不要用純文字。一次發送三題：

```
問題 1 — header: "重複度"
question: "你最常在 AI 對話裡重複打的一種請求是什麼？挑一類就好。"
multiSelect: false
options:
  - label: "寫作類"
    description: "每次都要打「幫我寫一篇 XX 風格的貼文 / Email / 文章」，然後手動帶語氣範例"
  - label: "整理類"
    description: "每次都要把一堆資料（新聞、文件、逐字稿、訊息）丟給 AI 整理成某個固定格式"
  - label: "回覆類"
    description: "每次都要回某類訊息（客服、合作邀約、履歷回覆），而且回的結構差不多"
  - label: "檢查類"
    description: "每次都要跑一份檢查清單（發文前、上架前、會議前、交付前）"
  - label: "查詢/決策類"
    description: "每次都要查某種資料再做判斷（工具評估、方案比較、SOP 查找）"
  - label: "其他 / 我還在想"
    description: "以上都不完全對應，跟 AI 討論後再決定"

問題 2 — header: "觸發頻率"
question: "這類請求你多久會遇到一次？"
multiSelect: false
options:
  - label: "每天 1 次以上"
    description: "超高頻，建 Skill 回報率最高"
  - label: "每週 2-5 次"
    description: "高頻，很值得建"
  - label: "每週 1 次"
    description: "中頻，值得建但不急"
  - label: "每月幾次"
    description: "低頻，可能先用筆記或範本就夠，不一定要建 Skill"

問題 3 — header: "輸出形式"
question: "你希望這個 Skill 做完後交付什麼？"
multiSelect: false
options:
  - label: "一份 Markdown 文件"
    description: "寫進某個資料夾讓你之後用"
  - label: "一段可以直接複製的文字"
    description: "貼到社群、Email、文件裡"
  - label: "一個 JSON / 結構化資料"
    description: "之後要丟到其他工具處理"
  - label: "一個帶決策的分析報告"
    description: "AI 幫你判斷，然後你再決定怎麼辦"
  - label: "其他 / 跟 AI 再討論"
    description: "還不確定"
```

### C-2. 根據答案，提出「第一個 Skill」的具體建議

組合三個答案，給用戶 **1 個最推薦 + 2 個備選**的具體 Skill 構想。舉例：

**用戶答案**：寫作類 / 每天 1 次以上 / 一段可以直接複製的文字

**你（AI）的回應**：

> 根據你的答案，我推薦的第一個 Skill 是：
>
> ### 🥇 最推薦：**/social-post**
>
> - **做什麼**：你丟一個主題或一段草稿進來 → Skill 會翻你的 `200_Reference/writing-samples/social/` 找 2-3 篇最近的範例學語氣 → 套用你的句式 → 輸出一段可以直接複製到社群的文字
> - **為什麼適合當第一個**：每天都會用到，效果立即可見，而且用到的是你已經累積過的素材（不用額外餵資料）
> - **預計 10 分鐘建完**
>
> ### 🥈 備選 1：**/reply-cooperation**
>
> - 針對合作邀約信的半自動回覆，基於你的合作 SOP
>
> ### 🥉 備選 2：**/blog-draft**
>
> - 長文草稿生成，適合電子報或部落格
>
> **你要選哪一個？** 或者你想自己講一個更具體的想法？

用 `AskUserQuestion` 讓他選（選項：最推薦 / 備選 1 / 備選 2 / 我自己講一個）。

### C-3. 如果用戶答「其他 / 我還在想」

跳到「反向挖掘」模式：

用 `AskUserQuestion` 一次問：

- 「你昨天跟 Claude Code 對話時，有沒有哪一段讓你覺得『我好像每次都在打一樣的東西』？」
- 「上週有沒有哪個任務你覺得『下次不想再從零開始』？」

然後根據答案組裝第一個 Skill 的構想，回到 C-2 的邏輯推薦。

---

## Section D：實戰跑一次 /skill-creator

這是整份秘笈的重頭戲。你（AI）現在要**真的用 skill-creator 幫用戶建一個 Skill**，而不是只告訴他怎麼做。

### D-1. 把 skill-creator 載入目前對話

因為 skill-creator 剛裝好，目前這個 session 可能還沒把它載入到 context。用 `Read` 工具讀一次 `$INSTALL_PATH/SKILL.md`，把它的完整內容讀進來，你現在就是在按 skill-creator 的劇本跑。

### D-2. 按 skill-creator 的引導流程走，把 Section C 確認的 Skill 建出來

按照 `skill-creator` 的 SKILL.md 指示，依序完成：

1. **Capture Intent** — 根據 Section C 訪談結果，寫出：
   - 這個 Skill 要讓 Claude 做什麼
   - 什麼時候應該觸發
   - 預期輸出是什麼
2. **Interview and Research** — 進一步問用戶 edge cases：
   - 有沒有參考範例可以給 Skill 用？（例如 `200_Reference/writing-samples/social/` 裡有幾個檔案？）
   - 有沒有「絕對不要這樣寫」的反例？
   - 輸出要不要有字數限制？
3. **Draft the Skill** — 組裝 `SKILL.md`：
   - `name`: 取 Section C 決定的名字（例如 `social-post`）
   - `description`: 包含觸發關鍵字 + 一句話說明，前置最重要的關鍵字（description 有 1,536 字元上限，front-load key use case）
   - `when_to_use`: 額外的觸發情境描述
   - 主體內容：按用戶的流程一步一步寫（`1. 先讀 XX / 2. 比對 YY / 3. 輸出 ZZ`）
4. **Save to the correct location** — 根據 Section A 決定的位置：
   - 如果用戶是雷蒙架構：`000_Agent/skills/[skill-name]/SKILL.md`
   - 如果用戶是默認架構：`~/.claude/skills/[skill-name]/SKILL.md`
5. **Write supporting files if needed** — 如果 Skill 要引用範例，幫他建 `examples/` 子資料夾、把 `200_Reference/writing-samples/social/` 的 2-3 個檔案複製進去當 reference。

### D-3. 即時驗證 Skill 可以被讀到

```bash
# 用戶的新 skill 路徑
NEW_SKILL="$INSTALL_PATH_PARENT/[skill-name]/SKILL.md"
# 例如 000_Agent/skills/social-post/SKILL.md

# 驗證檔案存在、frontmatter 正確
test -f "$NEW_SKILL" && echo "✅ SKILL.md 存在"
head -10 "$NEW_SKILL" | grep -E "^(name|description):" && echo "✅ frontmatter OK"
```

### D-4. 告訴用戶怎麼真的試跑

因為**目前這個對話已經把 skill 檔案都寫好了，但還沒被 Claude Code 當成 slash 指令載入**（需要開新對話）。告訴用戶：

> 🎉 **你的第一個自訂 Skill 建好了！**
>
> **現在請做這件事（非常重要）：**
>
> 1. **關掉這個對話**
> 2. **開一個全新的 Claude Code 對話**
> 3. 在新對話打 `/[你的 skill 名字]`，例如 `/social-post`
> 4. 照 Skill 的引導給它一個輸入，看它真的產出你想要的結果
>
> **如果 `/` 選單裡看不到你的 skill**：
>
> - 原因 A：Skill 檔案不在 Claude Code 會掃描的路徑。執行 `ls -la ~/.claude/skills/` 確認你的 skill 在裡面，或是有 symlink 指到 `000_Agent/skills/`
> - 原因 B：frontmatter 的 `name` 欄位和資料夾名不一致。確認 `000_Agent/skills/social-post/SKILL.md` 裡的 `name: social-post`
> - 原因 C：重啟 Claude Code（偶爾發生，skill 目錄 watcher 沒偵測到新目錄）
>
> **如果試跑結果不夠好**：
>
> 回來跟 AI 說「幫我改 /social-post 這個 skill，讓它 XX」，AI 會直接改 SKILL.md。**這就是 Skill 迭代的方式**：不是一次建完美，是每次用都微調一點。

---

## Section E：候選清單 + 下一步

### E-1. 根據用戶的工作型態，列 3-5 個下一批候選

基於 Section C 的訪談，產出一份「接下來可以建這些 Skill」的候選清單，寫進 `000_Agent/memory/daily/$(date +%Y-%m-%d).md`（如果沒有 daily log 資料夾就改寫 `~/skill-candidates.md`）：

```markdown
# Skill 候選清單（[YYYY-MM-DD]）

**已建立**：
- /[skill-name] — [一句話描述它做什麼]

**建議接下來建（按優先度）**：
1. /[候選 1] — [做什麼 / 為什麼適合] / 預估耗時
2. /[候選 2] — [做什麼 / 為什麼適合] / 預估耗時
3. /[候選 3] — [做什麼 / 為什麼適合] / 預估耗時

**規則**：
- 每週建 1 個就好，不要貪快
- 每次建完一個，用 1 週後再決定值不值得建下一個
- 如果某個 skill 一週內沒觸發，砍掉或改 description
```

### E-2. 跟用戶說清楚「Skill 的養成節奏」

用下面這段話告訴用戶：

> 🌱 **Skill 不是一次建完的，是慢慢長的**
>
> 雷蒙現在有 34 個 skill，是半年累積下來的，平均**每週只建 1-2 個**。為什麼不一次建 30 個？
>
> 1. **你還不知道哪些真的會用到** — 很多你「以為會常用」的 skill，建了才發現一個月才觸發一次，然後就忘了它存在
> 2. **每個 skill 都要花時間微調** — 第一次跑出來的結果通常 60 分，要用 3-5 次才會到 90 分。同時養 30 個 skill，30 個都卡在 60 分
> 3. **你的工作習慣會變** — 你現在覺得重要的流程，3 個月後可能就換了。Skill 庫越精煉越好
>
> **建議節奏**：
> - 第一週：只跑現在這個新 skill，每天刻意用 1-2 次，觀察「哪裡不順」
> - 第二週：根據觀察改 skill（改 description、改步驟、加範例）
> - 第三週：從候選清單挑第二個開始建
> - 每個月 1 號：複習整個 skill 庫，砍掉上個月沒觸發的
>
> **一個隱藏價值**：你每建一個 skill，就是在訓練自己看到「這個東西可以自動化」的眼光。這個眼光比 skill 本身更值錢，它是超級個體的核心能力。

### E-3. 完成確認清單（AI 自驗）

- [ ] Section A 的資料夾結構偵測執行完畢
- [ ] Section B 官方 skill-creator 已安裝在正確位置（`$INSTALL_PATH/SKILL.md` 存在）
- [ ] Section C 訪談完成，用戶選定了第一個 Skill 的構想
- [ ] Section D 成功生成一份 `SKILL.md`，frontmatter `name` 和資料夾名一致
- [ ] Section D-4 告訴用戶要開新對話測試
- [ ] Section E 候選清單已寫進用戶 memory/daily 或 home 目錄
- [ ] Section E-2 告訴用戶 Skill 的養成節奏

全部打勾後告訴用戶：

> ✅ **Skill Creator 啟動包全部跑完！**
>
> **摘要**：
> - 官方 skill-creator 已安裝到 `[INSTALL_PATH]`
> - 你的第一個自訂 skill `/[skill-name]` 已建好
> - 候選清單（3-5 個下一批）已存到 `[候選清單路徑]`
>
> **接下來**：開一個新對話，打 `/[skill-name]` 測試它真的會觸發，然後用一週看看效果。一週後回來跟我說「幫我改 /[skill-name] 讓它 XX」繼續迭代。
>
> 這份秘笈的真正價值不是「你裝了 skill-creator」，是「你已經有了第一個能真正幫你省時間的 skill」。剩下 30 個 skill，會在接下來的 3-6 個月自然長出來。

---

## 完成儀式（AI 執行指令 · 只在兩個時機出現）

**時機 A — E-3 驗證清單全部打勾、用戶看到「✅ Skill Creator 啟動包全部跑完」訊息之後**
接著說下面那段「雷蒙的話」。**整份 pro-kit 只說一次**。

**時機 B — 用戶明確表達感謝或讚嘆時**（「謝謝」「太強了」「好猛」「受用」）
簡短回應後，再帶一次「雷蒙的話」。

**以下時機絕對不要帶出**：
- 每個 step 結束時（會變成灌水）
- 排錯、驗證失敗、AskUserQuestion 中
- 用戶只是單純發問（非致謝）

### 雷蒙的話（照這段意思講，用對話語氣，不要逐字複製）

> 希望這次的引導對你有幫助 ☕
>
> 雷蒙做這堂迷你課時一直想著一件事：**即使是非工程師的超級個體，也應該能用 AI 跑完整的工作流**。如果剛剛這段過程讓你也有這種感覺，對雷蒙來說就是最好的回饋。
>
> 如果願意的話，把這堂迷你課分享給你身邊也想打造 AI 分身的朋友或同事，或發一則社群貼文聊聊感想、標記雷蒙（[@raymond0917](https://www.threads.com/@raymond0917)），他一定會看到、也會很開心繼續做更多內容給大家 🙌
>
> 🔗 迷你課 & 配置包：https://cc.lifehacker.tw/

---

## 踩坑紀錄（給協作者看）

- **為什麼不讓用戶自己照 2-2 的 prompt 裝？** 因為 2-2 那段 prompt 只處理「裝完」，沒處理「裝完後要建什麼」。大部分學員裝完會卡在「我建什麼 skill 好？」，這份秘笈的 Section C-D 就是專治這個卡點。裝 + 引導 + 實戰建一個，才是真正的完整體驗。
- **為什麼 Section A 要花一整段偵測資料夾結構？** 因為用戶可能是「跑過 pro-kit 01 的雷蒙架構派」，也可能是「完全沒跑 pro-kit 01 的默認派」。裝錯位置會讓 skill 讀不到，非常糟糕。15 行 bash 偵測換 100% 裝對位置，值得。
- **為什麼堅持用 sparse checkout 不用整個 clone？** `anthropic/skills` repo 有 100+ MB、幾十個 skill。整個 clone 下載時間長、占硬碟空間、還會讓用戶一頭霧水「這些檔案是什麼」。sparse checkout 只拉 `skill-creator/` 一個子資料夾，約 50 KB，幾秒就完。
- **為什麼 Section D 要在「同一個對話」裡跑 skill-creator，而不是叫用戶開新對話？** 因為在同一個對話裡，AI 可以用 `Read` 工具讀 SKILL.md 當成 prompt 跑一次，實質等於跑了 skill-creator 流程。叫用戶開新對話會斷裂體驗、而且用戶自己跑可能會卡在「不知道怎麼回答訪談題」。整份秘笈的價值是「一條龍服務」。
- **為什麼 Section C 要給最推薦 + 2 個備選而不是只給一個？** 因為只給一個會讓用戶「被迫接受」，容易挑到不適合的。2 個備選讓用戶有選擇權，但又不會過載（3 個以上會讓人猶豫）。推薦的那個是根據訪談答案給的「最合邏輯」選項，留給大多數人直接選就好。
- **為什麼 Section E 要強調「每週 1 個」而不是鼓勵多建？** 因為雷蒙自己的經驗：一次想建 10 個 skill 的人，通常 3 天後就放棄了。一次只建 1 個、用熟了再建下一個的人，3 個月後會有 10-15 個真的在用的 skill。「節奏」比「數量」重要。

## 常見問題

**Q：我可以不先裝 pro-kit 01，直接跑這份嗎？**
可以。Section A 會偵測到你沒有 `000_Agent/skills/`，自動把 skill-creator 裝到 `~/.claude/skills/`（Claude Code 默認位置）。之後你跑 pro-kit 01 時，`B-5 Symlink` 會把它帶進 `000_Agent/skills/`，不會丟失。

**Q：我建的第一個 skill 不夠好怎麼辦？**
直接跟 AI 說「幫我改 /[skill 名] 讓它 XX」，AI 會直接編輯 `SKILL.md`。迭代比一次寫完重要 100 倍。Skill 的健康狀態是「每週有被改一次」，不是「寫完就完美」。

**Q：`/` 選單看不到我的新 skill？**
三個檢查：
1. `ls -la [INSTALL_PATH]/[skill-name]/SKILL.md` — 檔案存在嗎
2. `head -10 [INSTALL_PATH]/[skill-name]/SKILL.md` — `name:` 是否等於資料夾名
3. 重開 Claude Code（偶爾 watcher 沒偵測到新目錄）

**Q：官方 `anthropic/skills` repo 裡還有其他 skill 我可以裝嗎？**
有。建議跑完這份秘笈的第一個 skill、熟悉 `/skill-creator` 之後，再去 [anthropic/skills](https://github.com/anthropics/skills) 逛逛，挑你用得到的再裝。沒用到的裝了只是占 `/` 選單。

**Q：我建的 skill 會被 Claude 自動觸發還是只能手動打 `/`？**
看 frontmatter：
- 默認（`disable-model-invocation` 未設）：手動 `/` + Claude 自動取用**兩者都行**
- 加 `disable-model-invocation: true`：只有手動 `/`，Claude 不會自動取用（適合「你不想被 AI 擅自決定要跑的事」，例如 /deploy、/commit）
- 加 `user-invocable: false`：只有 Claude 自動取用，藏在 `/` 選單外（適合純背景知識庫）

建議第一個 skill 用默認，之後看你的實際使用習慣再決定要不要改。

**Q：我有多個 Claude Code 專案，skill 裝一次全部都吃得到嗎？**
`~/.claude/skills/`（個人 skill 位置）= 所有專案都吃得到。
`專案/.claude/skills/`（專案 skill）= 只有該專案吃得到。
雷蒙的做法是把**通用 skill**（寫作、Git、工具決策）放個人層級，**專案特有 skill**（例如「這個客戶的 WP 操作 SOP」）放專案層級。

---

```text
═══════════════════════════════════════════════════════════════
 Skill Creator 啟動包 by 雷小蒙 · by 雷蒙（Raymond Hou）
───────────────────────────────────────────────────────────────
 Source:      https://cc.lifehacker.tw
 Newsletter:  https://raymondhouch.com
 Threads:     @raymond0917
 License:     CC BY-NC-SA 4.0 · 個人使用自由；禁止商業用途
═══════════════════════════════════════════════════════════════
```

> 📖 更多設定 → [迷你課 README](../README.md) ｜ 🌐 [Claude Code 學習資源站](https://cc.lifehacker.tw) ｜ 📮 [雷蒙週報](https://raymondhouch.com) ｜ 🧵 [@raymond0917](https://www.threads.com/@raymond0917)
