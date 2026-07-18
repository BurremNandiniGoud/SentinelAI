"""Tracking utilities for keeping a note bounding box stable over time."""

from __future__ import annotations

from collections import deque
from typing import Deque, Optional, Tuple

import cv2
import numpy as np


class NoteTracker:
    """Keeps a single note box stable across motion using template matching."""

    def __init__(self, history_size: int = 6):
        self.history_size = max(2, history_size)
        self.history: Deque[Tuple[int, int, int, int]] = deque(maxlen=self.history_size)
        self.last_bbox: Optional[Tuple[int, int, int, int]] = None
        self.last_template: Optional[np.ndarray] = None

    def _clip_bbox(self, bbox: Tuple[int, int, int, int], frame_shape: Tuple[int, int, int]) -> Tuple[int, int, int, int]:
        height, width = frame_shape[0], frame_shape[1]
        x, y, w, h = bbox
        x = max(0, min(width - 1, x))
        y = max(0, min(height - 1, y))
        w = max(24, min(width - x, w))
        h = max(24, min(height - y, h))
        return (x, y, w, h)

    def _build_template(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
        x, y, w, h = self._clip_bbox(bbox, frame.shape)
        template = frame[y:y + h, x:x + w]
        if template.size == 0:
            return np.empty((0, 0, 3), dtype=np.uint8)
        return cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

    def _track_with_template(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[Tuple[int, int, int, int]]:
        if self.last_template is None or self.last_template.size == 0:
            return None

        prev_x, prev_y, prev_w, prev_h = self._clip_bbox(bbox, frame.shape)
        padding = max(32, int(max(prev_w, prev_h) * 0.6))
        x0 = max(0, prev_x - padding)
        y0 = max(0, prev_y - padding)
        x1 = min(frame.shape[1] - 1, prev_x + prev_w + padding)
        y1 = min(frame.shape[0] - 1, prev_y + prev_h + padding)
        search_region = frame[y0:y1, x0:x1]
        if search_region.size == 0:
            return None

        gray_search = cv2.cvtColor(search_region, cv2.COLOR_BGR2GRAY)
        template = cv2.resize(self.last_template, (max(24, prev_w), max(24, prev_h)), interpolation=cv2.INTER_AREA)
        if template.shape[0] == 0 or template.shape[1] == 0:
            return None

        result = cv2.matchTemplate(gray_search, template, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(result)
        if max_val < 0.18:
            return None

        tx, ty = max_loc
        matched_bbox = (x0 + tx, y0 + ty, prev_w, prev_h)
        return self._clip_bbox(matched_bbox, frame.shape)

    def update(self, frame: np.ndarray, bbox: Optional[Tuple[int, int, int, int]] = None) -> Optional[Tuple[int, int, int, int]]:
        if frame is None:
            self.last_bbox = None
            self.last_template = None
            self.history.clear()
            return None

        if bbox is None:
            if self.last_bbox is None:
                self.history.clear()
                return None
            tracked_bbox = self._track_with_template(frame, self.last_bbox) or self.last_bbox
            self.last_bbox = self._clip_bbox(tracked_bbox, frame.shape)
            self.last_template = self._build_template(frame, self.last_bbox)
            self.history.append(self.last_bbox)
            return self.last_bbox

        bbox = self._clip_bbox(bbox, frame.shape)
        if self.last_bbox is None:
            self.last_bbox = bbox
            self.last_template = self._build_template(frame, bbox)
            self.history.append(bbox)
            return bbox

        matched_bbox = self._track_with_template(frame, self.last_bbox)
        if matched_bbox is None:
            tracked_bbox = bbox
        else:
            tracked_bbox = matched_bbox
            if abs(tracked_bbox[0] - bbox[0]) + abs(tracked_bbox[1] - bbox[1]) > 80:
                tracked_bbox = bbox

        prev_x, prev_y, prev_w, prev_h = self.last_bbox
        x, y, w, h = tracked_bbox
        smoothed_x = int(round(0.65 * x + 0.35 * prev_x))
        smoothed_y = int(round(0.65 * y + 0.35 * prev_y))
        smoothed_w = int(round(0.55 * w + 0.45 * prev_w))
        smoothed_h = int(round(0.55 * h + 0.45 * prev_h))
        smoothed_bbox = (smoothed_x, smoothed_y, max(24, smoothed_w), max(24, smoothed_h))
        smoothed_bbox = self._clip_bbox(smoothed_bbox, frame.shape)
        self.last_bbox = smoothed_bbox
        self.last_template = self._build_template(frame, smoothed_bbox)
        self.history.append(smoothed_bbox)
        return smoothed_bbox
