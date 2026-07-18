"""Utilities for smoothing predictions and formatting overlay text."""

from __future__ import annotations

from collections import Counter, deque
from typing import Deque, Tuple


class PredictionSmoother:
    """Apply a simple majority-vote style smoothing over recent predictions."""

    def __init__(self, window_size: int = 5):
        self.window_size = max(1, window_size)
        self.history: Deque[Tuple[str, float]] = deque(maxlen=self.window_size)

    def update(self, label: str, confidence: float) -> Tuple[str, float]:
        self.history.append((label, confidence))
        if len(self.history) < 2:
            return label, confidence

        labels = [item[0] for item in self.history]
        counts = Counter(labels)
        majority_label, _ = counts.most_common(1)[0]
        average_confidence = sum(item[1] for item in self.history) / len(self.history)
        return majority_label, average_confidence


def format_confidence(confidence: float) -> str:
    return f"{confidence * 100:.1f}%"
