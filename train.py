"""
Entry-point script to train the baseline ML fraud classifier on a CSV dataset.

Usage:
    python train.py --data data/sample_dataset.csv
"""
import argparse
import json
import os
import sys
from pathlib import Path


def _try_ensure_requirements():
    """Install missing deps, skipping ones with known Python 3.13 incompatibilities."""
    try:
        from setup_env import ensure_requirements
        ensure_requirements()
    except Exception as exc:
        print(f"Warning: dependency check failed ({exc}). Training may still proceed.", file=sys.stderr)


def _get_available_imports() -> dict:
    import importlib
    needed = {
        "sklearn": "scikit-learn",
        "pandas": "pandas",
        "numpy": "numpy",
        "joblib": "joblib",
    }
    status = {}
    for import_name, pkg_name in needed.items():
        try:
            importlib.import_module(import_name)
            status[pkg_name] = True
        except ImportError:
            status[pkg_name] = False
    return status


def main():
    parser = argparse.ArgumentParser(description="Train the fraud detection messages classifier")
    parser.add_argument("--data", default="data/sample_dataset.csv", help="Path to training CSV")
    parser.add_argument("--text-col", default="message", help="Column name for message text")
    parser.add_argument("--label-col", default="label", help="Column name for label (0=legit, 1=fraud)")
    parser.add_argument("--skip-deps", action="store_true", help="Skip automatic dependency installation")
    args = parser.parse_args()

    if not os.path.exists(args.data):
        print(f"Error: dataset not found at '{args.data}'", file=sys.stderr)
        sys.exit(1)

    if not args.skip_deps:
        _try_ensure_requirements()

    deps = _get_available_imports()
    missing_critical = [pkg for pkg, ok in deps.items() if not ok]
    if missing_critical:
        print(f"Error: missing required packages: {', '.join(missing_critical)}", file=sys.stderr)
        print("Install them with: pip install scikit-learn pandas numpy joblib", file=sys.stderr)
        sys.exit(1)

    from app.ml.model import train_and_save, MODEL_PATH

    report = train_and_save(args.data, text_col=args.text_col, label_col=args.label_col)
    print(f"Model saved to: {MODEL_PATH}")
    print(json.dumps(report, indent=2))

    accuracy = report.get("accuracy", 0)
    if isinstance(accuracy, (int, float)):
        print(f"\nTraining complete. Accuracy: {accuracy:.2%}")
    else:
        print(f"\nTraining complete. Accuracy: {accuracy}")


if __name__ == "__main__":
    main()
