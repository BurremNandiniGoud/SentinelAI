<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered_Public_Safety-Platform-brass?style=for-the-badge" alt="AI-Powered Public Safety Platform" />
  <img src="https://img.shields.io/badge/Hackathon-Winning_Build-green?style=for-the-badge" alt="Hackathon Build" />
</p>

<h1 align="center">🛡️ SentinelAI</h1>

<p align="center">
  <strong>AI-Powered Digital Public Safety Intelligence Platform</strong><br/>
  Defeating Counterfeiting, Fraud & Digital Arrest Scams in India
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-what-it-does">What It Does</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-submission">Submission</a>
</p>

---

## ⚡ Why SentinelAI

India registered **1.14 million cybercrime complaints in 2023** — up 60% from 2022. Digital arrest scams alone defrauded citizens of **₹1,776 crore in just 9 months of 2024**. Counterfeit currency seizures hit record highs, with high-quality ₹500 fakes defeating manual detection.

**The gap:** Law enforcement has evidence after the fact. What's missing is intelligence **before** money moves — detection at the **point of contact, not the point of complaint.**

SentinelAI closes this gap with **two trained AI models in one unified platform:**

| Model | What It Detects | How |
|-------|----------------|-----|
| 🏦 **Currency CV Model** | Counterfeit banknotes | Real-time camera scan or image upload → REAL/FAKE verdict with confidence |
| 📱 **Message Risk Classifier** | Scam SMS, WhatsApp forwards, phishing | Paste text → instant threat score with entity extraction + plain-language explanation |

Both models are **trained, integrated, and running end-to-end** in a single React + FastAPI dashboard.

---

## 🎯 What It Does

### Live Counterfeit Currency Detection

- **Live Camera Mode:** Point your camera at a note — real-time verdict overlay, no upload needed
- **Image Upload Mode:** Submit a photo for detailed probability breakdown
- **Detects:** Watermark, security thread, micro-printing, color-shift ink, see-through register
- **Confidence scoring** with authentic vs counterfeit probability split
- **WebSocket streaming** for uninterrupted frame-by-frame analysis

![Currency Detection]

### Scam Message Risk Analysis

- **Paste or type any message** — SMS, WhatsApp, email, social media
- **Hybrid scoring:** Rule engine (19 categories, 130+ signal phrases) + ML classifier
- **Entity extraction:** Phones 📞, UPI IDs 💳, URLs 🔗, emails ✉️, account numbers 🏦
- **Plain-language verdict** with suggested actions and matched scam signals
- **Threat levels:** LOW · MEDIUM · HIGH · CRITICAL with color-coded badges

![Message Analysis]

### Unified Intelligence Dashboard

- **Real-time threat counter** — live updating threat interception count
- **Dynamic scam alerts** — backend-served advisories from government sources (MHA, RBI, CBI)
- **Dynamic news feed** — cyber safety updates from official channels
- **AI model status monitoring** — uptime, latency, model readiness
- **Scan history** — persisted in browser with CSV/JSON export
- **Analytics dashboard** — charts over all past scans
- **Safety tips & government advisory** — curated guidance with direct links to official portals
- **Light/Dark theme** — persisted preference with smooth transitions

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      INPUT LAYER                              │
│  Live Camera  │  Image Upload  │  Text Paste  │  File Upload  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    MODEL LAYER (Trained)                      │
│  ┌─────────────────────┐   ┌─────────────────────────────┐   │
│  │ Currency CV Model    │   │ Message Risk Classifier     │   │
│  │ EfficientNetB3       │   │ Rule Engine (19 categories) │   │
│  │ REAL/FAKE binary     │   │ + TF-IDF LogisticRegression │   │
│  │ Live object tracking │   │ + Entity extraction         │   │
│  └─────────────────────┘   └─────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 ORCHESTRATION LAYER                           │
│  Risk Scoring  │  Entity Linking  │  Alert Generation        │
│  Analytics     │  History          │  Seed Data              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                            │
│  React 19 SPA  │  Real-time Dashboard  │  Light/Dark Theme   │
│  Framer Motion  │  Three.js 3D Hero    │  Fully Responsive   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Tesseract OCR** (for image/PDF message scanning)
  - Ubuntu: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`
  - Windows: [Download installer](https://github.com/UB-Mannheim/tesseract/wiki)

### 1. Clone & Install Backend

```bash
git clone https://github.com/karthikgoud24/SentinelAI.git
cd SentinelAI

