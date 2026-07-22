import json
import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "scan_history.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

connection = sqlite3.connect(DB_PATH, check_same_thread=False)
connection.execute(
    """
    CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_type TEXT NOT NULL,
        source TEXT NOT NULL,
        verdict TEXT,
        threat_level TEXT,
        confidence REAL,
        payload TEXT,
        result TEXT,
        created_at TEXT NOT NULL
    )
    """
)

connection.execute(
    """
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'MEDIUM',
        source TEXT DEFAULT '',
        url TEXT DEFAULT '',
        published_at TEXT NOT NULL
    )
    """
)

connection.execute(
    """
    CREATE TABLE IF NOT EXISTS news_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        source TEXT DEFAULT '',
        url TEXT DEFAULT '',
        published_at TEXT NOT NULL
    )
    """
)
connection.commit()


def _to_json(value):
    try:
        return json.dumps(value, ensure_ascii=False)
    except Exception:
        return json.dumps(str(value), ensure_ascii=False)


def record_scan(scan_type: str, source: str, verdict: str | None, threat_level: str | None, confidence: float | None, payload: dict | None, result: dict | None):
    created_at = datetime.utcnow().isoformat() + "Z"
    connection.execute(
        "INSERT INTO scan_history (scan_type, source, verdict, threat_level, confidence, payload, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            scan_type,
            source,
            verdict,
            threat_level,
            confidence,
            _to_json(payload or {}),
            _to_json(result or {}),
            created_at,
        ),
    )
    connection.commit()


def get_scan_history(limit: int = 200, scan_type: str | None = None):
    cursor = connection.cursor()
    if scan_type:
        rows = cursor.execute(
            "SELECT id, scan_type, source, verdict, threat_level, confidence, payload, result, created_at FROM scan_history WHERE scan_type = ? ORDER BY id DESC LIMIT ?",
            (scan_type, limit),
        ).fetchall()
    else:
        rows = cursor.execute(
            "SELECT id, scan_type, source, verdict, threat_level, confidence, payload, result, created_at FROM scan_history ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()

    history = []
    for row in rows:
        payload = {}
        result = {}
        try:
            payload = json.loads(row[6]) if row[6] else {}
        except Exception:
            payload = {"raw": row[6]}
        try:
            result = json.loads(row[7]) if row[7] else {}
        except Exception:
            result = {"raw": row[7]}

        history.append(
            {
                "id": row[0],
                "scan_type": row[1],
                "source": row[2],
                "verdict": row[3],
                "threat_level": row[4],
                "confidence": row[5],
                "payload": payload,
                "result": result,
                "created_at": row[8],
            }
        )
    return history


def get_latest_alerts(limit: int = 10):
    rows = connection.execute(
        "SELECT id, title, description, level, source, url, published_at FROM alerts ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [
        {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "level": row[3],
            "source": row[4],
            "url": row[5],
            "published_at": row[6],
        }
        for row in rows
    ]


def get_latest_news(limit: int = 10):
    rows = connection.execute(
        "SELECT id, title, source, url, published_at FROM news_items ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [
        {
            "id": row[0],
            "title": row[1],
            "source": row[2],
            "url": row[3],
            "published_at": row[4],
        }
        for row in rows
    ]


def seed_alerts_and_news():
    """Insert initial demo data if tables are empty."""
    alert_count = connection.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
    news_count = connection.execute("SELECT COUNT(*) FROM news_items").fetchone()[0]

    now = datetime.utcnow().isoformat() + "Z"

    if alert_count == 0:
        seed_alerts = [
            ("New UPI Scam Alert", "Fraudsters sending fake 'money received' SMS with QR codes. Do not scan unknown QR codes.", "HIGH", "MHA", "", now),
            ("Digital Arrest Warning", "CBI reports surge in impersonation calls. No government agency conducts arrests via video call.", "HIGH", "CBI", "", now),
            ("Fake Job Portal Advisory", "MHA warns about fake government job portals collecting Aadhaar and PAN details.", "MEDIUM", "MHA", "", now),
            ("RBI Advisory", "RBI reiterates: Banks never ask for OTP, PIN, or card details via phone, SMS, or email.", "LOW", "RBI", "https://rbi.org.in", now),
        ]
        connection.executemany(
            "INSERT INTO alerts (title, description, level, source, url, published_at) VALUES (?, ?, ?, ?, ?, ?)",
            seed_alerts,
        )

    if news_count == 0:
        seed_news = [
            ("India Reports ₹11,266 Cr Lost to Cyber Fraud in 2024", "MHA Report", "", now),
            ("I4C Launches New AI-Powered Scam Detection Portal", "PIB", "", now),
            ("UPI Transaction Limits Updated for Enhanced Security", "NPCI", "", now),
            ("Government Expands Cyber Crime Helpline 1930 Coverage", "MHA", "", now),
        ]
        connection.executemany(
            "INSERT INTO news_items (title, source, url, published_at) VALUES (?, ?, ?, ?)",
            seed_news,
        )

    connection.commit()
