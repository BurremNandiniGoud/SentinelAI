"""
Utilities for Currency Detection Model Inference
"""

import cv2
import numpy as np
from pathlib import Path
from tensorflow.keras.preprocessing import image
from app.currency_detection.model import CurrencyDetectionModel
from app.currency_detection.preprocessing import CurrencyPreprocessor
from app.currency_detection.tracking import StableNoteTracker


class CurrencyDetectionInference:
    """Inference wrapper for currency detection"""
    
    def __init__(self, model_path='app/currency_detection/artifacts/currency_model.h5'):
        self.model_path = model_path
        self.model = None
        self.preprocessor = CurrencyPreprocessor(target_size=256)
        self.tracker = StableNoteTracker(hold_frames=2, min_confidence=0.56)
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        if Path(self.model_path).exists():
            try:
                # Rebuild the architecture before restoring weights.  Directly loading
                # this legacy H5 file produces saturated predictions, whereas this is
                # the same checkpoint path used by the validated test evaluation.
                model_wrapper = CurrencyDetectionModel(
                    img_size=256,
                    weights_path=self.model_path,
                )
                model_wrapper.build_model(freeze_backbone=True)
                model_wrapper.compile_model(learning_rate=1e-4)

                if not model_wrapper.load_checkpoint(self.model_path):
                    raise RuntimeError("Could not restore currency model checkpoint")

                self.model = model_wrapper.model
                print(f"✓ Currency detection model loaded: {self.model_path}")
                return True
            except Exception as exc:
                print(f"⚠ Could not load currency model: {exc}")
                self.model = None
                return False
        else:
            print(f"⚠ Model not found at {self.model_path}")
            print("Run 'python train_currency_model.py' to train the model first")
            return False
    
    def predict(self, image_path):
        """
        Predict if currency is real or fake
        
        Args:
            image_path: Path to currency image
            
        Returns:
            dict with prediction results
        """
        if not self.model:
            return {
                'status': 'error',
                'message': 'Model not loaded',
                'prediction': None
            }
        
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {
                    'status': 'error',
                    'message': 'Unable to read the provided image.',
                    'prediction': None
                }

            candidates = []
            height, width = img.shape[:2]
            candidates.append(cv2.resize(img, (256, 256), interpolation=cv2.INTER_AREA))

            crop_h = max(80, int(height * 0.78))
            crop_w = max(80, int(width * 0.78))
            x = max(0, int((width - crop_w) / 2))
            y = max(0, int((height - crop_h) / 2))
            center_crop = img[y:y + crop_h, x:x + crop_w]
            candidates.append(cv2.resize(center_crop, (256, 256), interpolation=cv2.INTER_AREA))

            detected_region = self.preprocessor.detect_and_align_frame(img)
            if detected_region is not None:
                candidates.append(cv2.resize(detected_region, (256, 256), interpolation=cv2.INTER_AREA))

            best_confidence = 0.0
            best_fake_prob = 0.0
            best_real_prob = 0.0
            best_label = 'NO NOTE'

            for candidate in candidates:
                img_array = candidate.astype(np.float32) / 255.0
                img_array = np.expand_dims(img_array, axis=0)
                prediction = self.model.predict(img_array, verbose=0)[0][0]

                fake_prob = 1 - prediction
                real_prob = prediction
                confidence = max(fake_prob, real_prob)

                if confidence > best_confidence:
                    best_confidence = float(confidence)
                    best_fake_prob = float(fake_prob)
                    best_real_prob = float(real_prob)
                    best_label = 'FAKE' if fake_prob > real_prob else 'REAL'

            if best_confidence < 0.50:
                _, label, confidence, fake_prob, real_prob = self.tracker.update(
                    None,
                    'NO NOTE',
                    0.0,
                    0.0,
                    0.0,
                )
                return {
                    'status': 'success',
                    'currency_status': label,
                    'fake_probability': float(fake_prob),
                    'real_probability': float(real_prob),
                    'confidence_percentage': float(confidence * 100),
                    'recommendation': 'No currency note detected. Position the note clearly in the frame.',
                    'details': {'confidence_level': 'LOW'}
                }
            
            is_fake = best_fake_prob > best_real_prob
            label = 'FAKE' if is_fake else 'REAL'
            confidence = max(best_fake_prob, best_real_prob)
            _, label, confidence, best_fake_prob, best_real_prob = self.tracker.update(
                (0, 0, img.shape[1], img.shape[0]),
                label,
                confidence,
                best_fake_prob,
                best_real_prob,
            )
            is_fake = best_fake_prob > best_real_prob
            
            return {
                'status': 'success',
                'currency_status': label,
                'fake_probability': float(best_fake_prob),
                'real_probability': float(best_real_prob),
                'confidence_percentage': float(confidence * 100),
                'recommendation': (
                    'DO NOT ACCEPT - Currency appears to be counterfeit'
                    if is_fake
                    else 'Currency appears authentic'
                ),
                'details': {
                    'confidence_level': (
                        'HIGH' if confidence > 0.8
                        else 'MEDIUM' if confidence > 0.6
                        else 'LOW'
                    )
                }
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'prediction': None
            }
