"""Lightweight note-region detector for live currency tracking."""

from __future__ import annotations

from typing import Optional, Tuple

import cv2
import numpy as np


class NoteDetector:
    """Detect a banknote-like region from a frame using contours and contrast."""

    def __init__(self, min_area_ratio: float = 0.003, max_area_ratio: float = 0.55):
        self.min_area_ratio = min_area_ratio
        self.max_area_ratio = max_area_ratio

    def detect(self, frame: np.ndarray, prior_bbox: Optional[Tuple[int, int, int, int]] = None) -> Tuple[Optional[Tuple[int, int, int, int]], float]:
        if frame is None:
            return None, 0.0

        height, width = frame.shape[:2]
        frame_area = float(height * width)
        search_bbox = None
        if prior_bbox is not None:
            x, y, w, h = prior_bbox
            padding = max(30, int(min(w, h) * 0.45))
            search_bbox = (
                max(0, x - padding),
                max(0, y - padding),
                min(width - 1, w + 2 * padding),
                min(height - 1, h + 2 * padding),
            )

        working = frame.copy()
        if search_bbox is not None:
            x, y, w, h = search_bbox
            working = frame[max(0, y):min(height, y + h), max(0, x):min(width, x + w)]
            if working.size == 0:
                working = frame
                search_bbox = None

        gray = cv2.cvtColor(working, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        adaptive = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 8)
        canny = cv2.Canny(blur, 50, 150)
        masks = [otsu, adaptive]
        if cv2.countNonZero(canny) > 0:
            masks.append(canny)

        candidates: list[tuple[float, float, int, int, int, int]] = []
        for mask in masks:
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            processed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            processed = cv2.dilate(processed, kernel, iterations=1)
            contours, _ = cv2.findContours(processed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            for contour in contours:
                area = cv2.contourArea(contour)
                min_area = max(400.0, frame_area * self.min_area_ratio)
                if area < min_area:
                    continue
                if area > frame_area * self.max_area_ratio:
                    continue

                x, y, w, h = cv2.boundingRect(contour)
                min_size = max(18, int(min(width, height) * 0.08))
                if w < min_size or h < min_size:
                    continue

                aspect_ratio = w / float(h)
                if not 0.2 <= aspect_ratio <= 4.0:
                    continue

                fullness = area / float(w * h)
                if fullness < 0.1:
                    continue

                if search_bbox is not None:
                    x += search_bbox[0]
                    y += search_bbox[1]

                candidates.append((area, fullness, x, y, w, h))

        if not candidates:
            return None, 0.0

        candidates.sort(key=lambda item: (item[0] * 1.2 + item[1] * 8000), reverse=True)
        _, _, x, y, w, h = candidates[0]
        if w * h > frame_area * 0.9:
            return None, 0.0

        quality = min(0.99, max(0.35, (w * h) / (frame_area * 0.35)))
        return (int(x), int(y), int(w), int(h)), quality
