"""
Training script for CareAI clinical risk prediction.
  - XGBoost  : GPU  (device='cuda', tree_method='hist')
  - Random Forest : CPU single-threaded (sklearn has no GPU support)
Target: Risk Level — High / Low / Medium  (3-class)
Run: python -m models.train
"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score, roc_auc_score
from sklearn.model_selection import GridSearchCV
import xgboost as xgb
import numpy as np
import joblib
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from preprocessing.pipeline import load_and_engineer, build_pipeline, SAVED_DIR


def train_random_forest(X_train, y_train):
    """CPU-only — sklearn has no GPU backend."""
    param_grid = {
        'n_estimators':    [100, 200],
        'max_depth':       [None, 15, 25],
        'min_samples_split': [2, 5],
    }
    base = RandomForestClassifier(random_state=42, n_jobs=1, class_weight='balanced')
    gs = GridSearchCV(base, param_grid, cv=3, scoring='f1_weighted', n_jobs=1, verbose=1)
    gs.fit(X_train, y_train)
    print(f"[RF]  Best params : {gs.best_params_}")
    print(f"[RF]  Best CV F1  : {gs.best_score_:.4f}")
    return gs.best_estimator_


def train_xgboost_gpu(X_train, y_train, num_classes):
    """
    XGBoost 3.x GPU training.
    tree_method='hist' + device='cuda' is the correct syntax for XGBoost >= 2.0
    """
    print("[XGB] Training on GPU (device=cuda)...")
    params = {
        'objective':        'multi:softprob',
        'num_class':        num_classes,
        'tree_method':      'hist',
        'device':           'cuda',
        'eval_metric':      'mlogloss',
        'random_state':     42,
        'n_estimators':     300,
        'max_depth':        6,
        'learning_rate':    0.1,
        'subsample':        0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
    }
    model = xgb.XGBClassifier(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train)],
        verbose=50,
    )
    return model


def evaluate_model(model, X_test, y_test, name, le):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1  = f1_score(y_test, y_pred, average='weighted')
    try:
        auc = roc_auc_score(y_test, y_prob, multi_class='ovr', average='weighted')
    except Exception:
        auc = None
    report = classification_report(y_test, y_pred, target_names=le.classes_, output_dict=True)
    print(f"\n{'='*50}\nModel: {name}")
    print(f"  Accuracy : {acc:.4f}\n  F1 Score : {f1:.4f}")
    if auc:
        print(f"  AUC-ROC  : {auc:.4f}")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    return {'accuracy': acc, 'f1_weighted': f1, 'auc': auc, 'report': report}


def clean(obj):
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    if isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    return obj


def main():
    print("Loading and engineering features...")
    df = load_and_engineer()
    print(f"Dataset shape : {df.shape}")
    print(f"Risk Level distribution:\n{df['Risk Level'].value_counts()}")

    X_train, X_test, y_train, y_test, scaler, le = build_pipeline(df)
    num_classes = len(le.classes_)
    print(f"Classes ({num_classes}): {le.classes_.tolist()}")

    # ── XGBoost on GPU ──────────────────────────────────────────────
    print("\nTraining XGBoost on GPU...")
    xgb_model   = train_xgboost_gpu(X_train, y_train, num_classes)
    xgb_metrics = evaluate_model(xgb_model, X_test, y_test, 'XGBoost (GPU)', le)

    # ── Random Forest on CPU ────────────────────────────────────────
    print("\nTraining Random Forest on CPU...")
    rf_model    = train_random_forest(X_train, y_train)
    rf_metrics  = evaluate_model(rf_model, X_test, y_test, 'Random Forest (CPU)', le)

    # ── Save models ─────────────────────────────────────────────────
    joblib.dump(rf_model,  os.path.join(SAVED_DIR, 'random_forest.joblib'))
    joblib.dump(xgb_model, os.path.join(SAVED_DIR, 'xgboost_model.joblib'))

    champion = 'xgboost' if xgb_metrics['f1_weighted'] >= rf_metrics['f1_weighted'] else 'random_forest'

    feature_keys = [
        'age', 'heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2',
        'glucose_level', 'temperature', 'cholesterol', 'bmi',
        'pulse_pressure', 'map', 'hr_spo2_ratio', 'temp_deviation_f',
        'hypertension_flag', 'tachycardia_flag', 'hypoxia_flag',
        'high_glucose_flag', 'high_cholesterol_flag', 'obese_flag',
    ]

    meta = {
        'champion':      champion,
        'random_forest': rf_metrics,
        'xgboost':       xgb_metrics,
        'classes':       le.classes_.tolist(),
        'features':      feature_keys,
    }
    with open(os.path.join(SAVED_DIR, 'model_meta.json'), 'w') as f:
        json.dump(clean(meta), f, indent=2)

    print(f"\n[CHAMPION MODEL]: {champion.upper()}")
    print(f"  XGBoost F1  : {xgb_metrics['f1_weighted']:.4f}")
    print(f"  RF      F1  : {rf_metrics['f1_weighted']:.4f}")
    print("All models saved to ml-service/models/saved/")


if __name__ == '__main__':
    main()
