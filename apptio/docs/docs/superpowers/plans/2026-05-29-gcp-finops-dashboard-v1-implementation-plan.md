# GCP FinOps Dashboard V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可月結的 GCP 帳務資料流程與主管月報 Dashboard，並可自動輸出 `.pptx`（含你指定 8 頁內容）。

**Architecture:** 以現有 FastAPI + SQLAlchemy + React 為基礎，先補齊資料模型與 ETL（Excel 帳務 + 專案控管對照），再新增 8 個聚合 API 與前端圖表頁。最後串接 PPT 匯出流程，直接輸出固定月報檔。

**Tech Stack:** Python（FastAPI, SQLAlchemy, openpyxl, python-pptx）, SQLite（本地）/可切 BigQuery, React + Recharts。

---

### Task 1: 建立 `dim_project` 新欄位與遷移路徑

**Files:**
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\models.py`
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\schemas.py`
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\main.py`
- Test: `D:\Vide Coding\Apptio_substitute\backend\tests\test_project_mapping_api.py`

- [ ] Step 1: 先寫 failing test，驗證 `project_mapping` API 回傳欄位包含 `類別/部門/科別/專案名稱/專案編號/APID/環境/成本中心` 對應欄位。
- [ ] Step 2: 執行 `pytest D:\Vide Coding\Apptio_substitute\backend\tests\test_project_mapping_api.py -v`，確認失敗。
- [ ] Step 3: 在 `models.py` 與 `schemas.py` 補齊欄位定義（`category, department, section, project_name, project_id, apid, environment, cost_center`），並更新 `main.py` 的 upsert/list API。
- [ ] Step 4: 再跑同一支測試，確認通過。
- [ ] Step 5: Commit（`feat: align dim_project fields with org mapping spec`）。

### Task 2: 匯入「雲端專案控管表」作為組織映射來源

**Files:**
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\services.py`
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\mappings.py`
- Test: `D:\Vide Coding\Apptio_substitute\backend\tests\test_import_project_mapping.py`

- [ ] Step 1: 寫 failing test，使用 `上雲專案預算控管表（GCP 總表）_超新版.xlsx` 的 fixture，驗證 `雲端專案控管表` 能正確匯入 `部門/科別/成本中心`。
- [ ] Step 2: 執行 `pytest D:\Vide Coding\Apptio_substitute\backend\tests\test_import_project_mapping.py -v`，確認失敗。
- [ ] Step 3: 在 `services.py` 實作專案主檔匯入規則：`Project ID` 主鍵、`APID` 備援；格式標準化（trim/lower）。
- [ ] Step 4: 新增未映射專案統計輸出（供後續 DQ 使用）。
- [ ] Step 5: 再跑測試，確認通過。
- [ ] Step 6: Commit（`feat: import project-org mapping from budget control workbook`）。

### Task 3: 建立月結與資料品質檢核

**Files:**
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\services.py`
- Create: `D:\Vide Coding\Apptio_substitute\backend\app\quality_checks.py`
- Test: `D:\Vide Coding\Apptio_substitute\backend\tests\test_quality_checks.py`

- [ ] Step 1: 寫 failing test，涵蓋 3 類檢核：金額平衡、未映射專案、費用 100 % 認列到部門/科別。
- [ ] Step 2: 執行 `pytest D:\Vide Coding\Apptio_substitute\backend\tests\test_quality_checks.py -v`，確認失敗。
- [ ] Step 3: 在 `quality_checks.py` 實作檢核函式，回傳可序列化檢核報告。
- [ ] Step 4: 在 `services.py` 串接檢核，匯入流程完成後一併回傳檢核結果。
- [ ] Step 5: 跑測試確認通過。
- [ ] Step 6: Commit（`feat: add monthly quality checks for allocation completeness`）。

### Task 4: 實作 8 項簡報需求的後端聚合 API

