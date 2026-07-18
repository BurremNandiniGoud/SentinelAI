"""
Training script for Counterfeit Currency Detection Model
Run: python train_currency_model.py
"""

import argparse
import os
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.currency_detection.model import CurrencyDetectionModel
from app.currency_detection.preprocessing import CurrencyPreprocessor
import tensorflow as tf


def setup_gpu():
    """Setup GPU if available"""
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"GPU(s) configured: {len(gpus)} GPU(s) detected")
        except RuntimeError as e:
            print(e)
    else:
        print("No GPU detected, using CPU")


def main(args):
    """Main training function"""
    
    print("="*70)
    print("COUNTERFEIT CURRENCY DETECTION - MODEL TRAINING")
    print("="*70)
    
    # Setup
    setup_gpu()
    
    # Create artifacts directory
    artifacts_dir = Path('app/currency_detection/artifacts')
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    
    # Initialize paths
    data_dir = Path(args.data)
    train_dir = data_dir / 'train'
    val_dir = data_dir / 'val'
    test_dir = data_dir / 'test'
    
    print(f"\nDataset path: {data_dir}")
    print(f"Train dir: {train_dir}")
    print(f"Val dir: {val_dir}")
    print(f"Test dir: {test_dir}")
    
    # Check if dataset exists
    if not train_dir.exists():
        print("\n❌ Training data directory not found!")
        print("\n" + "="*70)
        print("DATASET SETUP INSTRUCTIONS")
        print("="*70)
        print(f"\nPlace your dataset in: {data_dir}")
        print("\nExpected structure:")
        print(f"{data_dir}/")
        print("├── train/")
        print("│   ├── real/       (Real currency images)")
        print("│   └── fake/       (Counterfeit images)")
        print("├── val/")
        print("│   ├── real/")
        print("│   └── fake/")
        print("└── test/")
        print("    ├── real/")
        print("    └── fake/")
        print("\n" + "="*70)
        print("\nImage Requirements:")
        print("- Format: JPEG or PNG")
        print("- Resolution: 256×256 px or higher")
        print("- Multiple angles and lighting conditions")
        print("- Both sides of currency notes")
        print("\n" + "="*70)
        return
    
    # Validate dataset
    preprocessor = CurrencyPreprocessor()
    stats = preprocessor.validate_dataset(data_dir)
    
    print("\n📊 Dataset Statistics:")
    for split, categories in stats.items():
        print(f"\n{split.upper()}:")
        for cat, count in categories.items():
            print(f"  {cat}: {count} images")
    
    # Initialize model
    artifacts_dir = Path('app/currency_detection/artifacts')
    checkpoint_path = artifacts_dir / 'currency_model.h5'

    model = CurrencyDetectionModel(
        img_size=256,
        weights_path=str(checkpoint_path)
    )

    if args.resume and checkpoint_path.exists():
        print(f"\n🔄 Resuming from existing checkpoint: {checkpoint_path}")
        model.build_model(freeze_backbone=True)
        model.compile_model(learning_rate=1e-4)
        if not model.load_checkpoint(str(checkpoint_path)):
            print("⚠ Resume failed, continuing with fresh initialization")
        else:
            print("✓ Existing weights loaded successfully")
    else:
        print("\n🔨 Building model...")
        model.build_model(freeze_backbone=True)
        model.compile_model(learning_rate=1e-4)
    
    print(f"\nModel Summary:")
    model.model.summary()
    
    # Create data generators
    print("\n📦 Preparing data generators...")
    train_gen, val_gen = model.get_data_generators(str(train_dir), str(val_dir))
    
    # Phase 1: Train with frozen backbone
    if args.epochs_phase1 > 0 and not (args.resume and checkpoint_path.exists()):
        print("\n" + "="*70)
        print("PHASE 1: Training with Frozen Backbone")
        print("="*70)
        model.train(train_gen, val_gen, epochs=args.epochs_phase1)
    else:
        print("\n" + "="*70)
        print("SKIPPING PHASE 1: Using existing checkpoint weights")
        print("="*70)
    
    # Phase 2: Fine-tuning (unfreeze backbone)
    if args.epochs_phase2 > 0:
        print("\n" + "="*70)
        print("PHASE 2: Fine-tuning with Unfrozen Backbone")
        print("="*70)
        model.fine_tune(train_gen, val_gen, epochs=args.epochs_phase2)
    
    # Evaluate on test set
    if test_dir.exists():
        print("\n" + "="*70)
        print("EVALUATION ON TEST SET")
        print("="*70)
        test_gen = model.get_data_generators(str(test_dir), None)[0]
        metrics = model.evaluate(test_gen)
        
        print("\n📊 Test Metrics:")
        print(f"  Accuracy:  {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall:    {metrics['recall']:.4f}")
        print(f"  F1-Score:  {metrics['f1_score']:.4f}")
        print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
        
        print(f"\nClassification Report:")
        print(metrics['classification_report'])
    
    # Save model
    print("\n💾 Saving model...")
    model_path = artifacts_dir / 'currency_model_final.h5'
    metrics_path = artifacts_dir / 'training_history.json'
    model.save(str(model_path), str(metrics_path))
    
    # Plot training history
    print("\n📈 Plotting training history...")
    plot_path = artifacts_dir / 'training_history.png'
    model.plot_training_history(str(plot_path))
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE!")
    print("="*70)
    print(f"\nModel saved to: {model_path}")
    print(f"Training history saved to: {metrics_path}")
    print(f"Plot saved to: {plot_path}")
    print("\n" + "="*70)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Train Counterfeit Currency Detection Model'
    )
    parser.add_argument(
        '--data',
        type=str,
        default='data/currency_detection',
        help='Path to dataset directory'
    )
    parser.add_argument(
        '--epochs-phase1',
        type=int,
        default=30,
        help='Epochs for phase 1 (frozen backbone)'
    )
    parser.add_argument(
        '--epochs-phase2',
        type=int,
        default=20,
        help='Epochs for phase 2 (fine-tuning)'
    )
    parser.add_argument(
        '--resume',
        action='store_true',
        help='Resume from existing checkpoint instead of retraining phase 1'
    )
    
    args = parser.parse_args()
    main(args)
