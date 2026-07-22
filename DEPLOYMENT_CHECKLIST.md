# Deployment Checklist

This checklist is meant for a fresh machine so the project can be cloned, installed, and started with minimal manual effort.

## 1. Prerequisites

Install these before running the project:

- Git
- Python 3.10 or 3.11 (recommended; TensorFlow 2.15 is most reliable on these versions)
- Node.js 18+ and npm
- Tesseract OCR
  - Windows: install from the official Tesseract release
  - Ubuntu: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`

## 2. Clone the repository

```bash
git clone <repo-url>
cd fraud_detection_engine_claude
```

## 3. Create and activate a Python virtual environment

### Windows PowerShell
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Linux / macOS
```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 4. Install Python dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If installation fails on Windows, ensure the Python version is 3.10 or 3.11 and that Microsoft Visual C++ build tools are available for native dependencies.

## 5. Start the backend API

From the repository root:

```bash
uvicorn app.api.main:app --reload --port 8000
```

Verify the backend:

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## 6. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at:

- http://localhost:5173

## 7. Optional: run the training scripts

The repository already includes the prebuilt model artifacts, so training is usually not required for a normal run.

If you want to regenerate the models:

```bash
python train.py --data data/sample_dataset.csv
python train_currency_model.py
```

## 8. Quick smoke test

### Backend test
```bash
curl http://localhost:8000/health
```

### Currency endpoint test
```bash
curl -X POST http://localhost:8000/api/currency/analyze -F "file=@/path/to/image.jpg"
```

### Message endpoint test
```bash
curl -X POST http://localhost:8000/api/message/analyze -H "Content-Type: application/json" -d '{"text":"This is a scam message","channel":"sms"}'
```

## 9. Docker option (optional)

```bash
docker build -t sentinelai .
docker run -p 8000:8000 sentinelai
```

## 10. Common issues

- If the backend cannot start, confirm Python 3.10 or 3.11 is active.
- If the frontend fails to start, run `npm install` again inside the frontend folder.
- If OCR-related features fail, make sure Tesseract is installed and available on the PATH.
- If TensorFlow installation fails, use a supported Python version and reinstall with a fresh virtual environment.
