# SentinelAI — AI-Powered Digital Public Safety Intelligence Platform

## Hackathon Submission Document

**Theme:** Smart Cities / Public Safety / Digital Trust / Geospatial Law Enforcement

**Problem Statement:** AI for Digital Public Safety — Defeating Counterfeiting, Fraud & Digital Arrest Scams

**Team:** SentinelAI

**Date:** July 2026

---

## Executive Summary

India registered **1.14 million cybercrime complaints in 2023** — up 60% YoY — with digital arrest scams alone defrauding citizens of **₹1,776 crore in just 9 months of 2024** (Ministry of Home Affairs). Simultaneously, counterfeit currency circulation reached record levels, with high-quality ₹500 fakes defeating routine manual detection (RBI Annual Report 2025).

SentinelAI is a **working, end-to-end AI-powered digital public safety platform** that attacks both problems simultaneously:

1. **Counterfeit Currency Detection** — a computer vision model deployable on mobile devices and bank terminals that classifies notes as REAL or FAKE in real time
2. **Scam & Fraud Message Risk Analyzer** — a hybrid NLP + rule engine that scores suspicious messages for fraud risk and extracts actionable entities (phones, UPI IDs, URLs, account numbers)

Both models are **trained, tested, and integrated into a unified React + FastAPI dashboard** with live camera scanning, analytics, scam alerts, and citizen safety guidance. The platform shifts the paradigm from **reactive complaint investigation to proactive threat detection at the point of contact.**

---

## Problem Context

### The Scale of Cyber Fraud in India

| Metric | Value | Source |
|--------|-------|--------|
| Cybercrime complaints (2023) | 1.14 million | NCRB |
| YoY increase | ~60% | MHA |
| Digital arrest scam losses (2024, 9 months) | ₹1,776 crore | MHA |
| Total cyber fraud losses (2024) | ₹11,266 crore | MHA Report |
| Counterfeit currency seizures | Record high | RBI Annual Report 2025 |
| Average time before funds moved after fraud | 22 minutes | I4C |

### The Core Gap

Law enforcement has **evidence after the fact** — FIRs, complaints, forensic reports. What they lack is **intelligence before mass victimization** and tools to detect threats at the **point of contact rather than the point of complaint.** Fraud operations are industrialized, cross-border, and AI-assisted — using spoofed numbers, AI-generated voices, fake government portals, and psychological manipulation scripts refined over thousands of attacks.

SentinelAI addresses this gap by putting **AI-powered verification directly in citizens' hands** — a note in front of a camera, a message in front of a classifier — before money moves or personal data is surrendered.

---

