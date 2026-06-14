# 異形：復仇女神號 桌遊輔助系統

**Alien: Nemesis** 桌遊遊戲流程輔助 Web App，協助新玩家在遊戲過程中快速查詢規則、流程與緊急處置方式。

---

## 功能

- **階段導覽**：左側側欄依遊戲順序列出所有階段，點擊即可查看該階段的完整說明
- **緊急狀況**：右下角浮動按鈕，快速查詢遭遇異形、火警、感染等突發情況的處置流程
- **全繁體中文**：內容完全依據繁體中文規則書撰寫
- **行動裝置友好**：設計適合在遊戲桌上用手機或平板操作

## 技術棧

| 工具 | 用途 |
| --- | --- |
| Vue 3 + Vite | 前端框架與建置工具 |
| Vue Router 4 | Hash-based 路由（相容 Cloudflare Pages） |
| unplugin-vue-markdown | Markdown 檔案自動轉換為 Vue 元件 |
| markdown-it | Markdown 解析 |

## 本地開發

```bash
npm install
npm run dev
```

瀏覽器開啟 `http://localhost:5173`

## 建置與部署

```bash
npm run build   # 輸出至 dist/
```

部署目標：**Cloudflare Pages**

| 設定項目 | 值 |
| --- | --- |
| Root directory | `Nemesis` |
| Build command | `npm run build` |
| Output directory | `dist` |

## 內容編輯

遊戲規則內容存放於 `content/` 目錄，以 Markdown 格式撰寫，不需修改程式碼即可更新內容。

```
content/
├── phases/          # 遊戲階段說明
│   ├── setup.md            # 遊戲設置
│   ├── player-turn.md      # 玩家回合
│   ├── event-phase.md      # 事件階段
│   ├── intruder-phase.md   # 入侵者階段
│   ├── map-rooms.md        # 地圖與房間
│   ├── victory-conditions.md  # 勝利條件
│   └── character-death.md  # 角色死亡
└── situations/      # 緊急狀況說明
    ├── encounter-alien.md  # 遭遇異形
    ├── fire.md             # 發現火警
    ├── contamination.md    # 污染感染
    ├── character-death.md  # 角色死亡
    ├── escape-pod.md       # 逃脫艙啟動
    └── malfunction.md      # 系統故障
```

每個 Markdown 檔案開頭有 frontmatter 設定標題與圖示：

```markdown
---
title: 遊戲設置
icon: 🎲
order: 1
---
```

## 適用版本

本輔助系統僅涵蓋 **Alien: Nemesis 基礎遊戲**規則，不含任何擴充包內容。
