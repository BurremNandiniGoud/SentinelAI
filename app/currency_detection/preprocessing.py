"""
Data Preprocessing for Currency Detection
Image preprocessing, cleaning, and augmentation utilities
"""

import cv2
import numpy as np
from pathlib import Path
from PIL import Image
import os


class CurrencyPreprocessor:
    """Preprocess currency images for model training and live inference."""
    
    def __init__(self, target_size=256):
        self.target_size = target_size

    def preprocess_frame(self, frame, target_size=None):
        """Convert an OpenCV frame into the same input format used during training."""
        target_size = target_size or self.target_size
        if frame is None:
            raise ValueError("Cannot preprocess a None frame")

        detected_region = self.detect_and_align_frame(frame)
        if detected_region is None:
            resized = cv2.resize(frame, (target_size, target_size))
            normalized = resized.astype(np.float32) / 255.0
            return np.expand_dims(normalized, axis=0)

        resized = cv2.resize(detected_region, (target_size, target_size))
        normalized = resized.astype(np.float32) / 255.0
        return np.expand_dims(normalized, axis=0)

    def detect_and_align_frame(self, frame):
        """Locate a banknote-like region in a camera frame and crop it quickly."""
        if frame is None:
            return None

        height, width = frame.shape[:2]
        scale_factor = 1.0
        if max(height, width) > 640:
            scale_factor = 640.0 / max(height, width)
            working = cv2.resize(frame, (int(width * scale_factor), int(height * scale_factor)), interpolation=cv2.INTER_AREA)
        else:
            working = frame

        rgb_frame = cv2.cvtColor(working, cv2.COLOR_BGR2RGB)
        denoised = cv2.fastNlMeansDenoisingColored(rgb_frame, None, 10, 10, 7, 21)

        lab = cv2.cvtColor(denoised, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)

        gray = cv2.cvtColor(enhanced, cv2.COLOR_RGB2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # Threshold-based detection for strong contrast objects such as notes.
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        # Edge-based fallback for less contrasty scenes.
        edges = cv2.Canny(blur, 40, 140)
        edges = cv2.dilate(edges, kernel, iterations=1)
        edge_contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        candidates = []
        for contour in contours + edge_contours:
            area = cv2.contourArea(contour)
            if area < 1200:
                continue

            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            if len(approx) < 4:
                continue

            x, y, w, h = cv2.boundingRect(approx)
            if w < 40 or h < 40:
                continue

            aspect_ratio = w / float(h)
            if not 0.45 <= aspect_ratio <= 2.2:
                continue

            if w * h > working.shape[0] * working.shape[1] * 0.85:
                continue

            fullness = area / float(w * h)
            candidates.append((area, fullness, x, y, w, h))

        if not candidates:
            return None

        # Prefer the largest contour, but reward better-filled rectangles.
        best = max(candidates, key=lambda item: (item[0] * 1.2 + item[1] * 5000, item[0]))
        area, fullness, x, y, w, h = best
        if area < 3000:
            return None

        padding = max(20, int(min(w, h) * 0.16))
        x = max(0, int(x - padding))
        y = max(0, int(y - padding))
        w = min(working.shape[1] - x, int(w + 2 * padding))
        h = min(working.shape[0] - y, int(h + 2 * padding))

        cropped = enhanced[y:y + h, x:x + w]
        if cropped.size == 0 or cropped.shape[0] < 40 or cropped.shape[1] < 40:
            return None

        if scale_factor != 1.0:
            cropped = cv2.resize(cropped, (int(cropped.shape[1] / scale_factor), int(cropped.shape[0] / scale_factor)), interpolation=cv2.INTER_LINEAR)

        return cropped
    
    def enhance_image_quality(self, image_path):
        """
        Enhance image quality for better feature detection
        - Noise reduction
        - Contrast enhancement
        - Brightness normalization
        """
        # Load image
        img = cv2.imread(str(image_path))
        if img is None:
            return None
        
        # Convert to BGR
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # 1. Denoise (remove noise)
        img = cv2.fastNlMeansDenoisingColored(img, h=10, hForFormatColor=10, hForForColorForColorComponents=10, templateWindowSize=7, searchWindowSize=21)
        
        # 2. Enhance contrast using CLAHE
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        img = cv2.merge([l, a, b])
        img = cv2.cvtColor(img, cv2.COLOR_LAB2RGB)
        
        return img
    
    def detect_and_align_note(self, image_path):
        """
        Detect banknote edges and align/crop the note from image
        Removes background and focuses on the currency
        """
        img = self.enhance_image_quality(image_path)
        if img is None:
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        
        # Apply edge detection
        edges = cv2.Canny(gray, 100, 200)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            # If no clear edges, use full image
            return cv2.resize(img, (self.target_size, self.target_size))
        
        # Get largest contour (should be the note)
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(largest_contour)
        
        # Add padding
        padding = 20
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(img.shape[1] - x, w + 2*padding)
        h = min(img.shape[0] - y, h + 2*padding)
        
        # Crop
        cropped = img[y:y+h, x:x+w]
        
        # Resize to target
        resized = cv2.resize(cropped, (self.target_size, self.target_size))
        
        return resized
    
    def prepare_dataset_directory(self, root_dir, train_split=0.7, val_split=0.15):
        """
        Organize raw images into train/val/test splits
        
        Expected input structure:
        root_dir/
        ├── real/
        │   └── *.jpg
        └── fake/
            └── *.jpg
        
        Output structure:
        root_dir/
        ├── train/
        │   ├── real/
        │   └── fake/
        ├── val/
        │   ├── real/
        │   └── fake/
        └── test/
            ├── real/
            └── fake/
        """
        root_path = Path(root_dir)
        
        # Create directory structure
        for split in ['train', 'val', 'test']:
            for category in ['real', 'fake']:
                (root_path / split / category).mkdir(parents=True, exist_ok=True)
        
        # Process each category
        for category in ['real', 'fake']:
            category_dir = root_path / category
            if not category_dir.exists():
                print(f"Category directory {category_dir} not found")
                continue
            
            # Get all images
            images = list(category_dir.glob('*.jpg')) + list(category_dir.glob('*.png'))
            
            # Shuffle and split
            np.random.shuffle(images)
            train_idx = int(len(images) * train_split)
            val_idx = train_idx + int(len(images) * val_split)
            
            train_imgs = images[:train_idx]
            val_imgs = images[train_idx:val_idx]
            test_imgs = images[val_idx:]
            
            print(f"\n{category.upper()} Split:")
            print(f"  Train: {len(train_imgs)}")
            print(f"  Val: {len(val_imgs)}")
            print(f"  Test: {len(test_imgs)}")
            
            # Move files
            self._move_files(train_imgs, root_path / 'train' / category)
            self._move_files(val_imgs, root_path / 'val' / category)
            self._move_files(test_imgs, root_path / 'test' / category)
    
    def _move_files(self, files, dest_dir):
        """Move files to destination"""
        for file in files:
            dest = dest_dir / file.name
            if not dest.exists():
                try:
                    # Preprocess and save
                    img = self.detect_and_align_note(str(file))
                    if img is not None:
                        img = Image.fromarray(img)
                        img.save(dest)
                except Exception as e:
                    print(f"Error processing {file}: {e}")
    
    def validate_dataset(self, dataset_dir):
        """Validate dataset integrity"""
        dataset_path = Path(dataset_dir)
        stats = {}
        
        for split in ['train', 'val', 'test']:
            split_path = dataset_path / split
            if split_path.exists():
                stats[split] = {}
                for category in ['real', 'fake']:
                    cat_dir = split_path / category
                    count = len(list(cat_dir.glob('*')))
                    stats[split][category] = count
        
        return stats