## What We Built — Working Prototype

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT LAYER                                   │
│  Live Camera │ Image Upload │ Text Paste │ Screenshot Upload │ File  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       MODEL LAYER (Trained)                          │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │ Currency CV Model    │    │ Message Risk Classifier          │   │
│  │ • EfficientNetB3     │    │ • Rule Engine (19 categories,    │   │
│  │ • Binary: REAL/FAKE  │    │   130+ signal phrases)           │   │
│  │ • Live tracking      │    │ • TF-IDF + Logistic Regression   │   │
│  │ • Confidence scoring │    │ • Entity extraction              │   │
│  └──────────────────────┘    └──────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                               │
│  Risk Scoring │ Entity Extraction │ Plain-Language Explanations     │
│  Analytics Aggregation │ Alert Generation │ History Persistence     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                               │
│  React SPA │ Real-time Dashboard │ Theme: Light/Dark │ Responsive   │
│  Framer Motion Animations │ Three.js 3D Visualization              │
└─────────────────────────────────────────────────────────────────────┘
```

### Model 1: Counterfeit Currency Detection Engine

**Technology:** Transfer Learning with EfficientNetB3 backbone, OpenCV preprocessing pipeline, live object tracking

**Capabilities:**
- **Live Camera Mode:** Point camera at a banknote — continuous frame analysis at 2-4 FPS with real-time verdict overlay
- **Image Upload Mode:** Submit a photo for single detailed analysis with probability breakdown
- **WebSocket Streaming:** Real-time frame processing for uninterrupted live scanning
- **Tracking Pipeline:** Kalman-filter-based note tracking across frames

**Actual Model Output:**
```json
{
  "verdict": "REAL",
  "confidence": 92.1,
  "authentic_probability": 92.1,
  "counterfeit_probability": 7.9,
  "recommendation": "Currency appears authentic"
}
```

**Detected Security Features:** Watermark, Security Thread, Micro-printing, Color-shift Ink, See-through Register

**Training Approach:**
- Phase 1: Frozen backbone feature extraction
- Phase 2: Fine-tuning with domain-specific currency data
- Data augmentation: rotation, zoom, brightness, shift
- Regularization: L2, Dropout, BatchNormalization
- Metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC

### Model 2: Scam & Fraud Message Risk Analyzer

**Technology:** Hybrid architecture — Rule Engine (55% weight) + ML Classifier (45% weight), Entity Extraction

**Rule Engine Coverage:** 19 scam categories, 130+ weighted signal phrases including:
- Government impersonation (CBI, ED, Income Tax, Customs, TRAI)
- Fear & legal threats (arrest warrant, criminal case, money laundering)
- Urgency patterns (immediate, within 30 minutes, last warning)
- Isolation & secrecy demands (do not tell anyone, stay on line)
- Financial demands (transfer money, share OTP, scan QR code)
- Remote access (AnyDesk, TeamViewer, screen control)
- Identity verification scams (KYC update, Aadhaar verification)
- Plus 12 more categories: lottery, job, investment, loan, courier/customs, UPI/QR, bank phishing, family impersonation, utility, Aadhaar, card, fake government schemes

**ML Classifier:** TF-IDF vectorization (ngram 1-2, 20K features, sublinear TF) + Logistic Regression (balanced class weights, L2 regularization), trained on labeled scam message corpus

**Actual Model Output:**
```json
{
  "risk_score": 85,
  "threat_level": "HIGH",
  "fraud_probability": 0.85,
  "suggested_action": "Treat as highly suspicious. Do not act on any instructions.",
  "reasons": [
    "Impersonation of government/law-enforcement authority",
    "Use of fear tactics or legal threats",
    "Artificial urgency to pressure quick action"
  ],
  "matched_signals": ["government_impersonation: 'cbi officer'", "..."],
  "extracted_entities": {
    "phones": ["+91-XXXXXXXXXX"],
    "emails": [],
    "upi_ids": ["scammer@upi"],
    "urls": ["https://fake-portal.tk"],
    "account_numbers": [],
    "currency_mentions": []
  },
  "rule_score": 0.92,
  "ml_score": 0.76,
  "ml_model_ready": true
}
```

### Unified Dashboard & Feature Layer

Built on the two trained models, the platform includes a comprehensive suite of features requiring **zero new model training:**

| Feature | Implementation |
|---------|---------------|
| **Real-time Dashboard** | Live threat counter, scan history, analytics, AI status monitoring |
| **Dynamic News & Alerts** | Backend SQLite DB + REST API for scam advisories and cyber safety news — fully dynamic, seedable, extensible |
| **Batch Analytics** | Charts and statistics over stored scan history (currency + message) |
| **Light/Dark Theme** | CSS variable-based theming with persisted preference |
| **Safety Tips & Advisory** | Curated guidance from I4C, RBI, MHA with live links to official portals |
| **Offline-First Design** | Full frontend functionality without backend — graceful degradation with mock fallbacks |
| **Responsive UI** | Works on mobile, tablet, and desktop with adaptive layouts |
| **Entity Chip Clusters** | Extracted phones, emails, UPI IDs, URLs grouped visually for quick review |
| **Risk Gauge Cards** | Color-coded threat level displays with confidence percentages |
| **Scan History** | localStorage-persisted history with CSV/JSON export |
| **3D Threat Visualization** | Three.js animated hero section on landing page |
| **Framer Motion Transitions** | Page-level and micro-interactions throughout |

---

## Innovation & Technical Excellence

### What Makes SentinelAI Different

1. **Dual-Model Architecture**
   — Not two separate tools, but one unified intelligence platform. The currency CV model and message NLP model share infrastructure, analytics, and user experience. A bank teller checking notes and a citizen checking messages use the same dashboard.

2. **Hybrid Rule + ML Scoring**
   — The message classifier doesn't rely on a single black-box model. The rule engine provides high-precision, explainable detection (55% weight), while the ML model fills coverage gaps for novel scam patterns (45% weight). Both scores are shown to the user for full transparency.

3. **Real-Time Live Scanning**
   — Currency detection isn't batch — it's a live camera pipeline with object tracking, continuous verdict updates, and frame-by-frame analysis. This means a bank teller or shopkeeper can verify notes in real time during transactions.

4. **Entity Extraction as Intelligence**
   — The message analyzer doesn't just say "this looks fraudulent." It extracts phones, UPI IDs, URLs, and account numbers — the raw intelligence that law enforcement and banks need to trace fraud networks.

5. **Explainability Built In**
   — Every verdict comes with reasons, matched signals, and suggested actions in plain language. No "the model says 87%" — the user sees exactly which signals triggered the alert and why.

6. **Designed for Scale**
   — The architecture supports adding new models (deepfake detection, voice analysis, geospatial prediction) without touching the frontend or orchestration layers. The API contract is model-agnostic.

### Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript 6, Vite 8, Tailwind CSS 4, Framer Motion 11, React Router 7, Recharts, Three.js (React Three Fiber), Zustand |
| **Backend** | FastAPI (Python 3.12), Pydantic v2, WebSocket support |
| **CV Model** | TensorFlow 2.15, EfficientNetB3, OpenCV 4.8, custom tracking pipeline |
| **NLP Model** | scikit-learn 1.5, TF-IDF + Logistic Regression pipeline, 19-category rule engine |
| **Storage** | SQLite (scan history, alerts, news), localStorage (client-side history) |
| **Deployment** | Docker, Uvicorn ASGI server |

---

## Business Impact & Scalability

### Target Users

| User | Use Case | How SentinelAI Helps |
|------|----------|---------------------|
| **Citizens** | Receiving suspicious SMS/WhatsApp messages | Paste message → instant risk verdict + entity extraction |
| **Citizens** | Receiving currency in cash transactions | Hold note to camera → REAL/FAKE verdict in seconds |
| **Bank Tellers** | Bulk currency verification | Live camera mode for continuous note checking |
| **Shopkeepers** | Daily cash handling | Mobile-friendly scanner for on-the-spot verification |
| **Law Enforcement** | Investigating fraud complaints | Entity linking across scans, case-building templates |
| **Cyber Cells** | Monitoring scam trends | Analytics dashboard, scam type distribution, threat intelligence |

### Deployment Scenarios

1. **Standalone Mobile App:** Package the React frontend as a PWA — works offline, installable on any smartphone
2. **Bank Branch Deployment:** Run backend on-premises, connect teller terminals via local network
3. **Cloud-Hosted SaaS:** Deploy on AWS/GCP with PostgreSQL, scale to handle millions of daily scans
4. **Edge Deployment:** Convert CV model to TensorFlow Lite for on-device inference on low-end phones
5. **WhatsApp Bot Integration:** Connect the message analyzer to WhatsApp Business API for citizen-facing chatbot

### Scalability Architecture

- **Stateless API:** The FastAPI backend is horizontally scalable behind a load balancer
- **Model Caching:** Trained models loaded once at startup, shared across requests
- **Database Migration Path:** SQLite → PostgreSQL for concurrent write workloads
- **CDN for Frontend:** Vite-built static assets deployable to any CDN/edge network
- **API Versioning:** Versioned endpoints allow model updates without breaking existing clients

---

## Feature Layer — Zero New Model Training

Every feature below is built by orchestrating the two existing models. None requires training a new model — this is honest scope for hackathon judging.

| Feature | How It Works | Reuses |
|---------|-------------|--------|
| Batch Currency Checks + Denomination Analytics | Run CV model over multiple images, aggregate results | Currency model |
| SMS Fraud Detection | Same text classifier, new intake channel (SMS forwarding) | Message model |
| WhatsApp Forward-and-Verify | Classifier called via WhatsApp Business API webhook | Message model |
| QR Code Scam Detector | Decode QR client-side, feed URL/text into message model | Message model |
| Browser Extension Phishing Warning | Extract page URL/text, run through message model + domain rules | Message model |
| UPI Safety Checker | Cross-check extracted UPI IDs against reported-ID lookup table | Message model output |
| Fake Government Portal Verification | Rule-based checks on extracted URLs (domain allow-list, WHOIS, SSL) | Message model output |
| Fraud Network Graph (Lite) | Link repeated phones/UPI IDs across analyzed messages — data linking, not ML | Message model entities |
| AI Case Builder | Auto-fill report template (Word/PDF) with model outputs + entities + timestamps | Both models |
| Multilingual Assistant | Existing LLM API explains reasons/matched_signals conversationally in 12 languages | Both models + LLM API |
| Emergency Panic Button | Device geolocation + notification APIs — pure app logic | App logic |
| Complaint Tracking & NCRB Linkage | Status state-machine + deep-link to cybercrime.gov.in | App logic |
| Geospatial Hotspot Map (Lite) | Plot geotagged reports on map — display only, no predictive model | App logic + reports |
| Interactive Awareness Quizzes | Quiz content from prompting existing LLM API | LLM API |

---

## Judging Criteria Response

### Innovation (25%)

SentinelAI innovates by **fusing two traditionally separate AI domains** (computer vision + NLP) into a **single unified public safety dashboard.** The hybrid rule-engine + ML architecture for message scoring is novel — it provides both the precision of expert-crafted rules and the adaptability of machine learning, with full transparency into both scores. The real-time live currency scanner with object tracking pushes beyond typical "upload and wait" CV demos.

### Business Impact (25%)

The platform directly addresses a **₹11,266 crore annual problem** affecting every Indian citizen with a smartphone. Deployment vectors span individual users, banks, retail, law enforcement, and government agencies. The dual-model approach means one platform serves two massive use cases. The offline-first design ensures accessibility in low-connectivity areas where scam vulnerability is highest.

### Technical Excellence (20%)

- Two independently trained AI models, both tested and integrated
- Real-time computer vision pipeline with object tracking
- 19-category, 130+ signal rule engine with weighted scoring
- Hybrid ML + rule risk fusion algorithm
- Full-stack TypeScript + Python with WebSocket streaming
- API versioning, CORS, error handling, health checks — production-ready
- Dynamic news/alerts system with SQLite backend and REST API
- Responsive cartoon-brutalist UI with Framer Motion and Three.js

### Scalability (15%)

- Stateless backend for horizontal scaling
- SQLite → PostgreSQL migration path documented
- Model-agnostic API contract — swap models without touching frontend
- Docker containerization for consistent deployment
- Offline-first PWA architecture for mobile deployment
- Edge deployment path (TensorFlow Lite) for low-end devices

### User Experience (15%)

- Instant verdict display — no training or setup required
- Live camera scanning — hold note up, see result in real time
- Color-coded threat levels (LOW/MEDIUM/HIGH/CRITICAL) with plain-language guidance
- Entity extraction displayed as visual chip clusters
- Light/dark theme with smooth transitions
- Responsive design across mobile, tablet, and desktop
- Graceful degradation when backend is unavailable
- Accessibility: offline mode, large touch targets, clear labels

---

## Deliberately Out of Scope (Phase 2)

Listed openly for transparency — these genuinely need their own training data and models:

- Live call/video digital-arrest detection (voice + script + cadence classification)
- Deepfake and AI-generated voice detection
- Predictive threat forecasting (emerging scam campaign prediction)
- Real-time telecom network integration for call interception
- Multi-source intelligence fusion with government databases
- Court-admissible evidence packaging with chain-of-custody

---

## Deliverables

| Deliverable | Status | Location |
|------------|--------|----------|
| **Working Prototype** | ✅ Complete | Repository root — both models integrated and running |
| **Architecture Diagram** | ✅ Included | Section above (ASCII) + slides |
| **Presentation Deck** | ✅ Ready | Available in repository |
| **Demo Video** | ✅ Prepared | Walking through both detection flows |
| **README** | ✅ Complete | README.md with setup instructions and API docs |
| **Submission Document** | ✅ This file | SUBMISSION_DOCUMENT.md |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/karthikgoud24/SentinelAI.git
cd SentinelAI

# Install backend dependencies
pip install -r requirements.txt

# Train the fraud detection model
python train.py --data data/sample_dataset.csv

# Start the backend server
uvicorn app.api.main:app --reload --port 8000

# In another terminal — start the frontend
cd frontend
npm install
npm run dev
```

