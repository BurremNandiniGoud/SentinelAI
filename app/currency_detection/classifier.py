"""Classifier wrapper that reuses the existing trained currency model."""

from __future__ import annotations

from typing import Tuple

import cv2
import numpy as np

from app.currency_detection.model import CurrencyDetectionModel
from app.currency_detection.preprocessing import CurrencyPreprocessor


class CurrencyClassifier:
    """Runs the existing trained currency model on a cropped note region."""

    def __init__(self, model_path: str | None = None):
        self.model_path = model_path or "app/currency_detection/artifacts/currency_model.weights.h5"
        self.preprocessor = CurrencyPreprocessor(target_size=256)
        self.model_wrapper: CurrencyDetectionModel | None = None
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        wrapper = CurrencyDetectionModel(img_size=256, weights_path=self.model_path)
        wrapper.build_model(freeze_backbone=True)
        wrapper.compile_model(learning_rate=1e-4)
        if not wrapper.load_checkpoint(self.model_path):
            raise RuntimeError("Unable to restore the existing currency model weights")
        self.model_wrapper = wrapper
        self.model = wrapper.model

    def classify(self, crop: np.ndarray) -> Tuple[str, float, float, float]:
        if self.model is None or crop is None:
            return "NO NOTE", 0.0, 0.0, 0.0

        resized = cv2.resize(crop, (256, 256), interpolation=cv2.INTER_AREA)
        normalized = resized.astype(np.float32) / 255.0
        expanded = np.expand_dims(normalized, axis=0)
        prediction = float(self.model.predict(expanded, verbose=0)[0][0])
        fake_prob = float(max(0.0, min(1.0, 1.0 - prediction)))
        real_prob = float(max(0.0, min(1.0, prediction)))
        confidence = max(fake_prob, real_prob)
        label = "FAKE" if fake_prob > real_prob else "REAL"
        return label, confidence, fake_prob, real_prob
