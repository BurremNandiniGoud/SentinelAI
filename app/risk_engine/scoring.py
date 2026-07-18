"""
Risk Scoring Engine: combines rule-engine score + ML model score into a
final, explainable risk verdict.
"""
from dataclasses import dataclass, field


@dataclass
class RiskVerdict:
    risk_score: int              # 0-100
    threat_level: str             # LOW / MEDIUM / HIGH / CRITICAL
    fraud_probability: float      # 0-1
    suggested_action: str
    reasons: list = field(default_factory=list)
    matched_signals: list = field(default_factory=list)
    rule_score: float = 0.0
    ml_score: float = 0.0


RULE_WEIGHT = 0.55
ML_WEIGHT = 0.45


def combine_scores(rule_score: float, ml_score: float) -> float:
    """Weighted combination; rule engine weighted slightly higher since it's
    high-precision on known scam patterns, ML fills coverage gaps."""
    return RULE_WEIGHT * rule_score + ML_WEIGHT * ml_score


def threat_level_for(score: float) -> str:
    if score >= 0.85:
        return "CRITICAL"
    if score >= 0.6:
        return "HIGH"
    if score >= 0.35:
        return "MEDIUM"
    return "LOW"


def suggested_action_for(level: str) -> str:
    return {
        "CRITICAL": "Block sender immediately. Do not share OTP, money, or remote access. Report to cybercrime.gov.in or dial 1930.",
        "HIGH": "Treat as highly suspicious. Do not act on any instructions. Verify independently through official channels.",
        "MEDIUM": "Exercise caution. Verify sender identity before responding or clicking any links.",
        "LOW": "No strong fraud indicators detected. Standard caution still advised.",
    }[level]


def build_reasons(category_hits: dict) -> list:
    """Human-readable reasons derived from rule-engine category hits."""
    label_map = {
        "government_impersonation": "Impersonation of government/law-enforcement authority",
        "fear_and_legal_threat": "Use of fear tactics or legal threats",
        "urgency": "Artificial urgency to pressure quick action",
        "isolation_and_secrecy": "Attempt to isolate victim or demand secrecy",
        "financial_demand": "Direct demand for money, OTP, or bank details",
        "remote_access": "Request for remote access to device",
        "identity_verification_scam": "Fake identity/KYC verification request",
    }
    return [label_map.get(cat, cat) for cat in category_hits.keys()]


def compute_risk(rule_score: float, ml_score: float, category_hits: dict, matched_signals: list) -> RiskVerdict:
    combined = combine_scores(rule_score, ml_score)
    level = threat_level_for(combined)
    return RiskVerdict(
        risk_score=round(combined * 100),
        threat_level=level,
        fraud_probability=round(combined, 4),
        suggested_action=suggested_action_for(level),
        reasons=build_reasons(category_hits),
        matched_signals=[f"{cat}: '{phrase}'" for cat, phrase in matched_signals],
        rule_score=round(rule_score, 4),
        ml_score=round(ml_score, 4),
    )
