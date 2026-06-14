import logging
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

NOTIFY_TO = "u107029033@gap.kmu.edu.tw"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def _build_html(results: dict, triggered_by: str, total_records: int = 0) -> str:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rows = ""
    total_inserted = 0

    for source, info in results.items():
        status = info.get("status", "unknown")
        if status == "ok":
            inserted = info.get("inserted", 0)
            total_inserted += inserted
            status_badge = f'<span style="color:#16a34a;font-weight:bold;">✔ 成功</span>'
            detail = f"新增 <strong>{inserted}</strong> 筆"
        else:
            status_badge = f'<span style="color:#dc2626;font-weight:bold;">✘ 失敗</span>'
            detail = info.get("message", "未知錯誤")

        rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">{source.upper()} 類</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">{status_badge}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">{detail}</td>
        </tr>"""

    return f"""
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:32px;">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;
              box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;">
    <div style="background:#1d4ed8;padding:20px 24px;">
      <h2 style="color:#fff;margin:0;font-size:18px;">🏠 實價登錄資料更新通知</h2>
    </div>
    <div style="padding:24px;">
      <p style="margin-top:0;color:#374151;">
        實價登錄系統已完成最新一期資料同步，摘要如下：
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">來源</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">狀態</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">結果</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="margin-bottom:0;color:#6b7280;font-size:13px;">
        本次共新增 <strong>{total_inserted}</strong> 筆交易記錄。<br>
        資料庫目前總筆數：<strong>{total_records:,}</strong> 筆。<br>
        觸發方式：{triggered_by} ／ 時間：{now}
      </p>
    </div>
    <div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#9ca3af;">
      此信件由實價登錄查詢系統自動發送，請勿直接回覆。
    </div>
  </div>
</body>
</html>"""


def send_import_notification(
    results: dict,
    triggered_by: str = "排程自動觸發",
    total_records: int = 0,
) -> None:
    """Send an email summary after a download-and-import run."""
    sender = os.getenv("GMAIL_USER")
    password = os.getenv("GMAIL_APP_PASSWORD")

    if not sender or not password:
        logger.warning(
            "GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping email notification"
        )
        return

    total_inserted = sum(
        v.get("inserted", 0) for v in results.values() if v.get("status") == "ok"
    )
    subject = f"【實價登錄】資料更新完成，本次新增 {total_inserted} 筆（累計 {total_records:,} 筆）"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = NOTIFY_TO
    msg.attach(MIMEText(_build_html(results, triggered_by, total_records), "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(sender, password)
            smtp.sendmail(sender, NOTIFY_TO, msg.as_string())
        logger.info("Import notification sent to %s", NOTIFY_TO)
    except Exception as e:
        logger.error("Failed to send notification email: %s", e)
