"""Utilities for keeping a stable currency-note verdict across small camera motions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class StableNoteTracker:
    """Keeps a stable note result until the note clearly disappears or changes."""

    hold_frames: int = 2
    min_confidence: float = 0.56

    def __init__(self, hold_frames: int = 2, min_confidence: float = 0.56):
        self.hold_frames = max(1, hold_frames)
        self.min_confidence = max(0.0, min_confidence)
        self._recent_misses = 0
        self._last_bbox: Optional[Tuple[int, int, int, int]] = None
        self._last_label: str = "NO NOTE"
        self._last_confidence: float = 0.0
        self._last_fake_prob: float = 0.0
        self._last_real_prob: float = 0.0

    def update(
        self,
        bbox: Optional[Tuple[int, int, int, int]],
        label: str,
        confidence: float,
        fake_prob: float,
        real_prob: float,
    ) -> Tuple[Optional[Tuple[int, int, int, int]], str, float, float, float]:
        if label != "NO NOTE" and confidence >= self.min_confidence:
            self._recent_misses = 0
            self._last_bbox = bbox
            self._last_label = label
            self._last_confidence = confidence
            self._last_fake_prob = fake_prob
            self._last_real_prob = real_prob
            return self._last_bbox, self._last_label, self._last_confidence, self._last_fake_prob, self._last_real_prob

        self._recent_misses += 1
        if self._recent_misses <= self.hold_frames and self._last_label != "NO NOTE":
            return self._last_bbox, self._last_label, self._last_confidence, self._last_fake_prob, self._last_real_prob

        self._last_bbox = bbox
        self._last_label = "NO NOTE"
        self._last_confidence = 0.0
        self._last_fake_prob = 0.0
        self._last_real_prob = 0.0
        return self._last_bbox, self._last_label, self._last_confidence, self._last_fake_prob, self._last_real_prob
