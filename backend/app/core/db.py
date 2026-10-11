import os
import sqlite3
from pathlib import Path
from typing import Optional

from app.core.config import settings


def get_database_path(db_path: Optional[str] = None) -> Path:
    """Resolve the SQLite database location used for persisted scans and feedback."""
    resolved = db_path or os.getenv("PHISHGUARD_DB_PATH") or settings.FEEDBACK_DB_PATH
    path = Path(resolved)
    if not path.is_absolute():
        backend_root = Path(__file__).resolve().parents[2]
        path = backend_root / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def get_connection(db_path: Optional[str] = None):
    path = get_database_path(db_path)
    connection = sqlite3.connect(str(path))
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    return connection


def initialize_database(db_path: Optional[str] = None) -> Path:
    database_path = get_database_path(db_path)
    with get_connection(str(database_path)) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS scans (
                scan_id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                classification TEXT,
                risk_score REAL,
                confidence REAL,
                model_version TEXT,
                status TEXT NOT NULL DEFAULT 'analyzed',
                scanned_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                scan_id TEXT NOT NULL UNIQUE,
                url TEXT NOT NULL,
                predicted_classification TEXT,
                predicted_risk_score REAL,
                model_version TEXT,
                suggested_classification TEXT,
                comment TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                submitted_at TEXT NOT NULL,
                reviewed_at TEXT,
                reviewed_by TEXT,
                review_note TEXT
            )
            """
        )
    return database_path