# Create virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the fraud detection model
python train.py --data data/sample_dataset.csv

# Start the API server
uvicorn app.api.main:app --reload --port 8000
```

### 2. Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Open the Dashboard

Visit **http://localhost:5173** — the SentinelAI dashboard loads with:
- 3D animated hero section
- Live threat intelligence metrics
- Currency scanner (live camera + upload)
- Message risk analyzer
- Dynamic scam alerts & news (from backend DB)
- Analytics & scan history

---

## 📡 API Reference

The FastAPI backend runs on `http://localhost:8000`. Interactive docs at `/docs`.

### Fraud Detection

```bash
# Analyze a scam message
curl -X POST http://localhost:8000/api/message/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is CBI officer. Digital arrest warrant issued against you. Transfer ₹50,000 immediately to avoid arrest.",
    "channel": "sms"
  }'
```

**Response:**
```json
{
  "risk_score": 85,
  "threat_level": "HIGH",
  "fraud_probability": 0.85,
  "suggested_action": "Treat as highly suspicious. Do not act on any instructions. Verify independently through official channels.",
  "reasons": [
    "Impersonation of government/law-enforcement authority",
    "Use of fear tactics or legal threats",
    "Direct demand for money, OTP, or bank details"
  ],
  "matched_signals": [
    "government_impersonation: 'cbi officer'",
    "fear_and_legal_threat: 'arrest warrant'",
    "financial_demand: 'transfer'"
  ],
  "extracted_entities": {
    "phones": [],
    "emails": [],
    "upi_ids": [],
    "urls": [],
    "account_numbers": [],
    "currency_mentions": ["₹50,000"]
  },
  "rule_score": 0.92,
  "ml_score": 0.76,
  "ml_model_ready": true
}
```

### Currency Detection

```bash
# Upload a currency note image
curl -X POST http://localhost:8000/api/currency/analyze \
  -F "file=@path/to/currency_note.jpg"
```

**Response:**
```json
{
  "verdict": "REAL",
  "confidence": 92.1,
  "authentic_probability": 92.1,
  "counterfeit_probability": 7.9,
  "recommendation": "Currency appears authentic"
}
```

### Dynamic Alerts & News

```bash
# Get latest scam alerts (from database — dynamic, seedable)
curl http://localhost:8000/api/alerts?limit=5

# Get latest cyber safety news
curl http://localhost:8000/api/news?limit=5

# Get analytics / scan history
curl http://localhost:8000/api/analytics?scan_type=message
```

### WebSocket — Live Currency Scanning

```javascript
const ws = new WebSocket('ws://localhost:8000/api/currency/live')
ws.onmessage = (event) => {
  const result = JSON.parse(event.data)
  // result.verdict, result.confidence, result.recommendation
}
```

### All Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health + model status |
| `/api/message/analyze` | POST | Analyze text for fraud |
| `/api/message/analyze/image` | POST | OCR image then analyze text |
| `/api/currency/analyze` | POST | Detect counterfeit currency |
| `/api/currency/live` | WebSocket | Real-time camera frame analysis |
| `/api/alerts` | GET | Latest scam advisories (dynamic) |
| `/api/news` | GET | Latest cyber safety news (dynamic) |
| `/api/analytics` | GET | Scan history with optional type filter |

---

## 🧠 The AI Models

### Currency Detection Model

| Aspect | Detail |
|--------|--------|
| Architecture | EfficientNetB3 (Transfer Learning) |
| Training | Phase 1: Frozen backbone → Phase 2: Fine-tuning |
| Input | 224×224 RGB currency note images |
| Output | REAL / FAKE with confidence probability |
| Features Detected | Watermark, security thread, micro-printing, color-shift ink |
| Data Augmentation | Rotation, zoom, brightness, horizontal/vertical shift |
| Live Mode | 2-4 FPS with Kalman-filter object tracking |
| Accuracy Target | >92% on test set |

