"""
Rule Engine: comprehensive pattern/keyword based scam-signal detection.
Covers 25+ scam categories found in real Indian fraud campaigns.
"""
from dataclasses import dataclass, field

@dataclass
class RuleResult:
    rule_score: float
    matched_signals: list
    category_hits: dict

SIGNAL_CATEGORIES = {
    "government_impersonation": (0.9, [
        "digital arrest", "cbi officer", "cyber crime cell", "cyber cell",
        "income tax department", "enforcement directorate", "narcotics",
        "trai notice", "supreme court", "high court", "fir has been",
        "customs department", "police investigation", "crime branch",
        "cid officer", "ed officer",
    ]),
    "fear_and_legal_threat": (0.85, [
        "arrest warrant", "you will be arrested", "legal action",
        "court notice", "criminal case", "money laundering",
        "parcel contains drugs", "illegal activity", "case registered",
        "non-bailable", "prosecution", "jail", "lockup",
    ]),
    "urgency": (0.6, [
        "immediately", "within 30 minutes", "act now", "urgent",
        "failure to respond", "before it is too late", "last warning",
        "final notice", "24 hours", "deactivated today", "blocked today",
    ]),
    "isolation_and_secrecy": (0.8, [
        "do not tell anyone", "keep this confidential",
        "do not disconnect the call", "stay on the line",
        "do not hang up", "share your screen", "don't involve",
        "keep it secret",
    ]),
    "financial_demand": (0.85, [
        "transfer the money", "verification fee", "processing fee",
        "refundable deposit", "pay to avoid", "send otp", "share otp",
        "scan this qr code", "upi id", "freeze your account",
        "bank details", "send money", "transfer now", "pay now",
        "registration fee", "processing charge",
    ]),
    "remote_access": (0.9, [
        "anydesk", "teamviewer", "install this app", "remote access",
        "screen share app", "download teamviewer", "remote support",
        "screen control",
    ]),
    "identity_verification_scam": (0.5, [
        "kyc update", "kyc verification", "aadhaar verification",
        "pan verification", "your account will be suspended",
        "verify your identity", "pan card will be blocked",
        "kyc has expired", "update pan",
    ]),
    "lottery_prize_scam": (0.65, [
        "you have won", "congratulations you won", "lucky draw",
        "selected for a prize", "claim your prize", "lottery",
        "cash prize", "gift card winner", "lucky winner",
    ]),
    "job_scam": (0.6, [
        "work from home", "earn daily", "earning rs", "online job",
        "part time job", "data entry job", "typing job",
        "registration fee", "training fee", "joining fee",
        "no experience needed", "earn rs",
    ]),
    "investment_scam": (0.75, [
        "guaranteed returns", "double your money", "crypto trading",
        "trading bot", "investment returns", "sebi registered",
        "minimum investment", "daily profit", "200%", "100% returns",
    ]),
    "loan_scam": (0.7, [
        "pre-approved loan", "instant loan", "without documents",
        "personal loan offer", "no cibil", "loan approved",
        "processing fee", "disbursal",
    ]),
    "courier_customs_scam": (0.7, [
        "fedex parcel", "parcel contains", "prohibited items",
        "bluedart courier", "held at customs", "customs clearance",
        "release your shipment", "courier company",
        "suspicious shipment",
    ]),
    "upi_qr_scam": (0.75, [
        "scan qr code", "qr code to receive", "receive payment",
        "refund by scanning", "scan to credit",
    ]),
    "bank_phishing": (0.8, [
        "sbi alert", "hdfc bank", "icici bank", "account has been locked",
        "unauthorized transaction", "credit card blocked",
        "call customer care", "account compromised",
    ]),
    "family_impersonation": (0.85, [
        "hi mom", "hi dad", "i lost my phone", "i lost my wallet",
        "urgently send", "need money immediately", "this is my new number",
        "don't tell anyone",
    ]),
    "utility_scam": (0.55, [
        "electricity bill overdue", "broadband disconnected",
        "pay at the link", "ebill", "recharge now",
    ]),
    "aadhaar_scam": (0.7, [
        "aadhaar linked", "aadhaar used to open",
        "aadhaar deactivated", "update aadhaar",
        "aadhaar verification required",
    ]),
    "card_scam": (0.65, [
        "debit card blocked", "atm card deactivated",
        "card details required", "update card",
        "new card issued",
    ]),
    "fake_govt_scheme": (0.55, [
        "pm kisan yojana", "subsidy approved", "free lpg",
        "ujjwala scheme", "government scheme",
        "instalment approved",
    ]),
}


def evaluate_rules(text: str) -> RuleResult:
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
            weighted_sum += weight + 0.05 * (len(hits) - 1)
        weight_total += weight

    raw_score = weighted_sum / weight_total if weight_total else 0.0
    rule_score = min(1.0, raw_score * 1.4)

    return RuleResult(rule_score=round(rule_score, 4), matched_signals=matched, category_hits=category_hits)
