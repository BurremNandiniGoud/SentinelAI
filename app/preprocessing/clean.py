"""
Text preprocessing and entity extraction for the Fraud Detection Engine.
Handles Unicode normalization, entity extraction (phone, UPI, account, email),
and basic multilingual-safe cleanup.
"""
import re
import unicodedata
from dataclasses import dataclass, field


PHONE_RE = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\d{10}\b")
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
UPI_RE = re.compile(r"[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}(?<!\.com)(?<!\.in)")
URL_RE = re.compile(r"https?://\S+|www\.\S+")
ACCOUNT_RE = re.compile(r"\b\d{9,18}\b")
CURRENCY_RE = re.compile(r"(?:₹|Rs\.?|INR|\$|USD)\s?[\d,]+(?:\.\d+)?")


@dataclass
class ExtractedEntities:
    phones: list = field(default_factory=list)
    emails: list = field(default_factory=list)
    upi_ids: list = field(default_factory=list)
    urls: list = field(default_factory=list)
    account_numbers: list = field(default_factory=list)
    currency_mentions: list = field(default_factory=list)


def normalize_text(text: str) -> str:
    """Unicode-normalize, collapse whitespace, strip control chars."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)  # zero-width chars
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_entities(text: str) -> ExtractedEntities:
    """Pull out structured entities that matter for fraud detection."""
    text = text or ""
    return ExtractedEntities(
        phones=list(set(PHONE_RE.findall(text))),
        emails=list(set(EMAIL_RE.findall(text))),
        upi_ids=list(set(UPI_RE.findall(text))),
        urls=list(set(URL_RE.findall(text))),
        account_numbers=list(set(ACCOUNT_RE.findall(text))),
        currency_mentions=list(set(CURRENCY_RE.findall(text))),
    )


def clean_for_model(text: str) -> str:
    """Cleaned, lowercase text suitable for vectorization (keeps entities intact upstream)."""
    text = normalize_text(text)
    return text.lower()
