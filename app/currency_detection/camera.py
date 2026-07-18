"""Camera helpers for real-time currency inference."""

from __future__ import annotations

import cv2
from typing import Optional, Tuple


class WebcamCamera:
    """Thin wrapper around OpenCV video capture with graceful error handling."""

    def __init__(self, source: int = 0, width: int = 640, height: int = 480):
        self.source = source
        self.width = width
        self.height = height
        self.capture: Optional[cv2.VideoCapture] = None

    def open(self) -> None:
        """Open the camera and configure a reasonable frame size."""
        self.capture = cv2.VideoCapture(self.source)
        if not self.capture.isOpened():
            raise RuntimeError("Unable to open the webcam. Check that a camera is connected.")

        self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        self.capture.set(cv2.CAP_PROP_FPS, 30)

    def read(self) -> Tuple[bool, Optional[object]]:
        """Read the next frame from the camera."""
        if self.capture is None:
            raise RuntimeError("Camera is not initialized. Call open() first.")
        return self.capture.read()

    def release(self) -> None:
        """Release the camera resources."""
        if self.capture is not None:
            self.capture.release()
            self.capture = None
