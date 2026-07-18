"""
Counterfeit Currency Detection Model
Transfer Learning with EfficientNet and fine-tuning
Industry-standard approach for image classification
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc
)
import joblib
import json
import matplotlib.pyplot as plt
from pathlib import Path


class CurrencyDetectionModel:
    """
    Industry-standard transfer learning model for counterfeit currency detection.
    Uses EfficientNetB3 as backbone with fine-tuning.
    """
    
    def __init__(self, img_size=256, weights_path='app/currency_detection/artifacts/currency_model.h5'):
        self.img_size = img_size
        self.weights_path = weights_path
        if self.weights_path.endswith('.h5') and not self.weights_path.endswith('.weights.h5'):
            self.weights_path = self.weights_path.replace('.h5', '.weights.h5')
        self.model = None
        self.history = None
        self.class_names = ['fake', 'real']  # Binary classification
        
    def build_model(self, freeze_backbone=False):
        """
        Build model using Transfer Learning (EfficientNetB3)
        
        Args:
            freeze_backbone: If True, freeze pre-trained weights initially
        """
        # Load pre-trained EfficientNetB3
        base_model = EfficientNetB3(
            input_shape=(self.img_size, self.img_size, 3),
            weights='imagenet',
            include_top=False
        )
        
        # Freeze backbone if requested
        base_model.trainable = not freeze_backbone
        
        # Build full model
        model = keras.Sequential([
            layers.Input(shape=(self.img_size, self.img_size, 3)),
            
            # Normalization layer
            layers.Normalization(mean=[0.485, 0.456, 0.406],
                               variance=[0.229**2, 0.224**2, 0.225**2]),
            
            # Pre-trained backbone
            base_model,
            
            # Global pooling
            layers.GlobalAveragePooling2D(),
            
            # Dense layers with dropout (reduce overfitting)
            layers.Dense(512, activation='relu', kernel_regularizer=keras.regularizers.l2(1e-4)),
            layers.BatchNormalization(),
            layers.Dropout(0.4),
            
            layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(1e-4)),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            
            layers.Dense(128, activation='relu', kernel_regularizer=keras.regularizers.l2(1e-4)),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            
            # Output layer (binary classification)
            layers.Dense(1, activation='sigmoid')
        ])
        
        self.model = model
        return model
    
    def compile_model(self, learning_rate=1e-4):
        """Compile model with appropriate loss and metrics"""
        optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
        
        self.model.compile(
            optimizer=optimizer,
            loss='binary_crossentropy',
            metrics=[
                keras.metrics.BinaryAccuracy(name='accuracy'),
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall'),
                keras.metrics.AUC(name='auc')
            ]
        )
    
    def get_data_generators(self, train_dir, val_dir=None):
        """
        Create augmented data generators for training and validation
        
        Args:
            train_dir: Path to training data directory
            val_dir: Path to validation data directory
        """
        # Training data augmentation (strong for better generalization)
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            brightness_range=[0.8, 1.2],
            fill_mode='nearest'
        )
        
        # Validation data (only rescaling, no augmentation)
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        # Create generators
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(self.img_size, self.img_size),
            batch_size=32,
            class_mode='binary',
            classes={'fake': 0, 'real': 1}
        )
        
        val_generator = None
        if val_dir:
            val_generator = val_datagen.flow_from_directory(
                val_dir,
                target_size=(self.img_size, self.img_size),
                batch_size=32,
                class_mode='binary',
                classes={'fake': 0, 'real': 1},
                shuffle=False
            )
        
        return train_generator, val_generator
    
    def load_checkpoint(self, checkpoint_path):
        """Load checkpoints from either weights-only files or full model files."""
        path = Path(checkpoint_path)
        if not path.exists():
            print(f"Checkpoint not found: {checkpoint_path}")
            return False

        try:
            self.model.load_weights(str(path))
            print(f"Loaded weights from {path}")
            return True
        except Exception as first_error:
            print(f"Could not load weights-only checkpoint: {first_error}")
            try:
                loaded_model = keras.models.load_model(str(path), compile=False)
                self.model.set_weights(loaded_model.get_weights())
                print(f"Loaded full model weights from {path}")
                return True
            except Exception as second_error:
                print(f"Failed to load checkpoint as full model: {second_error}")
                return False

    def train(self, train_generator, val_generator=None, epochs=50, callbacks=None):
        """
        Train the model with early stopping and learning rate reduction
        
        Args:
            train_generator: Training data generator
            val_generator: Validation data generator
            epochs: Number of training epochs
            callbacks: Additional Keras callbacks
        """
        default_callbacks = [
            # Early stopping
            keras.callbacks.EarlyStopping(
                monitor='val_loss' if val_generator else 'loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),
            # Learning rate reduction
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss' if val_generator else 'loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            ),
            # Model checkpoint
            keras.callbacks.ModelCheckpoint(
                self.weights_path,
                monitor='val_accuracy' if val_generator else 'accuracy',
                save_best_only=True,
                save_weights_only=True,
                verbose=1
            )
        ]
        
        if callbacks:
            default_callbacks.extend(callbacks)
        
        self.history = self.model.fit(
            train_generator,
            epochs=epochs,
            validation_data=val_generator,
            callbacks=default_callbacks,
            verbose=1
        )
        
        return self.history
    
    def fine_tune(self, train_generator, val_generator=None, epochs=20):
        """
        Fine-tune by unfreezing backbone and training with lower learning rate
        
        Args:
            train_generator: Training data generator
            val_generator: Validation data generator
            epochs: Number of fine-tuning epochs
        """
        # Unfreeze backbone
        for layer in self.model.layers:
            layer.trainable = True
        
        # Recompile with lower learning rate
        self.compile_model(learning_rate=1e-5)
        
        # Train
        self.train(train_generator, val_generator, epochs=epochs)
    
    def predict_proba(self, image_path):
        """
        Predict probability of being counterfeit
        
        Returns:
            dict: {
                'fake_probability': float (0-1),
                'real_probability': float (0-1),
                'prediction': 'real' or 'fake',
                'confidence': float (0-100)
            }
        """
        from tensorflow.keras.preprocessing import image
        
        # Load and preprocess image
        img = image.load_img(image_path, target_size=(self.img_size, self.img_size))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Predict
        prediction = self.model.predict(img_array, verbose=0)[0][0]
        
        fake_prob = 1 - prediction
        real_prob = prediction
        
        return {
            'fake_probability': float(fake_prob),
            'real_probability': float(real_prob),
            'prediction': 'real' if real_prob > 0.5 else 'fake',
            'confidence': float(max(fake_prob, real_prob) * 100)
        }
    
    def evaluate(self, test_generator):
        """
        Evaluate model on test set and return detailed metrics
        
        Returns:
            dict: Comprehensive evaluation metrics
        """
        # Get predictions
        y_true = []
        y_pred_proba = []
        
        for images, labels in test_generator:
            predictions = self.model.predict(images, verbose=0)
            y_true.extend(labels)
            y_pred_proba.extend(predictions.flatten())
            
            if len(y_true) >= test_generator.samples:
                break
        
        y_pred = (np.array(y_pred_proba) > 0.5).astype(int)
        y_true = np.array(y_true)[:len(y_pred)]
        
        # Metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        # ROC-AUC
        fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
        roc_auc = auc(fpr, tpr)
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        
        metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'roc_auc': float(roc_auc),
            'confusion_matrix': cm.tolist(),
            'classification_report': classification_report(
                y_true, y_pred,
                target_names=['fake', 'real'],
                output_dict=True
            )
        }
        
        return metrics
    
    def save(self, model_path=None, metrics_path=None):
        """Save model and metrics"""
        if model_path:
            self.model.save(model_path)
            print(f"Model saved to {model_path}")
        
        if metrics_path and self.history:
            history_dict = {
                'loss': self.history.history['loss'],
                'accuracy': self.history.history['accuracy'],
            }
            if 'val_loss' in self.history.history:
                history_dict.update({
                    'val_loss': self.history.history['val_loss'],
                    'val_accuracy': self.history.history['val_accuracy'],
                })
            
            with open(metrics_path, 'w') as f:
                json.dump(history_dict, f, indent=2)
            print(f"Training history saved to {metrics_path}")
    
    def load_weights(self):
        """Load trained weights"""
        if Path(self.weights_path).exists():
            self.model.load_weights(self.weights_path)
            print(f"Weights loaded from {self.weights_path}")
            return True
        return False
    
    def plot_training_history(self, save_path=None):
        """Plot training history"""
        if not self.history:
            print("No training history available")
            return
        
        fig, axes = plt.subplots(1, 2, figsize=(15, 5))
        
        # Accuracy
        axes[0].plot(self.history.history['accuracy'], label='Train Accuracy')
        if 'val_accuracy' in self.history.history:
            axes[0].plot(self.history.history['val_accuracy'], label='Val Accuracy')
        axes[0].set_title('Model Accuracy')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Accuracy')
        axes[0].legend()
        axes[0].grid(True)
        
        # Loss
        axes[1].plot(self.history.history['loss'], label='Train Loss')
        if 'val_loss' in self.history.history:
            axes[1].plot(self.history.history['val_loss'], label='Val Loss')
        axes[1].set_title('Model Loss')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Loss')
        axes[1].legend()
        axes[1].grid(True)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
            print(f"Plot saved to {save_path}")
        
        plt.show()
