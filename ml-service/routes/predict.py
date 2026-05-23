"""
Prediction endpoints for CareAI ML service.

POST /api/predict       — single prediction
POST /api/predict/batch — batch predictions
GET  /api/models/info   — model metadata
"""

from flask import Blueprint, request, jsonify
import joblib
import numpy as np
import os
import json
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

predict_bp = Blueprint('predict', __name__)
SAVED_DIR = os.path.join(os.path.dirname(__file__), '../models/saved')

_models = {}
_scaler = None
_le = None
_meta = {}


def _load_models():
    global _scaler, _le, _meta
    _scaler = joblib.load(os.path.join(SAVED_DIR, 'scaler.joblib'))
    _le = joblib.load(os.path.join(SAVED_DIR, 'label_encoder.joblib'))
    with open(os.path.join(SAVED_DIR, 'model_meta.json')) as f:
        _meta = json.load(f)
    _models['random_forest'] = joblib.load(os.path.join(SAVED_DIR, 'random_forest.joblib'))
    _models['xgboost'] = joblib.load(os.path.join(SAVED_DIR, 'xgboost_model.joblib'))


try:
    _load_models()
except Exception as e:
    print(f"[WARNING] Models not loaded: {e}. Train first with: python -m models.train")


# Human-readable feature name mapping
FEATURE_LABELS = {
    'heart_rate':        'Heart Rate',
    'spo2':              'Oxygen Level (SpO2)',
    'systolic_bp':       'Systolic Blood Pressure',
    'diastolic_bp':      'Diastolic Blood Pressure',
    'temperature':       'Body Temperature',
    'fall_detection':    'Fall Detected',
    'pulse_pressure':    'Pulse Pressure',
    'map':               'Mean Arterial Pressure',
    'hr_spo2_ratio':     'Heart Rate / SpO2 Ratio',
    'temp_deviation':    'Temperature Deviation from Normal',
    'hypertension_flag': 'High Blood Pressure Flag',
    'tachycardia_flag':  'Rapid Heart Rate Flag',
    'hypoxia_flag':      'Low Oxygen Flag',
}


def _compute_alerts(vitals):
    hr = float(vitals.get('heart_rate', 0))
    spo2 = float(vitals.get('spo2', 100))
    sys_bp = float(vitals.get('systolic_bp', 120))
    dia_bp = float(vitals.get('diastolic_bp', 80))
    temp = float(vitals.get('temperature', 37.0))
    alerts = {
        'heart_rate':     'High' if hr > 100 else ('Low' if hr < 60 else 'Normal'),
        'spo2':           'Low' if spo2 < 90 else 'Normal',
        'blood_pressure': 'High' if sys_bp >= 140 or dia_bp >= 90 else 'Normal',
        'temperature':    'Abnormal' if temp < 36.1 or temp > 37.9 else 'Normal',
    }
    return alerts


def _count_alerts(alerts):
    return sum(1 for v in alerts.values() if v != 'Normal')


def _compute_risk(disease, confidence, alerts):
    """
    Risk Level logic:
    - HIGH:   life-threatening conditions (Arrhythmia, Hypertension) with any confidence,
              OR any condition with 2+ vital alerts,
              OR critical condition with high confidence (>=0.70)
    - MEDIUM: Diabetes/Asthma with confidence >=0.50,
              OR any condition with 1 vital alert,
              OR Normal prediction but confidence is low (<0.55, model is uncertain)
    - LOW:    Normal with high confidence and no alerts
    """
    alert_count = _count_alerts(alerts)

    if disease in ('Arrhythmia', 'Hypertension'):
        if confidence >= 0.70 or alert_count >= 1:
            return 'High'
        return 'Medium'

    if alert_count >= 2:
        return 'High'

    if disease in ('Diabetes Mellitus', 'Asthma'):
        if confidence >= 0.70:
            return 'High'
        if confidence >= 0.50:
            return 'Medium'
        return 'Low'

    if disease == 'Normal':
        if alert_count >= 1:
            return 'Medium'   # vitals are off even though model says Normal
        if confidence < 0.55:
            return 'Medium'   # model is uncertain
        return 'Low'

    # fallback
    if alert_count >= 1:
        return 'Medium'
    return 'Low'


def _run_prediction(data):
    from preprocessing.pipeline import preprocess_inference
    X = preprocess_inference(data, _scaler, _le)
    champion = _meta.get('champion', 'random_forest')
    model = _models[champion]
    proba = model.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    predicted_disease = _le.inverse_transform([pred_idx])[0]
    confidence = float(proba[pred_idx])
    class_probs = {cls: round(float(p), 4) for cls, p in zip(_le.classes_, proba)}
    alerts = _compute_alerts(data)
    risk_level = _compute_risk(predicted_disease, confidence, alerts)

    # Confidence interpretation for display
    if confidence >= 0.80:
        confidence_label = 'High certainty'
    elif confidence >= 0.60:
        confidence_label = 'Moderate certainty'
    elif confidence >= 0.40:
        confidence_label = 'Low certainty — monitor closely'
    else:
        confidence_label = 'Very uncertain — further evaluation needed'

    from utils.explainability import get_shap_top_features
    raw_features = _meta.get('features', [])
    shap_raw = get_shap_top_features(model, X, pred_idx, raw_features)
    # Map raw feature names to human-readable labels
    shap_info = {FEATURE_LABELS.get(k, k): v for k, v in shap_raw.items()}

    return {
        'predicted_disease': predicted_disease,
        'risk_level': risk_level,
        'confidence': round(confidence, 4),
        'confidence_label': confidence_label,
        'class_probabilities': class_probs,
        'alerts': alerts,
        'model_used': champion,
        'shap_values': shap_info,
    }


@predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400

    required = ['heart_rate', 'spo2', 'systolic_bp', 'diastolic_bp', 'temperature']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    if not _models:
        return jsonify({'error': 'Models not loaded. Run training first.'}), 503

    try:
        result = _run_prediction(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@predict_bp.route('/predict/batch', methods=['POST'])
def predict_batch():
    payload = request.get_json()
    if not payload:
        return jsonify({'error': 'No JSON body provided'}), 400

    records = payload.get('records', [])
    if not records:
        return jsonify({'error': 'No records provided'}), 400

    if not _models:
        return jsonify({'error': 'Models not loaded. Run training first.'}), 503

    out = []
    for rec in records:
        try:
            result = _run_prediction(rec)
            result['patient_id'] = rec.get('patient_id')
            out.append(result)
        except Exception as e:
            out.append({'patient_id': rec.get('patient_id'), 'error': str(e)})

    return jsonify({'results': out, 'count': len(out)})


@predict_bp.route('/models/info', methods=['GET'])
def model_info():
    if not _meta:
        return jsonify({'error': 'Models not loaded'}), 503
    return jsonify(_meta)
