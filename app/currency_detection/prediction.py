"""Real-time inference wrapper for the existing currency detection model."""

from __future__ import annotations

from pathlib import Path
from typing import Tuple

import cv2
import numpy as np

from app.currency_detection.model import CurrencyDetectionModel
from app.currency_detection.preprocessing import CurrencyPreprocessor
from app.currency_detection.tracking import StableNoteTracker
from app.currency_detection.utils import PredictionSmoother


class RealTimeCurrencyPredictor:
    """Loads the existing trained model and runs real-time frame inference."""

    def __init__(self, model_path: str | None = None, frame_skip: int = 2, smoothing_window: int = 5):
        self.model_path = Path(model_path or "app/currency_detection/artifacts/currency_model.weights.h5")
        self.frame_skip = max(1, frame_skip)
        self.preprocessor = CurrencyPreprocessor(target_size=256)
        self.smoother = PredictionSmoother(window_size=smoothing_window)
        self.tracker = StableNoteTracker(hold_frames=2, min_confidence=0.56)
        self.model_wrapper: CurrencyDetectionModel | None = None
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        if not self.model_path.exists():
            raise RuntimeError(f"Model artifact not found at {self.model_path}")

        try:
            self.model_wrapper = CurrencyDetectionModel(
                img_size=256,
                weights_path=str(self.model_path),
            )
            self.model_wrapper.build_model(freeze_backbone=True)
            self.model_wrapper.compile_model(learning_rate=1e-4)
            if not self.model_wrapper.load_checkpoint(str(self.model_path)):
                raise RuntimeError("Unable to restore the existing currency model weights")
            self.model = self.model_wrapper.model
        except Exception as exc:  # pragma: no cover - defensive path
            raise RuntimeError(f"Model loading failed: {exc}") from exc

    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        return self.preprocessor.preprocess_frame(frame, target_size=256)

    def _build_candidate_inputs(self, frame: np.ndarray) -> list[np.ndarray]:
        if frame is None:
            return []

        height, width = frame.shape[:2]
        candidates: list[np.ndarray] = []

        resized_full = cv2.resize(frame, (256, 256), interpolation=cv2.INTER_AREA)
        candidates.append(resized_full)

        crop_h = max(80, int(height * 0.78))
        crop_w = max(80, int(width * 0.78))
        x = max(0, int((width - crop_w) / 2))
        y = max(0, int((height - crop_h) / 2))
        center_crop = frame[y:y + crop_h, x:x + crop_w]
        candidates.append(cv2.resize(center_crop, (256, 256), interpolation=cv2.INTER_AREA))

        detected_region = self.preprocessor.detect_and_align_frame(frame)
        if detected_region is not None:
            candidates.append(cv2.resize(detected_region, (256, 256), interpolation=cv2.INTER_AREA))

        small = cv2.resize(frame, (160, 120), interpolation=cv2.INTER_AREA)
        candidates.append(cv2.resize(small, (256, 256), interpolation=cv2.INTER_AREA))

        return candidates

    def predict_frame(self, frame: np.ndarray) -> Tuple[str, float, float, float]:
        if self.model is None:
            raise RuntimeError("Model has not been loaded")

        candidates = self._build_candidate_inputs(frame)
        if not candidates:
            return "NO NOTE", 0.0, 0.0, 0.0

        best_label = "NO NOTE"
        best_confidence = 0.0
        best_fake = 0.0
        best_real = 0.0

        for candidate in candidates:
            normalized = candidate.astype(np.float32) / 255.0
            expanded = np.expand_dims(normalized, axis=0)
            prediction = self.model.predict(expanded, verbose=0)[0][0]

            fake_prob = float(max(0.0, min(1.0, 1.0 - prediction)))
            real_prob = float(max(0.0, min(1.0, prediction)))
            confidence = max(fake_prob, real_prob)

            if confidence > best_confidence:
                best_confidence = confidence
                best_fake = fake_prob
                best_real = real_prob
                best_label = "FAKE" if fake_prob > real_prob else "REAL"

        if best_confidence < 0.50:
            _, tracked_label, tracked_confidence, tracked_fake, tracked_real = self.tracker.update(
                None,
                "NO NOTE",
                0.0,
                0.0,
                0.0,
            )
            return tracked_label, tracked_confidence, tracked_fake, tracked_real

        smoothed_label, smoothed_confidence = self.smoother.update(best_label, best_confidence)
        _, tracked_label, tracked_confidence, tracked_fake, tracked_real = self.tracker.update(
            (0, 0, frame.shape[1], frame.shape[0]),
            smoothed_label,
            smoothed_confidence,
            best_fake,
            best_real,
        )
        return tracked_label, tracked_confidence, tracked_fake, tracked_real
