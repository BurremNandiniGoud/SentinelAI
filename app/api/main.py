"""
FastAPI application exposing the Fraud Detection Engine.

Run:
    uvicorn app.api.main:app --reload --port 8000

Endpoints:
    POST /predict                    -> analyze raw text (SMS/WhatsApp/email body/etc.)
    POST /predict/image              -> OCR an image then analyze
    POST /predict/pdf                -> extract PDF text then analyze
    POST /predict/currency           -> detect counterfeit currency from image
    GET  /health
"""
import os
import shutil
import tempfile

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from pathlib import Path

from app.preprocessing.clean import normalize_text, clean_for_model, extract_entities
from app.rule_engine.rules import evaluate_rules
from app.ml.model import FraudClassifier
from app.risk_engine.scoring import compute_risk
from app.currency_detection.inference import CurrencyDetectionInference
from app.currency_detection.live_pipeline import LiveCurrencyTracker
from app.api.db import record_scan, get_scan_history, get_latest_alerts, get_latest_news, seed_alerts_and_news

app = FastAPI(
    title="AI Fraud Detection & Currency Detection Engine",
    description="Multimodal fraud & counterfeit currency detection API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = FraudClassifier()
currency_detector = CurrencyDetectionInference()
live_currency_tracker = LiveCurrencyTracker()


class TextRequest(BaseModel):
    text: str = Field(..., description="Raw message text to analyze", min_length=1)
    channel: str = Field(default="sms", description="sms | whatsapp | email | social | other")


class AnalysisResponse(BaseModel):
    risk_score: int
    threat_level: str
    fraud_probability: float
    suggested_action: str
    reasons: list
    matched_signals: list
    extracted_entities: dict
    rule_score: float
    ml_score: float
    ml_model_ready: bool


class CurrencyDetectionResponse(BaseModel):
    status: str
    currency_status: str = Field(..., description="REAL or FAKE")
    fake_probability: float
    real_probability: float
    confidence_percentage: float
    recommendation: str
    details: dict
    bbox: list | None = None


class CurrencyAnalyzeResponse(BaseModel):
    verdict: str
    confidence: float
    authentic_probability: float
    counterfeit_probability: float
    recommendation: str


class MessageAnalyzeResponse(AnalysisResponse):
    pass


def analyze_text(raw_text: str) -> AnalysisResponse:
    if not raw_text or not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text content to analyze.")

    normalized = normalize_text(raw_text)
    cleaned = clean_for_model(normalized)
    entities = extract_entities(normalized)

    rule_result = evaluate_rules(cleaned)
    ml_score = classifier.predict_proba(cleaned) if classifier.is_ready() else rule_result.rule_score

    verdict = compute_risk(
        rule_score=rule_result.rule_score,
        ml_score=ml_score,
        category_hits=rule_result.category_hits,
        matched_signals=rule_result.matched_signals,
    )

    return AnalysisResponse(
        risk_score=verdict.risk_score,
        threat_level=verdict.threat_level,
        fraud_probability=verdict.fraud_probability,
        suggested_action=verdict.suggested_action,
        reasons=verdict.reasons,
        matched_signals=verdict.matched_signals,
        extracted_entities=entities.__dict__,
        rule_score=verdict.rule_score,
        ml_score=verdict.ml_score,
        ml_model_ready=classifier.is_ready(),
    )


@app.get("/health")
def health():
    return {"status": "ok", "ml_model_ready": classifier.is_ready()}


@app.get("/", include_in_schema=False)
def root():
    static_file = Path(__file__).resolve().parent / "static" / "index.html"
    return FileResponse(static_file)


@app.post("/predict", response_model=AnalysisResponse)
def predict_text(payload: TextRequest):
    result = analyze_text(payload.text)
    record_scan(
        scan_type="message",
        source=payload.channel,
        verdict=None,
        threat_level=result.threat_level,
        confidence=float(result.fraud_probability),
        payload={"text": payload.text, "channel": payload.channel},
        result=result.model_dump(),
    )
    return result


@app.post("/api/message/analyze", response_model=MessageAnalyzeResponse)
def api_message_analyze(payload: TextRequest):
    result = analyze_text(payload.text)
    record_scan(
        scan_type="message",
        source=payload.channel,
        verdict=None,
        threat_level=result.threat_level,
        confidence=float(result.fraud_probability),
        payload={"text": payload.text, "channel": payload.channel},
        result=result.model_dump(),
    )
    return result


@app.post("/predict/image", response_model=AnalysisResponse)
async def predict_image(file: UploadFile = File(...)):
    try:
        from app.ocr.extract import extract_text_from_image
    except ModuleNotFoundError as exc:
        raise HTTPException(status_code=500, detail="OCR dependencies are not installed.") from exc

    suffix = os.path.splitext(file.filename)[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        text = extract_text_from_image(tmp_path)
        result = analyze_text(text)
        record_scan(
            scan_type="message",
            source="image",
            verdict=None,
            threat_level=result.threat_level,
            confidence=float(result.fraud_probability),
            payload={"filename": file.filename},
            result=result.model_dump(),
        )
        return result
    finally:
        os.remove(tmp_path)


@app.post("/api/message/analyze/image", response_model=MessageAnalyzeResponse)
async def api_message_image_analyze(file: UploadFile = File(...)):
    try:
        from app.ocr.extract import extract_text_from_image
    except ModuleNotFoundError as exc:
        raise HTTPException(status_code=500, detail="OCR dependencies are not installed.") from exc

    suffix = os.path.splitext(file.filename)[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        text = extract_text_from_image(tmp_path)
        result = analyze_text(text)
        record_scan(
            scan_type="message",
            source="image",
            verdict=None,
            threat_level=result.threat_level,
            confidence=float(result.fraud_probability),
            payload={"filename": file.filename},
            result=result.model_dump(),
        )
        return result
    finally:
        os.remove(tmp_path)


@app.post("/predict/pdf", response_model=AnalysisResponse)
async def predict_pdf(file: UploadFile = File(...)):
    try:
        from app.ocr.extract import extract_text_from_pdf
    except ModuleNotFoundError as exc:
        raise HTTPException(status_code=500, detail="OCR dependencies are not installed.") from exc

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        text = extract_text_from_pdf(tmp_path)
        result = analyze_text(text)
        record_scan(
            scan_type="message",
            source="pdf",
            verdict=None,
            threat_level=result.threat_level,
            confidence=float(result.fraud_probability),
            payload={"filename": file.filename},
            result=result.model_dump(),
        )
        return result
    finally:
        os.remove(tmp_path)


@app.post("/predict/currency/live")
async def predict_currency_live(file: UploadFile = File(...)):
    """Run the live note-tracking pipeline on a webcam frame."""
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPEG or PNG image.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty frame received.")

    frame_array = np.frombuffer(contents, dtype=np.uint8)
    frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded frame.")

    try:
        _, bbox, label, confidence, fake_prob, real_prob = live_currency_tracker.process_frame(frame)
        confidence_pct = float(confidence * 100)
        is_fake = fake_prob > real_prob
        recommendation = (
            'DO NOT ACCEPT - Currency appears to be counterfeit'
            if is_fake
            else 'Currency appears authentic'
        ) if label != 'NO NOTE' else 'No currency note detected. Position the note clearly in the frame.'
        result_payload = {
            'status': 'success',
            'currency_status': label,
            'fake_probability': float(fake_prob),
            'real_probability': float(real_prob),
            'confidence_percentage': confidence_pct,
            'recommendation': recommendation,
            'details': {
                'confidence_level': (
                    'HIGH' if confidence_pct > 80
                    else 'MEDIUM' if confidence_pct > 60
                    else 'LOW'
                ),
                'tracking_status': 'TRACKING' if bbox is not None else 'NO NOTE',
                'bbox': list(bbox) if bbox is not None else None,
                'tracking_confidence': float(live_currency_tracker.last_tracking_confidence),
            },
            'bbox': list(bbox) if bbox is not None else None,
        }
        record_scan(
            scan_type="currency_live",
            source="webcam",
            verdict=label,
            threat_level=None,
            confidence=confidence_pct,
            payload={"frame_name": file.filename},
            result=result_payload,
        )
        return result_payload
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/predict/currency", response_model=CurrencyDetectionResponse)
async def predict_currency(file: UploadFile = File(...)):
    """Detect if a currency note in an uploaded image is real or counterfeit."""
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPEG or PNG image.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image received.")

    frame_array = np.frombuffer(contents, dtype=np.uint8)
    frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded image.")

    try:
        live_currency_tracker.last_bbox = None
        live_currency_tracker.tracker.last_bbox = None
        live_currency_tracker.tracker.history.clear()
        _, bbox, label, confidence, fake_prob, real_prob = live_currency_tracker.process_frame(frame)
        confidence_pct = float(confidence * 100)
        is_fake = fake_prob > real_prob
        recommendation = (
            'DO NOT ACCEPT - Currency appears to be counterfeit'
            if is_fake
            else 'Currency appears authentic'
        ) if label != 'NO NOTE' else 'No currency note detected. Position the note clearly in the frame.'
        response = CurrencyDetectionResponse(
            status='success',
            currency_status=label,
            fake_probability=float(fake_prob),
            real_probability=float(real_prob),
            confidence_percentage=confidence_pct,
            recommendation=recommendation,
            details={
                'confidence_level': (
                    'HIGH' if confidence_pct > 80
                    else 'MEDIUM' if confidence_pct > 60
                    else 'LOW'
                ),
                'tracking_status': 'TRACKING' if bbox is not None else 'NO NOTE',
                'bbox': list(bbox) if bbox is not None else None,
            },
            bbox=list(bbox) if bbox is not None else None,
        )
        record_scan(
            scan_type="currency_upload",
            source="image",
            verdict=response.currency_status,
            threat_level=None,
            confidence=response.confidence_percentage,
            payload={"filename": file.filename},
            result=response.model_dump(),
        )
        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/currency/analyze", response_model=CurrencyAnalyzeResponse)
async def api_currency_analyze(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail='Invalid file type. Please upload JPEG or PNG image.')

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail='Empty image received.')

    suffix = os.path.splitext(file.filename)[1] or '.png'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name
    try:
        inference = currency_detector.predict(tmp_path)
    finally:
        os.remove(tmp_path)

    if inference.get('status') != 'success':
        raise HTTPException(status_code=500, detail=inference.get('message', 'Currency analysis failed.'))

    verdict = inference['currency_status']
    auth_prob = float(inference['real_probability'])
    counter_prob = float(inference['fake_probability'])
    confidence = float(inference['confidence_percentage'])
    result_payload = {
        'verdict': verdict,
        'confidence': confidence,
        'authentic_probability': auth_prob * 100.0 if auth_prob <= 1 else auth_prob,
        'counterfeit_probability': counter_prob * 100.0 if counter_prob <= 1 else counter_prob,
        'recommendation': inference['recommendation'],
    }
    record_scan(
        scan_type='currency_upload',
        source='image',
        verdict=verdict,
        threat_level=None,
        confidence=confidence,
        payload={'filename': file.filename},
        result=result_payload,
    )
    return result_payload


@app.websocket("/api/currency/live")
async def websocket_currency_live(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            frame_array = np.frombuffer(data, dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
            if frame is None:
                await websocket.send_json({"error": "Could not decode frame."})
                continue
            try:
                _, bbox, label, confidence, fake_prob, real_prob = live_currency_tracker.process_frame(frame)
                confidence_pct = float(confidence * 100)
                recommendation = (
                    'DO NOT ACCEPT - Currency appears to be counterfeit'
                    if fake_prob > real_prob
                    else 'Currency appears authentic'
                ) if label != 'NO NOTE' else 'No currency note detected. Position the note clearly in the frame.'
                response_payload = {
                    'verdict': label,
                    'confidence': confidence_pct,
                    'authentic_probability': float(real_prob) * 100.0,
                    'counterfeit_probability': float(fake_prob) * 100.0,
                    'recommendation': recommendation,
                }
                record_scan(
                    scan_type="currency_live",
                    source="websocket",
                    verdict=label,
                    threat_level=None,
                    confidence=confidence_pct,
                    payload={},
                    result=response_payload,
                )
                await websocket.send_json(response_payload)
            except Exception as exc:
                await websocket.send_json({"error": str(exc)})
    except WebSocketDisconnect:
        return


@app.get("/api/analytics")
def api_analytics(limit: int = 200, scan_type: str | None = None):
    return {"history": get_scan_history(limit=limit, scan_type=scan_type)}


@app.get("/api/alerts")
def api_alerts(limit: int = 10):
    return {"alerts": get_latest_alerts(limit)}


@app.get("/api/news")
def api_news(limit: int = 10):
    return {"news": get_latest_news(limit)}


@app.on_event("startup")
def on_startup():
    seed_alerts_and_news()
