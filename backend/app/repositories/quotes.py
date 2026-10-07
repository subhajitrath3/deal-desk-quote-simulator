import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from app.models.schemas import QuoteResponse, QuoteStatus

DATA_DIR = Path(__file__).parent.parent.parent / "data"
QUOTES_FILE = DATA_DIR / "quotes.json"

class QuoteRepository:
    def __init__(self):
        self._ensure_file()

    def _ensure_file(self):
        if not QUOTES_FILE.exists():
            QUOTES_FILE.write_text("[]")

    def _read_all(self) -> List[dict]:
        try:
            with open(QUOTES_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []

    def _write_all(self, quotes: List[dict]):
        with open(QUOTES_FILE, "w") as f:
            json.dump(quotes, f, indent=2)

    def save_quote(self, quote: QuoteResponse) -> QuoteResponse:
        quotes = self._read_all()
        quotes.append(quote.model_dump(mode="json"))
        self._write_all(quotes)
        return quote

    def get_quote(self, quote_id: str) -> Optional[dict]:
        quotes = self._read_all()
        for q in quotes:
            if q["id"] == quote_id:
                return q
        return None

    def list_quotes(self) -> List[dict]:
        return self._read_all()

    def update_quote_status(self, quote_id: str, new_status: QuoteStatus) -> Optional[dict]:
        quotes = self._read_all()
        for i, q in enumerate(quotes):
            if q["id"] == quote_id:
                q["status"] = new_status
                q["updated_at"] = datetime.now(timezone.utc).isoformat()
                self._write_all(quotes)
                return q
        return None

repository = QuoteRepository()
