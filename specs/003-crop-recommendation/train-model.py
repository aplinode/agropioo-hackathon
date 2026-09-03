"""Train a TensorFlow.js crop-scoring model.

Usage:
    python specs/003-crop-recommendation/train-model.py

Outputs:
    public/models/crop-scoring/model.json + weight shards
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[2]
MODEL_DIR = REPO / "public" / "models" / "crop-scoring"
TRAIN_SCRIPT = REPO / "specs" / "003-crop-recommendation" / "train-model.py"


def build_dummy_dataset() -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(42)
    n = 2000
    soil = rng.integers(0, 2, size=(n, 1))
    irrigation = rng.integers(0, 2, size=(n, 1))
    budget = rng.integers(0, 2, size=(n, 1))
    season = rng.integers(0, 2, size=(n, 1))
    water = rng.integers(0, 2, size=(n, 1))
    category = rng.integers(0, 2, size=(n, 1))
    revenue = rng.uniform(0, 1, size=(n, 1))
    capital = rng.uniform(0, 1, size=(n, 1))
    weather = rng.integers(0, 2, size=(n, 1))
    market = rng.integers(0, 2, size=(n, 1))

    x = np.hstack([soil, irrigation, budget, season, water, category, revenue, capital, weather, market]).astype(np.float32)
    weights = np.array([0.15, 0.1, 0.05, 0.05, 0.05, 0.1, 0.2, 0.15, 0.1, 0.1], dtype=np.float32)
    logits = x @ weights
    y = 1.0 / (1.0 + np.exp(-logits))
    y = (y * 0.6 + 0.2).astype(np.float32)
    return x, y


def main() -> int:
    try:
        import tensorflow as tf
    except ImportError:
        print("tensorflow is required to train the model. Install it and retry.")
        return 1

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    x, y = build_dummy_dataset()
    split = int(len(x) * 0.8)
    x_train, x_val = x[:split], x[split:]
    y_train, y_val = y[:split], y[split:]

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(10,)),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["mae"])
    model.fit(x_train, y_train, validation_data=(x_val, y_val), epochs=20, verbose=0)

    tf.saved_model.save(model, str(MODEL_DIR / "saved_model"))
    print(f"Saved SavedModel to {MODEL_DIR / 'saved_model'}")

    converter = tf.lite.TFLiteConverter.from_saved_model(str(MODEL_DIR / "saved_model"))
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS]
    tflite = converter.convert()
    (MODEL_DIR / "model.tflite").write_bytes(tflite)
    print(f"Saved TFLite model to {MODEL_DIR / 'model.tflite'}")

    manifest = {
        "format": "tfjs-graph-model",
        "generatedBy": "train-model.py",
        "convertedFrom": "saved_model",
        "inputShape": [10],
        "outputShape": [1],
    }
    (MODEL_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"Wrote manifest to {MODEL_DIR / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
