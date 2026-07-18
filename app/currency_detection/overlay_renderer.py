"""Professional overlay renderer for live currency tracking."""

from __future__ import annotations

import math
from typing import Optional, Tuple

import cv2
import numpy as np


class OverlayRenderer:
    """Draws the tracked note box, status, and metrics on the frame."""

    def __init__(self) -> None:
        self.anim_phase = 0.0

    def draw(
        self,
        frame: np.ndarray,
        bbox: Optional[Tuple[int, int, int, int]],
        label: str,
        confidence: float,
        tracking_confidence: float,
        fps: float,
    ) -> np.ndarray:
        display = frame.copy()
        height, width = display.shape[:2]
        self.anim_phase = (self.anim_phase + 0.18) % (2 * math.pi)

        if bbox is not None:
            x, y, w, h = bbox
            x = max(0, min(width - 1, x))
            y = max(0, min(height - 1, y))
            w = max(40, min(width - x, w))
            h = max(40, min(height - y, h))
            color = (0, 255, 0) if label == "REAL" else (0, 0, 255)
            if label == "NO NOTE":
                color = (255, 255, 255)

            pulse = int(6 + 4 * math.sin(self.anim_phase))
            cv2.rectangle(display, (x, y), (x + w, y + h), color, 2 + (pulse > 8))
            cv2.rectangle(display, (x - 2, y - 2), (x + 2, y + 2), color, -1)
            cv2.rectangle(display, (x + w - 2, y - 2), (x + w + 2, y + 2), color, -1)
            cv2.rectangle(display, (x - 2, y + h - 2), (x + 2, y + h + 2), color, -1)
            cv2.rectangle(display, (x + w - 2, y + h - 2), (x + w + 2, y + h + 2), color, -1)

            corner = 30
            for p1, p2 in [((x, y), (x + corner, y)), ((x, y), (x, y + corner)), ((x + w, y), (x + w - corner, y)), ((x + w, y), (x + w, y + corner)), ((x, y + h), (x + corner, y + h)), ((x, y + h), (x, y + h - corner)), ((x + w, y + h), (x + w - corner, y + h)), ((x + w, y + h), (x + w, y + h - corner))]:
                cv2.line(display, p1, p2, color, 3)

        overlay = display.copy()
        cv2.rectangle(overlay, (10, 10), (width - 10, 140), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.72, display, 0.28, 0, display)

        status_text = "Tracking note" if bbox is not None else "No Currency Detected"
        cv2.putText(display, status_text, (24, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(display, f"Label: {label}", (24, 68), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(display, f"Confidence: {confidence * 100:.1f}%", (24, 96), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(display, f"Tracking: {tracking_confidence * 100:.1f}%   FPS: {fps:.1f}", (24, 124), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
        return display
