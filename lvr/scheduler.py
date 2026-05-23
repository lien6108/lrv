import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from database import SessionLocal
from importer import download_and_import
from notifier import send_import_notification

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="Asia/Taipei")


def _scheduled_import():
    db = SessionLocal()
    try:
        results = download_and_import(db)
        logger.info("Scheduled import done: %s", results)
        send_import_notification(results, triggered_by="排程自動觸發")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        _scheduled_import,
        CronTrigger(day="5,15,25", hour=0, minute=0, timezone="Asia/Taipei"),
        id="monthly_import",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — runs on day 5, 15, 25 of each month at 00:00 CST")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
