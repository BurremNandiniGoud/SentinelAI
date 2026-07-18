"""Launch the real-time webcam inference demo for the existing currency model."""

from __future__ import annotations

import argparse
import time

import cv2

from app.currency_detection.camera import WebcamCamera
from app.currency_detection.live_pipeline import LiveCurrencyTracker


def main() -> int:
    parser = argparse.ArgumentParser(description="Run live counterfeit currency inference from a webcam")
    parser.add_argument("--source", type=int, default=0, help="Camera device index (default: 0)")
    parser.add_argument("--frame-skip", type=int, default=2, help="Process every Nth frame for lower latency")
    parser.add_argument("--window-name", type=str, default="Currency Detection - Live", help="OpenCV window title")
    args = parser.parse_args()

    try:
        camera = WebcamCamera(source=args.source)
        camera.open()
    except RuntimeError as exc:
        print(f"Camera error: {exc}")
        return 1

    try:
        pipeline = LiveCurrencyTracker()
    except RuntimeError as exc:
        print(f"Model error: {exc}")
        camera.release()
        return 1

    print("Starting webcam inference. Press 'Q' to exit.")

    frame_index = 0
    start_time = time.perf_counter()

    while True:
        success, frame = camera.read()
        if not success or frame is None:
            print("Unable to read frames from the camera. Exiting.")
            break

        frame_index += 1
        try:
            processed_frame, bbox, label, confidence, _, _ = pipeline.process_frame(frame)
            elapsed = time.perf_counter() - start_time
            fps = frame_index / elapsed if elapsed > 0 else 0.0
            display_frame = pipeline.render(processed_frame, bbox, label, confidence, fps)
        except Exception as exc:  # pragma: no cover - defensive path
            print(f"Prediction error: {exc}")
            label = "NO NOTE"
            confidence = 0.0
            display_frame = frame

        cv2.imshow(args.window_name, display_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
