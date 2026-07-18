"""Real-time currency tracking pipeline that uses a detector+tracker and the existing classifier."""

from __future__ import annotations

from typing import Optional, Tuple

import cv2
import numpy as np

from app.currency_detection.classifier import CurrencyClassifier
from app.currency_detection.note_detector import NoteDetector
from app.currency_detection.overlay_renderer import OverlayRenderer
from app.currency_detection.tracker import NoteTracker


class LiveCurrencyTracker:
    """Coordinates detection, tracking, and classification for live currency scanning."""

    def __init__(self, classifier_path: str | None = None):
        self.detector = NoteDetector()
        self.tracker = NoteTracker(history_size=6)
        self.classifier = CurrencyClassifier(model_path=classifier_path)
        self.overlay = OverlayRenderer()
        self.last_bbox: Optional[Tuple[int, int, int, int]] = None
        self.last_label = "NO NOTE"
        self.last_confidence = 0.0
        self.last_tracking_confidence = 0.0
        self.history: list[Tuple[str, float, float, float]] = []
        self.missed_frames = 0

    def _smooth_prediction(self, label: str, confidence: float, fake_prob: float, real_prob: float) -> Tuple[str, float, float, float]:
        self.history.append((label, confidence, fake_prob, real_prob))
        if len(self.history) > 8:
            self.history.pop(0)

        if len(self.history) < 3:
            return label, confidence, fake_prob, real_prob

        vote_labels = [item[0] for item in self.history]
        from collections import Counter
        majority_label, _ = Counter(vote_labels).most_common(1)[0]
        avg_conf = sum(item[1] for item in self.history) / len(self.history)
        avg_fake = sum(item[2] for item in self.history) / len(self.history)
        avg_real = sum(item[3] for item in self.history) / len(self.history)
        return majority_label, avg_conf, avg_fake, avg_real

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Optional[Tuple[int, int, int, int]], str, float, float, float]:
        if frame is None:
            return np.zeros((1, 1, 3), dtype=np.uint8), None, "NO NOTE", 0.0, 0.0, 0.0

        detection_bbox, detection_confidence = self.detector.detect(frame, self.last_bbox)
        if detection_bbox is not None:
            self.missed_frames = 0
        else:
            self.missed_frames += 1

        tracked_bbox = self.tracker.update(frame, detection_bbox)
        if tracked_bbox is None:
            tracked_bbox = detection_bbox

        if tracked_bbox is None:
            self.last_bbox = None
            self.tracker.update(frame, None)
            self.last_label = "NO NOTE"
            self.last_confidence = 0.0
            self.last_tracking_confidence = 0.0
            return frame, None, "NO NOTE", 0.0, 0.0, 0.0

        x, y, w, h = tracked_bbox
        x = max(0, min(frame.shape[1] - 1, x))
        y = max(0, min(frame.shape[0] - 1, y))
        w = max(30, min(frame.shape[1] - x, w))
        h = max(30, min(frame.shape[0] - y, h))
        crop = frame[y:y + h, x:x + w]

        if crop.size == 0:
            self.last_bbox = None
            self.tracker.update(frame, None)
            self.last_label = "NO NOTE"
            self.last_confidence = 0.0
            self.last_tracking_confidence = 0.0
            return frame, None, "NO NOTE", 0.0, 0.0, 0.0

        label, confidence, fake_prob, real_prob = self.classifier.classify(crop)
        label, confidence, fake_prob, real_prob = self._smooth_prediction(label, confidence, fake_prob, real_prob)
        self.last_bbox = tracked_bbox
        self.last_label = label
        self.last_confidence = confidence
        self.last_tracking_confidence = detection_confidence if detection_bbox is not None else max(0.2, self.last_tracking_confidence)
        return frame, tracked_bbox, label, confidence, fake_prob, real_prob

    def render(self, frame: np.ndarray, bbox: Optional[Tuple[int, int, int, int]], label: str, confidence: float, fps: float) -> np.ndarray:
        return self.overlay.draw(frame, bbox, label, confidence, self.last_tracking_confidence, fps)