**Files:**
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\main.py`
- Create: `D:\Vide Coding\Apptio_substitute\backend\app\dashboard_queries.py`
- Test: `D:\Vide Coding\Apptio_substitute\backend\tests\test_dashboard_endpoints.py`

- [ ] Step 1: 寫 failing test，逐一驗證 8 組資料集鍵值存在與排序規則正確（Top 9、Top 8、近半年）。
- [ ] Step 2: 執行 `pytest D:\Vide Coding\Apptio_substitute\backend\tests\test_dashboard_endpoints.py -v`，確認失敗。
- [ ] Step 3: 在 `dashboard_queries.py` 實作查詢：
- [ ] Step 4: `category_usage`, `cost_by_cost_center`, `top9_app_projects`, `top9_app_projects_6m`, `app_by_domain`, `app_by_department_6m`, `top8_mom_increase`, `shared_infra_resource_cost`。
- [ ] Step 5: 在 `main.py` 提供 `/api/dashboard/v1` 統一回傳。
- [ ] Step 6: 跑測試確認通過。
- [ ] Step 7: Commit（`feat: add executive dashboard v1 aggregate endpoints`）。

### Task 5: 前端 Dashboard 改版（對應 8 頁內容）

**Files:**
- Modify: `D:\Vide Coding\Apptio_substitute\frontend\src\App.jsx`
- Modify: `D:\Vide Coding\Apptio_substitute\frontend\src\api.js`
- Modify: `D:\Vide Coding\Apptio_substitute\frontend\src\styles.css`
- Test: `D:\Vide Coding\Apptio_substitute\frontend\src\App.test.jsx`（若現況無測試，先建立）

- [ ] Step 1: 寫 failing test（至少驗證 8 個區塊標題與資料載入狀態）。
- [ ] Step 2: 執行 `node --test` 或專案既有前端測試指令，確認失敗。
- [ ] Step 3: 介面改版為主管月報視圖，新增 8 個圖表區塊，修正目前亂碼文字。
- [ ] Step 4: 串接 `/api/dashboard/v1`，處理空資料與載入錯誤訊息。
- [ ] Step 5: 跑測試確認通過，並手動啟動頁面檢視一次（桌機與行動版寬度）。
- [ ] Step 6: Commit（`feat: build executive dashboard UI for monthly reporting`）。

### Task 6: 新增 PPT 自動產製流程（主管版）

**Files:**
- Create: `D:\Vide Coding\Apptio_substitute\backend\app\ppt_export.py`
- Modify: `D:\Vide Coding\Apptio_substitute\backend\app\main.py`
- Create: `D:\Vide Coding\Apptio_substitute\backend\tests\test_ppt_export.py`

- [ ] Step 1: 寫 failing test，驗證可輸出 `YYYYMM` 檔名的 `.pptx`，且包含預期頁數（8-12）。
- [ ] Step 2: 執行 `pytest D:\Vide Coding\Apptio_substitute\backend\tests\test_ppt_export.py -v`，確認失敗。
- [ ] Step 3: 在 `ppt_export.py` 實作模板填圖流程，輸入為 Task 4 聚合結果。
- [ ] Step 4: 在 `main.py` 新增 `/api/export/pptx`，支援 `month=YYYY-MM` 參數。
- [ ] Step 5: 跑測試確認通過，並產出一份 2026/04 月驗證檔。
- [ ] Step 6: Commit（`feat: add monthly pptx export for executive report`）。

### Task 7: 建立月結批次命令與操作文件

**Files:**
- Create: `D:\Vide Coding\Apptio_substitute\backend\scripts\run_monthly_close.py`
- Modify: `D:\Vide Coding\Apptio_substitute\README.md`
- Create: `D:\Vide Coding\Apptio_substitute\docs\runbook\monthly-close.md`

- [ ] Step 1: 寫 failing test，驗證批次命令會依序執行 `import -> quality check -> dashboard cache -> ppt export`。
- [ ] Step 2: 實作 `run_monthly_close.py`，輸出批次報告 JSON。
- [ ] Step 3: 更新 README 與 runbook，寫清楚每月操作步驟與輸出路徑。
- [ ] Step 4: 執行一次批次命令（2026-04），確認產出完整。
- [ ] Step 5: Commit（`docs+feat: add monthly close batch command and runbook`）。

### Task 8: 端對端驗收與回歸測試

**Files:**
- Modify: `D:\Vide Coding\Apptio_substitute\backend\tests\test_e2e_monthly_report.py`
- Modify: `D:\Vide Coding\Apptio_substitute\frontend\src\App.test.jsx`

- [ ] Step 1: 建立 E2E 測試資料（2026/01-2026/06）與期望輸出快照。
- [ ] Step 2: 執行後端完整測試與前端測試。
- [ ] Step 3: 驗證驗收條件：數字誤差 < 0.5 %、8 個圖表均可載入、PPT 可開啟且頁面完整。
- [ ] Step 4: 整理已知限制與後續優化清單（非 V1）。
- [ ] Step 5: Commit（`test: add e2e coverage for executive monthly report flow`）。

## Plan Self-Review。
- Spec coverage：已覆蓋資料模型、組織認列、8 項簡報內容、PPT 匯出、月結流程。
- Placeholder scan：無 `TODO/TBD/implement later`。
- Type consistency：`project_id` 為主鍵、`apid` 備援；`category/department/section/cost_center` 命名一致。
