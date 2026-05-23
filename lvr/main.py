import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()  # 載入 .env（GMAIL_USER / GMAIL_APP_PASSWORD）

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db, SessionLocal
from routers.transactions import router
from scheduler import start_scheduler, stop_scheduler
from importer import import_from_file

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

INITIAL_DATA = Path("row data.xlsx")
IMPORT_FLAG = Path(".initial_import_done")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    # Import initial data once
    if INITIAL_DATA.exists() and not IMPORT_FLAG.exists():
        logger.info("Importing initial data from %s", INITIAL_DATA)
        db = SessionLocal()
        try:
            count = import_from_file(str(INITIAL_DATA), "initial", db)
            logger.info("Initial import complete: %d records", count)
            IMPORT_FLAG.touch()
        finally:
            db.close()

    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="實價登錄查詢系統", lifespan=lifespan)

app.include_router(router)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("static/index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