### Message Risk Classifier

| Aspect | Detail |
|--------|--------|
| Architecture | Hybrid: Rule Engine (55%) + ML Classifier (45%) |
| Rule Engine | 19 scam categories, 130+ weighted signal phrases |
| ML Model | TF-IDF (ngram 1-2, 20K features) + Logistic Regression |
| Entity Extraction | Regex-based: phones, emails, UPI IDs, URLs, account numbers, currency mentions |
| Threat Levels | LOW (<35%) · MEDIUM (35-60%) · HIGH (60-85%) · CRITICAL (>85%) |
| Explainability | Matched signals, category hits, reasons in plain language |

### Scoring Formula

```
Combined Score = 0.55 × Rule Score + 0.45 × ML Score
Risk Score     = Combined Score × 100
Threat Level   = LOW | MEDIUM | HIGH | CRITICAL (based on thresholds)
```

The rule engine is weighted higher because it provides **high-precision, explainable** detection on known scam patterns. The ML model fills coverage gaps for evolving and novel scam language.

---

## 📁 Project Structure

```
SentinelAI/
├── app/
│   ├── preprocessing/clean.py           # Text normalization + entity extraction
│   ├── rule_engine/rules.py             # 19-category weighted rule engine
│   ├── ml/model.py                      # TF-IDF + Logistic Regression pipeline
│   ├── risk_engine/scoring.py           # Hybrid rule + ML risk fusion engine
│   ├── ocr/extract.py                   # Tesseract OCR + PDF text extraction
│   ├── currency_detection/              # ─── Currency CV Module ───
│   │   ├── model.py                     #   EfficientNetB3 model definition
│   │   ├── preprocessing.py             #   Image enhancement pipeline
│   │   ├── inference.py                 #   Prediction wrapper
│   │   ├── live_pipeline.py             #   Real-time tracking pipeline
│   │   ├── camera.py                    #   Camera interface
│   │   ├── tracker.py                   #   Kalman filter object tracking
│   │   └── artifacts/                   #   Trained model weights
│   └── api/
│       ├── main.py                      # FastAPI app — all endpoints
│       └── db.py                        # SQLite: scans, alerts, news
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx                  # Landing page with Three.js 3D hero
│   │   │   ├── AnimatedDashboard.tsx     # Main dashboard (dynamic alerts/news)
│   │   │   ├── ScanCurrency.tsx          # Live camera + upload scanner
│   │   │   ├── CheckMessage.tsx          # Message risk analyzer
│   │   │   └── Analytics.tsx             # Scan history + charts
│   │   ├── components/
│   │   │   ├── ThreatFieldDive.tsx       # Three.js 3D particle hero
│   │   │   ├── LiveCameraScanner.tsx     # WebRTC camera with overlay
│   │   │   ├── RiskGaugeCard.tsx         # Risk score gauge component
│   │   │   ├── VerdictSeal.tsx           # REAL/FAKE verdict badge
│   │   │   ├── EntityChipGroup.tsx       # Extracted entity chip display
│   │   │   ├── ScoreCompareBar.tsx       # Rule vs ML score comparison
│   │   │   ├── AnalyticsCharts.tsx       # Recharts-based analytics
│   │   │   ├── CountUp.tsx              # Animated number counter
│   │   │   └── ThemeToggle.tsx          # Light/dark theme switcher
│   │   ├── lib/
│   │   │   ├── api.ts                    # Axios API client
│   │   │   ├── storage.ts               # localStorage scan history
│   │   │   ├── mockData.ts              # Offline fallback data
│   │   │   └── theme.ts                 # Theme management
│   │   ├── types.ts                      # TypeScript interfaces
│   │   └── App.tsx                       # Router + layout
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── sample_dataset.csv               # Labeled scam message training data
├── train.py                             # Fraud model training script
├── train_currency_model.py              # Currency model training script
├── requirements.txt                     # All Python dependencies
├── Dockerfile                           # Production deployment config
├── README.md                            # This file
└── SUBMISSION_DOCUMENT.md               # Detailed hackathon submission
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **Animation** | Framer Motion 11, Three.js (React Three Fiber) |
| **Routing** | React Router 7 |
| **Charts** | Recharts 2 |
| **State** | Zustand 5, React Query (TanStack) |
| **Backend** | FastAPI (Python 3.12) |
| **Data Validation** | Pydantic v2 |
| **CV/Deep Learning** | TensorFlow 2.15, OpenCV 4.8 |
| **ML/NLP** | scikit-learn 1.5, pandas, numpy |
| **Database** | SQLite (dev), PostgreSQL-ready (prod) |
| **Realtime** | WebSocket (FastAPI native) |
| **Containerization** | Docker |

---

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t sentinelai .

# Run the container
docker run -p 8000:8000 sentinelai

# API available at http://localhost:8000
# Health check: http://localhost:8000/health
```

