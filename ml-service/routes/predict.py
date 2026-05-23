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
SAVED_DIR  = os.path.join(os.path.dirname(__file__), '../models/saved')

_models = {}
_scaler = None
_le     = None
_meta   = {}


def _load_models():
    global _scaler, _le, _meta
    _scaler = joblib.load(os.path.join(SAVED_DIR, 'scaler.joblib'))
    _le     = joblib.load(os.path.join(SAVED_DIR, 'label_encoder.joblib'))
    with open(os.path.join(SAVED_DIR, 'model_meta.json')) as f:
        _meta = json.load(f)
    _models['random_forest'] = joblib.load(os.path.join(SAVED_DIR, 'random_forest.joblib'))
    _models['xgboost']       = joblib.load(os.path.join(SAVED_DIR, 'xgboost_model.joblib'))


try:
    _load_models()
except Exception as e:
    print(f"[WARNING] Models not loaded: {e}. Train first with: python -m models.train")


FEATURE_LABELS = {
    'age':                  'Age',
    'heart_rate':           'Heart Rate',
    'systolic_bp':          'Systolic Blood Pressure',
    'diastolic_bp':         'Diastolic Blood Pressure',
    'spo2':                 'Oxygen Level (SpO2)',
    'glucose_level':        'Blood Glucose Level',
    'temperature':          'Body Temperature (°F)',
    'cholesterol':          'Cholesterol',
    'bmi':                  'BMI',
    'pulse_pressure':       'Pulse Pressure',
    'map':                  'Mean Arterial Pressure',
    'hr_spo2_ratio':        'Heart Rate / SpO2 Ratio',
    'temp_deviation_f':     'Temperature Deviation from Normal',
    'hypertension_flag':    'High Blood Pressure Flag',
    'tachycardia_flag':     'Rapid Heart Rate Flag',
    'hypoxia_flag':         'Low Oxygen Flag',
    'high_glucose_flag':    'High Glucose Flag',
    'high_cholesterol_flag': 'High Cholesterol Flag',
    'obese_flag':           'Obesity Flag',
}

REQUIRED_FIELDS = [
    'age', 'heart_rate', 'systolic_bp', 'diastolic_bp',
    'spo2', 'glucose_level', 'temperature', 'cholesterol', 'bmi',
]


def _compute_alerts(v):
    hr   = float(v.get('heart_rate', 0))
    spo2 = float(v.get('spo2', 100))
    sys_ = float(v.get('systolic_bp', 120))
    dia_ = float(v.get('diastolic_bp', 80))
    temp = float(v.get('temperature', 98.6))
    gluc = float(v.get('glucose_level', 90))
    chol = float(v.get('cholesterol', 180))
    bmi  = float(v.get('bmi', 22))

    return {
        'heart_rate':     'High' if hr > 100 else ('Low' if hr < 60 else 'Normal'),
        'spo2':           'Low'  if spo2 < 95 else 'Normal',
        'blood_pressure': 'High' if sys_ >= 140 or dia_ >= 90 else 'Normal',
        'temperature':    'High' if temp > 99.5 else ('Low' if temp < 97.0 else 'Normal'),
        'glucose':        'High' if gluc > 126 else ('Low' if gluc < 70 else 'Normal'),
        'cholesterol':    'High' if chol > 200 else 'Normal',
        'bmi':            'Obese' if bmi >= 30 else ('Underweight' if bmi < 18.5 else 'Normal'),
    }


def _compute_risk_override(alerts):
    """
    Override model risk if vitals are critically abnormal.
    Returns 'High', 'Medium', or None (use model output).
    """
    critical = sum(1 for k, v in alerts.items() if v not in ('Normal',))
    if critical >= 3:
        return 'High'
    if critical >= 1:
        return None  # let model decide but don't downgrade
    return None


def _run_prediction(data):
    from preprocessing.pipeline import preprocess_inference
    X = preprocess_inference(data, _scaler, _le)
    champion = _meta.get('champion', 'random_forest')
    model    = _models[champion]
    proba    = model.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    risk_level  = _le.inverse_transform([pred_idx])[0]
    confidence  = float(proba[pred_idx])
    class_probs = {cls: round(float(p), 4) for cls, p in zip(_le.classes_, proba)}

    alerts = _compute_alerts(data)

    # Upgrade risk if vitals are critically abnormal
    override = _compute_risk_override(alerts)
    if override == 'High' and risk_level == 'Low':
        risk_level = 'Medium'  # at minimum bump to medium

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
    shap_raw  = get_shap_top_features(model, X, pred_idx, raw_features)
    shap_info = {FEATURE_LABELS.get(k, k): v for k, v in shap_raw.items()}

    return {
        'predicted_disease':   risk_level,
        'risk_level':         risk_level,
        'confidence':         round(confidence, 4),
        'confidence_label':   confidence_label,
        'class_probabilities': class_probs,
        'alerts':             alerts,
        'model_used':         champion,
        'shap_values':        shap_info,
    }


@predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400
    for field in REQUIRED_FIELDS:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    if not _models:
        return jsonify({'error': 'Models not loaded. Run training first.'}), 503
    try:
        return jsonify(_run_prediction(data))
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
