"""
Baseline ML classifier: TF-IDF + Logistic Regression.
Kept simple and fast (CPU-only, no GPU dependency) so the whole engine runs
out of the box. Swap in a transformer later (see ml/transformer_model.py stub)
without touching the API layer, since both expose predict_proba(text).
"""
import json
import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

MODEL_PATH = os.path.join(os.path.dirname(__file__), "artifacts", "fraud_model.joblib")


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=20000,
            sublinear_tf=True,
            min_df=1,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            C=2.0,
            solver="saga",
        )),
    ])


def train_and_save(csv_path: str, text_col: str = "message", label_col: str = "label",
                    model_path: str = MODEL_PATH) -> dict:
    """Train on a CSV with columns [message, label] where label is 0=legit, 1=fraud."""
    import pandas as pd

    df = pd.read_csv(csv_path)
    if not {text_col, label_col}.issubset(df.columns):
        raise ValueError(f"CSV must contain columns {text_col!r} and {label_col!r}")

    df = df.dropna(subset=[text_col, label_col]).copy()

    header_like_mask = (
        df[text_col].astype(str).str.strip().eq(text_col) &
        df[label_col].astype(str).str.strip().eq(label_col)
    )
    df = df.loc[~header_like_mask]

    df[text_col] = df[text_col].astype(str)
    df[label_col] = pd.to_numeric(df[label_col], errors="coerce")
    df = df.dropna(subset=[text_col, label_col])

    X_train, X_test, y_train, y_test = train_test_split(
        df[text_col].astype(str), df[label_col].astype(int),
        test_size=0.2, random_state=42, stratify=df[label_col]
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(pipeline, model_path)

    return report


class FraudClassifier:
    """Loads a trained pipeline and exposes a simple predict_proba(text) -> float API."""

    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.pipeline = None
        if os.path.exists(model_path):
            self.pipeline = joblib.load(model_path)

    def is_ready(self) -> bool:
        return self.pipeline is not None

    def predict_proba(self, text: str) -> float:
        if self.pipeline is None:
            return 0.0
        proba = self.pipeline.predict_proba([text])[0]
        classes = list(self.pipeline.classes_)
        idx = classes.index(1) if 1 in classes else -1
        return float(proba[idx])

    def top_features(self, text: str, n: int = 8):
        """Return top contributing n-grams for explainability (linear model weights)."""
        if self.pipeline is None:
            return []
        tfidf = self.pipeline.named_steps["tfidf"]
        clf = self.pipeline.named_steps["clf"]
        vec = tfidf.transform([text])
        feature_names = np.array(tfidf.get_feature_names_out())
        coefs = clf.coef_[0]
        contrib = vec.multiply(coefs).toarray()[0]
        top_idx = np.argsort(contrib)[::-1][:n]
        return [(feature_names[i], float(contrib[i])) for i in top_idx if contrib[i] > 0]
