"""
Rule Engine: pattern/keyword based scam-signal detection.
Produces a rule_score (0-1) plus a list of matched signals for explainability.
This is intentionally transparent (not a black box) so every hit can be shown to the user.
"""
from dataclasses import dataclass, field
import re

# Signal categories -> (weight, phrase list). Weight reflects how strongly
# the phrase indicates fraud when present in a message.
SIGNAL_CATEGORIES = {
    "government_impersonation": (0.9, [
        "digital arrest", "cbi", "cyber crime cell", "cyber cell", "rbi notice",
        "income tax department", "enforcement directorate", "narcotics department",
        "trai", "supreme court", "high court", "fir has been registered",
        "your aadhaar", "your pan card is linked", "customs department",
    ]),
    "fear_and_legal_threat": (0.85, [
        "arrest warrant", "you will be arrested", "non-bailable", "legal action",
        "court notice", "criminal case", "money laundering case", "parcel contains drugs",
        "your number is used in illegal activity", "case registered against you",
    ]),
    "urgency": (0.6, [
        "immediately", "within 30 minutes", "act now", "urgent action required",
        "failure to respond", "before it is too late", "last warning", "final notice",
    ]),
    "isolation_and_secrecy": (0.8, [
        "do not tell anyone", "keep this confidential", "do not disconnect the call",
        "stay on the line", "do not hang up", "share your screen",
    ]),
    "financial_demand": (0.85, [
        "transfer the money", "wire transfer", "verification fee", "processing fee",
        "refundable deposit", "pay to avoid arrest", "send otp", "share otp",
        "scan this qr code", "upi id", "freeze your account", "bank account will be frozen",
    ]),
    "remote_access": (0.9, [
        "anydesk", "teamviewer", "install this app", "remote access", "screen share app",
    ]),
    "identity_verification_scam": (0.5, [
        "kyc update", "kyc verification", "aadhaar verification", "pan verification",
        "your account will be suspended", "verify your identity immediately",
    ]),
}


@dataclass
class RuleResult:
    rule_score: float
    matched_signals: list = field(default_factory=list)  # list of (category, phrase)
    category_hits: dict = field(default_factory=dict)


def evaluate_rules(text: str) -> RuleResult:
    """Scan cleaned text for known scam patterns, return weighted score + matches."""
    text_l = (text or "").lower()
    matched = []
    category_hits = {}
    weighted_sum = 0.0
    weight_total = 0.0

    for category, (weight, phrases) in SIGNAL_CATEGORIES.items():
        hits = [p for p in phrases if p in text_l]
        if hits:
            category_hits[category] = hits
            matched.extend([(category, p) for p in hits])
            # each category contributes its weight once, plus a small bonus per extra hit
            weighted_sum += weight + 0.05 * (len(hits) - 1)
        weight_total += weight

    # normalize into 0-1 range, capped
    raw_score = weighted_sum / weight_total if weight_total else 0.0
    rule_score = min(1.0, raw_score * 1.4)  # slight boost so multi-category matches stand out

    return RuleResult(rule_score=round(rule_score, 4), matched_signals=matched, category_hits=category_hits)
