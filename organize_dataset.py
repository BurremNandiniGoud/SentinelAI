"""
Senior ML Architect - Data Organization & Preparation Script
Automatically organizes raw currency dataset into train/val/test splits
"""

import os
import shutil
import numpy as np
from pathlib import Path
from collections import defaultdict
from sklearn.model_selection import train_test_split
import json

class CurrencyDatasetOrganizer:
    def __init__(self, raw_data_path, output_path, train_ratio=0.70, val_ratio=0.15):
        self.raw_data_path = Path(raw_data_path)
        self.output_path = Path(output_path)
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = 1 - train_ratio - val_ratio
        
        # Denomination denominations in Indian Currency
        self.denominations = ['10', '20', '50', '100', '200', '500', '2000']
        self.categories = ['real', 'fake']
        
        self.stats = defaultdict(lambda: {'real': 0, 'fake': 0})
        
    def collect_images(self):
        """Collect all image paths organized by denomination and category"""
        print("=" * 70)
        print("COLLECTING IMAGES FROM DATASET")
        print("=" * 70)
        
        image_data = defaultdict(lambda: {'real': [], 'fake': []})
        
        for category in self.categories:
            category_path = self.raw_data_path / category
            if not category_path.exists():
                print(f"⚠ Warning: {category_path} not found")
                continue
                
            for denom in self.denominations:
                denom_path = category_path / denom
                if not denom_path.exists():
                    print(f"  Skipping {category}/{denom} - not found")
                    continue
                
                # Collect all image files
                image_files = []
                for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
                    image_files.extend(denom_path.glob(ext))
                
                image_data[denom][category] = [str(f) for f in image_files]
                count = len(image_files)
                self.stats[denom][category] = count
                print(f"  {category.upper()}/{denom}: {count:4d} images")
        
        return image_data
    
    def balance_dataset(self, image_data):
        """Balance dataset across denominations"""
        print("\n" + "=" * 70)
        print("BALANCING DATASET")
        print("=" * 70)
        
        balanced_data = {}
        min_samples = float('inf')
        
        # Find minimum samples per denomination
        for denom in self.denominations:
            real_count = len(image_data[denom]['real'])
            fake_count = len(image_data[denom]['fake'])
            total = real_count + fake_count
            
            if total > 0:
                # Balance real/fake for this denomination
                min_class = min(real_count, fake_count)
                min_samples = min(min_samples, min_class)
                print(f"  {denom}: Real={real_count}, Fake={fake_count} → Balanced to {min_class} each")
        
        if min_samples == float('inf'):
            min_samples = 100
            print("  ⚠ No data found, using default 100")
        
        # Apply balancing
        for denom in self.denominations:
            real_files = image_data[denom]['real']
            fake_files = image_data[denom]['fake']
            
            # Randomly select equal samples
            np.random.seed(42)
            real_selected = np.random.choice(real_files, min(len(real_files), min_samples), replace=False)
            fake_selected = np.random.choice(fake_files, min(len(fake_files), min_samples), replace=False)
            
            balanced_data[denom] = {
                'real': list(real_selected),
                'fake': list(fake_selected)
            }
        
        print(f"\n✓ Balanced: {min_samples} images per class per denomination")
        return balanced_data
    
    def create_splits(self, balanced_data):
        """Create train/val/test splits"""
        print("\n" + "=" * 70)
        print("CREATING TRAIN/VAL/TEST SPLITS")
        print("=" * 70)
        
        splits = {'train': {'real': [], 'fake': []}, 
                  'val': {'real': [], 'fake': []}, 
                  'test': {'real': [], 'fake': []}}
        
        split_stats = defaultdict(lambda: {'train': 0, 'val': 0, 'test': 0})
        
        for denom in self.denominations:
            for category in self.categories:
                files = balanced_data[denom][category]
                
                if len(files) == 0:
                    continue
                
                # First split: train+val vs test (70/30 then 70/15 = 70/15/15)
                train_val, test = train_test_split(
                    files, 
                    test_size=self.test_ratio, 
                    random_state=42
                )
                
                # Second split: train vs val
                train, val = train_test_split(
                    train_val,
                    test_size=self.val_ratio/(self.train_ratio + self.val_ratio),
                    random_state=42
                )
                
                splits['train'][category].extend(train)
                splits['val'][category].extend(val)
                splits['test'][category].extend(test)
                
                split_stats[denom]['train'] += len(train)
                split_stats[denom]['val'] += len(val)
                split_stats[denom]['test'] += len(test)
                
                print(f"  {denom}/{category}: Train={len(train)}, Val={len(val)}, Test={len(test)}")
        
        return splits, split_stats
    
    def create_directory_structure(self):
        """Create output directory structure"""
        print("\n" + "=" * 70)
        print("CREATING DIRECTORY STRUCTURE")
        print("=" * 70)
        
        for split in ['train', 'val', 'test']:
            for category in ['real', 'fake']:
                path = self.output_path / split / category
                path.mkdir(parents=True, exist_ok=True)
                print(f"  Created: {path.relative_to(self.output_path.parent)}")
    
    def copy_files(self, splits):
        """Copy files to respective directories"""
        print("\n" + "=" * 70)
        print("ORGANIZING FILES INTO SPLITS")
        print("=" * 70)
        
        total_copied = 0
        
        for split_name, categories in splits.items():
            for category, files in categories.items():
                dest_dir = self.output_path / split_name / category
                
                for file_path in files:
                    try:
                        src = Path(file_path)
                        dst = dest_dir / src.name
                        
                        # Avoid duplicates
                        if not dst.exists():
                            shutil.copy2(src, dst)
                            total_copied += 1
                    except Exception as e:
                        print(f"  ⚠ Error copying {file_path}: {e}")
                
                count = len(list(dest_dir.glob('*.*')))
                print(f"  {split_name}/{category}: {count} files")
        
        print(f"\n✓ Total files organized: {total_copied}")
    
    def generate_report(self, split_stats):
        """Generate detailed statistics report"""
        print("\n" + "=" * 70)
        print("DATASET STATISTICS REPORT")
        print("=" * 70)
        
        report = {
            'timestamp': str(Path.cwd()),
            'source_path': str(self.raw_data_path),
            'output_path': str(self.output_path),
            'split_ratios': {
                'train': f"{self.train_ratio*100:.0f}%",
                'val': f"{self.val_ratio*100:.0f}%",
                'test': f"{self.test_ratio*100:.0f}%"
            },
            'by_denomination': {}
        }
        
        total_train, total_val, total_test = 0, 0, 0
        
        for denom in self.denominations:
            stats = split_stats[denom]
            report['by_denomination'][denom] = {
                'train': stats['train'],
                'val': stats['val'],
                'test': stats['test'],
                'total': stats['train'] + stats['val'] + stats['test']
            }
            
            total_train += stats['train']
            total_val += stats['val']
            total_test += stats['test']
            
            print(f"  {denom}: Train={stats['train']:4d}, Val={stats['val']:4d}, Test={stats['test']:4d}")
        
        report['totals'] = {
            'train': total_train,
            'val': total_val,
            'test': total_test,
            'all': total_train + total_val + total_test
        }
        
        print(f"\n  TOTAL DATASET SIZE: {report['totals']['all']} images")
        print(f"    Train: {total_train} ({total_train/(total_train+total_val+total_test)*100:.1f}%)")
        print(f"    Val:   {total_val} ({total_val/(total_train+total_val+total_test)*100:.1f}%)")
        print(f"    Test:  {total_test} ({total_test/(total_train+total_val+total_test)*100:.1f}%)")
        
        # Save report
        report_path = self.output_path / 'dataset_report.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\n  ✓ Report saved: {report_path}")
        
        return report
    
    def organize(self):
        """Main orchestration method"""
        print("\n")
        print("╔" + "=" * 68 + "╗")
        print("║" + " " * 15 + "CURRENCY DATASET ORGANIZATION" + " " * 23 + "║")
        print("║" + " " * 10 + "Senior ML Architect - Automated Preparation" + " " * 15 + "║")
        print("╚" + "=" * 68 + "╝")
        
        try:
            # Step 1: Collect images
            image_data = self.collect_images()
            
            # Step 2: Balance dataset
            balanced_data = self.balance_dataset(image_data)
            
            # Step 3: Create splits
            splits, split_stats = self.create_splits(balanced_data)
            
            # Step 4: Create directory structure
            self.create_directory_structure()
            
            # Step 5: Copy files
            self.copy_files(splits)
            
            # Step 6: Generate report
            report = self.generate_report(split_stats)
            
            print("\n" + "=" * 70)
            print("✓ DATASET ORGANIZATION COMPLETE!")
            print("=" * 70)
            print(f"\nOutput path: {self.output_path}")
            print(f"Ready for training with: python train_currency_model.py --data {self.output_path}")
            
            return True
            
        except Exception as e:
            print(f"\n✗ Error during organization: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Organize currency dataset into train/val/test splits'
    )
    parser.add_argument(
        '--raw-data',
        default='data/dataset_currency/data/data',
        help='Path to raw dataset with real/fake denomination folders'
    )
    parser.add_argument(
        '--output',
        default='data/currency_detection',
        help='Output path for organized dataset'
    )
    parser.add_argument(
        '--train-ratio',
        type=float,
        default=0.70,
        help='Training set ratio (default: 0.70)'
    )
    parser.add_argument(
        '--val-ratio',
        type=float,
        default=0.15,
        help='Validation set ratio (default: 0.15)'
    )
    
    args = parser.parse_args()
    
    organizer = CurrencyDatasetOrganizer(
        raw_data_path=args.raw_data,
        output_path=args.output,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio
    )
    
    success = organizer.organize()
    return 0 if success else 1


if __name__ == '__main__':
    exit(main())