**Open http://localhost:5173** to access the SentinelAI dashboard.

### Test the API

```bash
# Health check
curl http://localhost:8000/health

# Analyze a scam message
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "This is CBI officer. Digital arrest warrant issued. Transfer money now.", "channel": "sms"}'

# Check currency
curl -X POST http://localhost:8000/predict/currency \
  -F "file=@path/to/currency_note.jpg"

# Get live scam alerts (dynamic)
curl http://localhost:8000/api/alerts

# Get latest news (dynamic)
curl http://localhost:8000/api/news
```

---

## Repository Structure

```
SentinelAI/
├── app/
│   ├── preprocessing/clean.py           # Text normalization, entity extraction
│   ├── rule_engine/rules.py             # 19-category, 130+ signal rule engine
│   ├── ml/model.py                      # TF-IDF + LogisticRegression pipeline
│   ├── risk_engine/scoring.py           # Hybrid rule + ML risk fusion
│   ├── ocr/extract.py                   # Image + PDF text extraction
│   ├── currency_detection/              # Currency CV detection module
│   │   ├── model.py                     # EfficientNetB3 transfer learning
│   │   ├── preprocessing.py             # Image preprocessing + enhancement
│   │   ├── inference.py                 # Prediction inference wrapper
│   │   ├── live_pipeline.py             # Real-time tracking pipeline
│   │   └── artifacts/                   # Trained model weights
│   └── api/
│       ├── main.py                      # FastAPI app with all endpoints
│       └── db.py                        # SQLite: scan history, alerts, news
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx                  # Landing page with 3D hero
│       │   ├── AnimatedDashboard.tsx     # Main dashboard (dynamic alerts/news)
│       │   ├── ScanCurrency.tsx          # Live camera + upload scanner
│       │   ├── CheckMessage.tsx          # Message risk analyzer
│       │   └── Analytics.tsx             # Scan history + charts
│       ├── components/                   # Reusable UI components
│       ├── lib/                          # API client, storage, theme
│       └── types.ts                      # TypeScript interfaces
├── data/
│   └── sample_dataset.csv               # Training data for fraud model
├── train.py                             # Fraud model training script
├── train_currency_model.py              # Currency model training script
├── requirements.txt                     # Python dependencies
├── Dockerfile                           # Container configuration
├── README.md                            # Full documentation
└── SUBMISSION_DOCUMENT.md               # This file — hackathon submission
```

---

**SentinelAI — Protecting India from scams, one scan at a time.**
