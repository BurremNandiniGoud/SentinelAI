"""
Download Indian Currency Real vs Fake Notes Dataset from Kaggle
Using kagglehub
"""

import kagglehub
import os
from pathlib import Path

print("=" * 70)
print("DOWNLOADING KAGGLE DATASET")
print("=" * 70)
print("\nDataset: preetrank/indian-currency-real-vs-fake-notes-dataset")
print("Downloading...\n")

try:
    # Download latest version
    path = kagglehub.dataset_download("preetrank/indian-currency-real-vs-fake-notes-dataset")
    
    print("\n" + "=" * 70)
    print("✓ DATASET DOWNLOADED SUCCESSFULLY")
    print("=" * 70)
    print(f"\nPath to dataset files: {path}")
    
    # Explore the dataset structure
    print("\n" + "=" * 70)
    print("DATASET STRUCTURE")
    print("=" * 70)
    
    dataset_path = Path(path)
    
    for root, dirs, files in os.walk(dataset_path):
        level = root.replace(str(dataset_path), '').count(os.sep)
        indent = ' ' * 2 * level
        print(f'{indent}{os.path.basename(root)}/')
        sub_indent = ' ' * 2 * (level + 1)
        
        # Limit display of files
        if len(files) <= 10:
            for file in files:
                print(f'{sub_indent}{file}')
        else:
            for file in files[:5]:
                print(f'{sub_indent}{file}')
            print(f'{sub_indent}... and {len(files) - 5} more files')
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    # Count files
    total_files = 0
    for root, dirs, files in os.walk(dataset_path):
        total_files += len(files)
    
    print(f"Total files: {total_files}")
    print(f"\nDataset is ready at: {path}")
    print("\nNext steps:")
    print("1. Organize images into train/val/test folders")
    print("2. Follow DATASET_SETUP.md for preparation")
    print("3. Run: python train_currency_model.py")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\nMake sure you have:")
    print("1. Installed kagglehub: pip install kagglehub")
    print("2. Configured Kaggle API credentials (~/.kaggle/kaggle.json)")
    print("\nTo setup Kaggle API:")
    print("  - Go to: https://www.kaggle.com/settings/account")
    print("  - Click 'Create New API Token'")
    print("  - Place the downloaded kaggle.json in ~/.kaggle/")
    print("  - Run: pip install kagglehub")
