import cv2
import numpy as np

from app.currency_detection.live_pipeline import LiveCurrencyTracker


def test_template_tracking_finds_shifted_note():
    tracker = LiveCurrencyTracker.__new__(LiveCurrencyTracker)
    frame = np.zeros((140, 180, 3), dtype=np.uint8)
    cv2.rectangle(frame, (20, 20), (80, 80), (255, 255, 255), -1)

    previous_bbox = (20, 20, 60, 60)
    previous_template = frame[20:80, 20:80]

    shifted_frame = np.zeros_like(frame)
    cv2.rectangle(shifted_frame, (42, 32), (102, 92), (255, 255, 255), -1)

    tracked_bbox = tracker._template_track(shifted_frame, previous_bbox, previous_template)

    assert tracked_bbox is not None
    assert abs(tracked_bbox[0] - 42) < 8
    assert abs(tracked_bbox[1] - 32) < 8
