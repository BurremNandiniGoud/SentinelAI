"""
Entry-point script to train the baseline ML fraud classifier on a CSV dataset.

Usage:
    python train.py --data data/sample_dataset.csv
"""
import argparse
import json
from pathlib import Path
import sys

if __name__ == "__main__":
    from setup_env import ensure_requirements

    ensure_requirements()

from app.ml.model import train_and_save, MODEL_PATH


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/sample_dataset.csv", help="Path to training CSV")
    parser.add_argument("--text-col", default="message")
    parser.add_argument("--label-col", default="label")
    args = parser.parse_args()

    report = train_and_save(args.data, text_col=args.text_col, label_col=args.label_col)
    print(f"Model saved to: {MODEL_PATH}")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
