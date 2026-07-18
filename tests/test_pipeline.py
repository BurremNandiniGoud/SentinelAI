"""Basic unit tests for the fraud detection pipeline."""
from app.ml.model import train_and_save
from app.preprocessing.clean import normalize_text, extract_entities
from app.rule_engine.rules import evaluate_rules
from app.risk_engine.scoring import compute_risk, threat_level_for
from app.currency_detection.tracking import StableNoteTracker


def test_normalize_text_strips_whitespace():
    assert normalize_text("  hello   world  ") == "hello world"


def test_extract_entities_finds_upi_and_currency():
    text = "pay to abc@ybl amount Rs 5000 now"
    entities = extract_entities(text)
    assert "abc@ybl" in entities.upi_ids
    assert any("5000" in c for c in entities.currency_mentions)


def test_rule_engine_flags_digital_arrest_scam():
    text = "this is cbi officer, digital arrest warrant issued, transfer money immediately"
    result = evaluate_rules(text)
    assert result.rule_score > 0.5
    assert "government_impersonation" in result.category_hits


def test_rule_engine_low_score_for_benign_text():
    text = "hey are we still meeting for lunch tomorrow"
    result = evaluate_rules(text)
    assert result.rule_score < 0.2


def test_threat_level_thresholds():
    assert threat_level_for(0.9) == "CRITICAL"
    assert threat_level_for(0.7) == "HIGH"
    assert threat_level_for(0.4) == "MEDIUM"
    assert threat_level_for(0.1) == "LOW"


def test_compute_risk_end_to_end():
    verdict = compute_risk(0.9, 0.8, {"government_impersonation": ["digital arrest"]}, [("government_impersonation", "digital arrest")])
    assert verdict.risk_score > 80
    assert verdict.threat_level in ("HIGH", "CRITICAL")


def test_tracker_holds_previous_result_when_note_is_temporarily_unclear():
    tracker = StableNoteTracker(hold_frames=2, min_confidence=0.56)

    tracker.update((10, 10, 80, 60), "REAL", 0.84, 0.10, 0.90)
    bbox, label, confidence, fake_prob, real_prob = tracker.update(None, "NO NOTE", 0.0, 0.0, 0.0)

    assert bbox is not None
    assert label == "REAL"
    assert confidence >= 0.55
    assert real_prob >= 0.85


def test_train_and_save_ignores_duplicate_header_rows(tmp_path):
    csv_path = tmp_path / "duplicate_header.csv"
    csv_path.write_text(
        "message,label\nmessage,label\nhello world,0\nhello there,0\nthis is scam,1\nurgent money,1\nanother legit,0\nanother scam,1\n",
        encoding="utf-8",
    )
    model_path = tmp_path / "fraud_model.joblib"

    report = train_and_save(
        str(csv_path),
        text_col="message",
        label_col="label",
        model_path=str(model_path),
    )

    assert model_path.exists()
    assert report["0"]["f1-score"] > 0
    assert report["1"]["f1-score"] > 0
