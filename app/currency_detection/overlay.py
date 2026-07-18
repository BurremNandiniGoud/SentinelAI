"""Drawing helpers for the live webcam overlay."""

from __future__ import annotations

import cv2
import numpy as np


def draw_overlay(frame: np.ndarray, label: str, confidence: float, fps: float) -> np.ndarray:
    """Render the prediction label, confidence, and FPS on the camera frame."""
    display_frame = frame.copy()
    height, width = display_frame.shape[:2]

    box_height = 95
    cv2.rectangle(display_frame, (10, 10), (width - 10, box_height), (0, 0, 0), -1)
    cv2.addWeighted(display_frame, 0.75, frame, 0.25, 0, display_frame)

    color = (0, 255, 0) if label == "REAL" else (0, 0, 255)
    cv2.putText(
        display_frame,
        f"Prediction: {label}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        color,
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        display_frame,
        f"Confidence: {confidence * 100:.1f}%",
        (20, 62),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        display_frame,
        f"FPS: {fps:.1f}   Press Q to quit",
        (20, 89),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    return display_frame
