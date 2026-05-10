# Claude Code 迷你課 — 學員專屬資源庫

> 嗨，歡迎加入《[24 小時開始活用 Claude Code（AI Agent）](https://lifehacker.tw/courses/24hr-claude-code-tutorial)》迷你課 🎉
>
> 這份 Private Repo 是你的「升級、補給技能包的倉庫」，所有教學文、給 AI 吃的武功秘笈、裝了就能用的招式學習器，全部放在這裡。你不用四處找，**點下面任何一個連結就會跳到對應單元**，這份 README 就是你的課程目錄。
>
> 公開免費的入門資源在 [claude-code-resources](https://github.com/Raymondhou0917/claude-code-resources)（Public Repo），迷你課的付費內容只存在這裡。

---

## 🎤 直播 Q&A 徵集中（五月後）

這堂迷你課包含 **1 小時的雷蒙 QA 直播問答**（預計五月後，時間確定會再公告）。
我想收集你的提問＆成果＆回饋評價或建議，留在下方任一則社群貼文的留言區，我會找時間整理，到時候在直播上一起回覆：

1. **想要雷蒙直播上回答、交流的問題**（卡關、想聽更深入的應用）
2. **你透過迷你課實踐的成果、學習筆記**（我會挑出來做案例展示，讓更多人認識你）
3. **對課程任何好評／回饋 / 建議**

👉 [Facebook 貼文留言去 ↗](https://www.facebook.com/share/p/1JAB6uua9w/)
👉 [Threads 貼文留言去 ↗](https://www.threads.com/@raymond0917/post/DXUk1Ymknlq)

> [!TIP]
> **不用擔心問題「太基礎」** — 有時候你卡的點，就是其他同學也沒講出來的點。期待你的留言 🙌🏼

---

## 🗂 這份 Repo 有什麼？

三個資料夾，涵蓋你在迷你課會用到的全部內容：

| 資料夾                | 你會拿到什麼      | 怎麼用                                              |
| :-------------------- | :---------------- | :-------------------------------------------------- |
| [`docs/`](docs)       | **13 篇教學文**   | 按課綱順序讀（入門 → 基礎 → 應用）                  |
| [`pro-kit/`](pro-kit) | **7+ 份武功秘笈** | 貼給你的 Claude Code，AI 會互動帶你裝好             |
| [`skills/`](skills)   | **3+ 個技能書**   | 複製到 `~/.claude/skills/` 後用 `/command` 隨叫隨到 |

> 📌 **pro-kit vs skills 的差別**
> - **pro-kit** = 一次性引導安裝（AI 會問你幾個問題，幫你配置完就收工）
> - **skills** = 常駐招式，裝好後可反覆 `/command` 呼叫

---

## 📚 課綱總覽（點標題直接跳到教學文）

### 🎬 開始之前

| #    | 標題                                                               |
| :--- | :----------------------------------------------------------------- |
| 0    | [有效學習這堂課的方法（必讀）](<docs/0_有效學習這堂課的方法？.md>) |

---

### 📘 入門篇｜從零開始

> 完全沒用過 Claude Code 的你，先搞定這三篇，建立基礎認知與環境。

| #    | 標題                                                                                       | 搭配升級包                                                                     |
| :--- | :----------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| 1-1  | [開始安裝、配置你的 Claude Code](<docs/1-1 開始安裝配置你的 Claude Code.md>)               | 🆓 [starter-kit 01-06](https://github.com/Raymondhou0917/claude-code-resources) |
| 1-2  | [GitHub 帳號 + Git 你只需要知道這些](<docs/1-2 GitHub 與 Git 入門.md>)                     | —                                                                              |
| 1-3  | [怎麼跟 Claude Code 提問／協作最有效](<docs/1-3 怎麼跟 Claude-Code 提問／協作最有效？.md>) | —                                                                              |

---

### 📗 基礎篇｜建立你的 AI 系統

> 不要只是用 Claude Code 來開發工具，更開始把它打造成「會記得你是誰、怎麼代替你工作」的 AI 分身。

| #    | 標題                                                                                   | 搭配升級包                                                                           |
| :--- | :------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| 2-1  | [讓 AI 記住你的偏好，不再每次從零教](<docs/2-1 讓 AI 記住你的偏好.md>)                 | 🔒 [pro-kit 01 · AI 分身起始助手](<pro-kit/01-agent-folder-setup.md>)                 |
| 2-2  | [Claude Code 完整架構速覽：還有這些功能可以用](<docs/2-2 Claude Code 完整架構速覽.md>) | 🔒 [pro-kit 02 · Skill Creator 啟動包](<pro-kit/02-skill-creator-bootstrap.md>)       |
| 2-3  | [把工具授權給 AI，組合出你的每日工作流](<docs/2-3 用 AI 管理你的筆記和每日反思.md>)    | 🔒 [pro-kit 03 · 外部工具整合包（MCP / API / CLI）](<pro-kit/03-tool-integration.md>) |
| 2-4  | [AI 分身資料夾結構：雷小蒙拆解](<docs/2-4 AI 分身資料夾結構：雷小蒙拆解.md>)           | 🔒 [pro-kit 07 · 跨裝置同步引導助手](<pro-kit/07-cross-device-sync.md>)               |

---

### 📙 應用篇｜實戰案例解構

> 看雷蒙怎麼真實地用 Claude Code 做出每天在用的東西，帶你跟你的 AI 一起做一次。

| #    | 標題                                                                                                                       | 搭配升級包                                                                                                           |
| :--- | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| 3-1  | [用 Plan Mode 讓 AI 先想清楚再動手](<docs/3-1 用 Plan Mode 讓 AI 先想清楚再動手.md>)                                       | 🔒 [pro-kit 04 · AI 規劃模式 /brainstorm](<pro-kit/04-brainstorm.md>)                                                 |
| 3-2  | [建立 DESIGN.md 品牌說明書（社群圖卡 & 簡報自動生成）](<docs/3-2 建立 DESIGN.md 品牌說明書（社群圖卡 & 簡報自動生成）.md>) | 🔒 [pro-kit 05 · 社群圖卡產生器](<pro-kit/05-social-cards.md>)｜Skill [`social-cards`](skills/social-cards)           |
| 3-3  | [把每日反思變成自動化 Skill](<docs/3-3 把每日反思變成自動化 Skill.md>)                                                     | 🔒 Skill [`learning-journal`](skills/learning-journal)                                                                |
| 3-4  | [日本家人旅行 / AI 拍照收據自動記帳](<docs/3-4 日本旅行 AI 拍照收據自動記帳.md>)                                           | —                                                                                                                    |
| 3-5  | [做一個自己的品牌 Landing Page](<docs/3-5 做一個自己的品牌 Landing Page.md>)                                               | 🔒 [pro-kit 06 · 引導式 Landing Page 生成](<pro-kit/06-landing-page.md>)｜Skill [`landing-page`](skills/landing-page) |

---

## 🔒 Pro-kit 武功秘笈（丟給 AI 就會裝）

把整份文件貼進你的 Claude Code 對話框，AI 會用互動方式帶你一步步裝完。

| #    | 秘笈                                                                         | 配合單元                                                                                     |
| :--- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| 01   | [AI 分身起始助手](<pro-kit/01-agent-folder-setup.md>)                        | [2-1](<docs/2-1 讓 AI 記住你的偏好.md>) / [2-4](<docs/2-4 AI 分身資料夾結構：雷小蒙拆解.md>) |
| 02   | [Skill Creator 啟動包](<pro-kit/02-skill-creator-bootstrap.md>)              | [2-2](<docs/2-2 Claude Code 完整架構速覽.md>)                                                |
| 03   | [外部工具整合包（MCP / API / CLI 三路線）](<pro-kit/03-tool-integration.md>) | [2-3](<docs/2-3 用 AI 管理你的筆記和每日反思.md>)                                            |
| 04   | [AI 規劃模式（/brainstorm）](<pro-kit/04-brainstorm.md>)                     | [3-1](<docs/3-1 用 Plan Mode 讓 AI 先想清楚再動手.md>)                                       |
| 05   | [社群圖卡產生器 安裝引導](<pro-kit/05-social-cards.md>)                      | [3-2](<docs/3-2 建立 DESIGN.md 品牌說明書（社群圖卡 & 簡報自動生成）.md>)                    |
| 06   | [引導式 Landing Page 生成 安裝引導](<pro-kit/06-landing-page.md>)            | [3-5](<docs/3-5 做一個自己的品牌 Landing Page.md>)                                           |
| 07   | [跨裝置同步引導助手 by 雷小蒙](<pro-kit/07-cross-device-sync.md>)            | [2-4](<docs/2-4 AI 分身資料夾結構：雷小蒙拆解.md>)                                           |

---

## 🎯 Skills 招式學習器（裝了就能 /command）

每個 Skill 都是正統 Claude Code 格式（`SKILL.md` 主劇本 + `README.md` 安裝說明），裝到 `~/.claude/skills/{name}/` 後可在對話中直接用斜線指令呼叫。

（持續更新中）

| 指令       | Skill                                         | 它能做什麼                       | 配合單元                                                                                            |
| :--------- | :-------------------------------------------- | :------------------------------- | :-------------------------------------------------------------------------------------------------- |
| `/journal` | [`learning-journal`](skills/learning-journal) | 把每日反思變成可重複的自動化流程 | [2-3](<docs/2-3 用 AI 管理你的筆記和每日反思.md>) / [3-3](<docs/3-3 把每日反思變成自動化 Skill.md>) |
| `/cards`   | [`social-cards`](skills/social-cards)         | 一句話產出品牌社群圖卡           | [3-2](<docs/3-2 建立 DESIGN.md 品牌說明書（社群圖卡 & 簡報自動生成）.md>)                           |
| `/landing` | [`landing-page`](skills/landing-page)         | 一句話產出品牌 Landing Page      | [3-5](<docs/3-5 做一個自己的品牌 Landing Page.md>)                                                  |

> 兩種安裝方式擇一：
> 1. **直接複製**（進階學員）：`cp -r skills/{name}/ ~/.claude/skills/{name}/`
> 2. **貼 pro-kit 給 AI**（推薦）：AI 會用 `git sparse-checkout` 自動幫你拉下來

---

## ✍️ 關於這份教材的撰寫

有些教學文，是我（雷蒙）跟 **雷小蒙**（我的 AI Agent），一起討論、整理、迭代出來的。

大部分段落是我口述 + AI 潤稿、有些是 AI 在我跟他協作的過程，建議我要寫下來做為學習筆記 + 我再去調整內容；我認為，既然要教學怎麼使用 AI Agent，就把我跟它的真實對話、應用案例好好紀錄整理。我不隱藏這件事，因為這本身就是這堂課想教的：**「AI 時代的應用、知識累積，將會是『人 + AI』協作出來的」**，不是誰單獨完成的。

所以你讀的時候會感覺到兩種語氣切換，這是正常的：
- **第一人稱**（「我」）：我本人的經驗、判斷和思考
- **第三人稱**（「雷蒙...」）：雷小蒙在整理我們的真實案例、轉述、補充屬於它做為 AI 的那一部分

有時候，**我甚至覺得我才是那個學生**，從雷小蒙身上學到很多我未曾想過的知識、用法和機制。
所以你也可以把這迷你課，當作一種「人類與 AI Agent」的啟蒙故事，但不只是敘述對話，還有不太會過時的底層觀念、可操作的方法。

---

## 💬 Alert Callout 閱讀指南

教學文裡你會看到四種顏色的提示框，一眼辨識這段在講什麼：

> [!TIP]
> **實用小技巧** — 額外小撇步、替代方案、容易忽略但很有用的資訊。

> [!IMPORTANT]
> **升級包搭配** — 這段可以搭配哪個 starter-kit / pro-kit / Skill 一起用。

> [!WARNING]
> **常見踩坑** — 很多人在這裡踩過坑，先看一眼少走冤枉路。

> [!CAUTION]
> **危險操作** — 做錯可能會丟資料或造成不可逆後果，務必留意。

---

## 🙋 有問題怎麼辦？

1. **第一時間**：把問題 + 截圖直接丟給你自己的 Claude Code，先讓它幫你判斷
2. **還卡住 or Claude Code 壞掉**：換別的 AI 截圖貼上詢問（例如 Gemini, ChatGPT）
3. **如果是教學文檔有錯**：歡迎直接讓你的 CC，在這個 Repo 提交一個 issue 給我
4. **想看同學怎麼用**：未來我會收集大家的應用實戰分享，到時候來展示個作品集？

---

## ⚠️ 使用這份 Repo 前，給用 Obsidian 的你（非 Obsidian 用戶可略過）

> [!IMPORTANT]
> 如果你用 **Obsidian** 編輯 Markdown（像雷蒙自己），新 clone 這個 repo 後請先跑一次：
>
> ```bash
> bash scripts/setup-hooks.sh
> ```
>
> **為什麼**：Obsidian 會自動在檔案開頭加 `created` / `updated` frontmatter。這個 hook 會在 commit 時從 git index 剝掉這兩個 key（本地檔案完全不動，Obsidian 照常運作），避免污染教學文預覽。
>
> 用 VS Code / Cursor / nvim 等其他編輯器的話，**完全不用管這段**。

---

## 📜 授權

本 Repo 內容版權所有 © 2026 雷蒙三十。
僅限購買《24 小時開始活用 Claude Code》迷你課的學員個人使用，未經授權不得轉載、分享、或商業使用。

<p align="center">
  <a href="https://lifehacker.tw/courses/24hr-claude-code-tutorial">
    <img src="docs/images/claude-code-mini-course-cover-banner.jpg" alt="點圖前往 Claude Code 迷你課課程頁" width="70%">
  </a>
</p>