---

## 📊 Judging Criteria Alignment

| Criterion (25%) | How SentinelAI Delivers |
|----------------|------------------------|
| **Innovation** | Dual AI model fusion (CV + NLP) in one platform. Hybrid rule+ML scoring with full transparency. Real-time live camera scanning with object tracking. |
| **Business Impact** | Addresses ₹11,266 Cr annual problem. Serves citizens, banks, retail, law enforcement, and cyber cells from a single platform. Offline-first for rural accessibility. |
| **Technical Excellence** | Two trained models, 19-category rule engine, real-time WebSocket pipeline, full-stack TypeScript+Python, API versioning, production error handling. |
| **Scalability** | Stateless API for horizontal scaling. SQLite→PostgreSQL path. Docker containerization. Edge deployment (TF Lite). Model-agnostic API contract. |
| **User Experience** | Instant verdicts, live camera scanning, color-coded threat levels, plain-language explanations, responsive design, light/dark theme, offline fallback. |

---

## 🔮 Roadmap (Phase 2)

Features requiring additional model training — out of hackathon scope but architecturally planned:

- **Live Call Detection:** Voice + script + cadence classification for digital arrest calls
- **Deepfake Detection:** AI-generated voice and video identification
- **Fraud Network Graph:** Graph neural network linking phones, UPI IDs, accounts across jurisdiction
- **Geospatial Prediction:** Predictive hotspot mapping for proactive patrol deployment
- **WhatsApp Bot:** Conversational AI for citizen fraud assessment via messaging
- **Multilingual Support:** 12 Indian language scam detection and advisory
- **Evidence Packaging:** Court-admissible chain-of-custody reports with cryptographic signing

---

## 🤝 Contributing

SentinelAI is a hackathon project. Post-hackathon contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Indian Cyber Crime Coordination Centre (I4C)** — for public scam advisories and the 1930 helpline
- **Reserve Bank of India (RBI)** — for counterfeit detection guidelines and FICN data
- **Ministry of Home Affairs (MHA)** — for cybercrime statistics and awareness campaigns
- **National Cyber Crime Reporting Portal** (cybercrime.gov.in)
- **Sanchar Saathi Portal** (sancharsaathi.gov.in)

---

## 📞 Emergency Contacts

If you or someone you know is a victim of cyber fraud:

| Resource | Contact |
|----------|---------|
| **National Helpline** | Dial **1930** |
| **Cyber Crime Portal** | [cybercrime.gov.in](https://cybercrime.gov.in) |
| **Sanchar Saathi** | [sancharsaathi.gov.in](https://sancharsaathi.gov.in) |
| **Chakshu Portal** | Report fraud calls via Sanchar Saathi |

---

<p align="center">
  <strong>SentinelAI</strong> — Protecting India from scams, one scan at a time.<br/>
  Built with ❤️ for the hackathon.
</p>

<p align="center">
  <sub>Theme: Smart Cities / Public Safety / Digital Trust / Geospatial Law Enforcement</sub>
</p>
