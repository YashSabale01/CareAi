"""Tests for CareAI ML microservice."""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

SAMPLE_VITALS = {
    'age': 45,
    'heart_rate': 96,
    'spo2': 92,
    'systolic_bp': 130,
    'diastolic_bp': 85,
    'temperature': 98.6,
    'glucose_level': 110,
    'cholesterol': 190,
    'bmi': 27.5,
}


def test_preprocessing_pipeline():
    from preprocessing.pipeline import load_and_engineer, FEATURE_COLS
    df = load_and_engineer()
    assert len(df) > 0
    for col in FEATURE_COLS:
        assert col in df.columns, f"Missing column: {col}"


def test_build_pipeline():
    from preprocessing.pipeline import load_and_engineer, build_pipeline
    df = load_and_engineer()
    X_train, X_test, y_train, y_test, scaler, le = build_pipeline(df)
    assert X_train.shape[1] == 19
    assert len(le.classes_) == 3
    assert set(le.classes_) == {'High', 'Low', 'Medium'}


def test_model_loading():
    import joblib
    saved_dir = os.path.join(os.path.dirname(__file__), '../models/saved')
    for fname in ['random_forest.joblib', 'xgboost_model.joblib', 'scaler.joblib', 'label_encoder.joblib', 'model_meta.json']:
        path = os.path.join(saved_dir, fname)
        assert os.path.exists(path), f"Missing model file: {fname}"
    scaler = joblib.load(os.path.join(saved_dir, 'scaler.joblib'))
    le = joblib.load(os.path.join(saved_dir, 'label_encoder.joblib'))
    assert scaler is not None
    assert set(le.classes_) == {'High', 'Low', 'Medium'}


def test_preprocess_inference():
    import joblib
    saved_dir = os.path.join(os.path.dirname(__file__), '../models/saved')
    scaler = joblib.load(os.path.join(saved_dir, 'scaler.joblib'))
    le = joblib.load(os.path.join(saved_dir, 'label_encoder.joblib'))
    from preprocessing.pipeline import preprocess_inference
    X = preprocess_inference(SAMPLE_VITALS, scaler, le)
    assert X.shape == (1, 19)


def test_predict_endpoint():
    from app import app
    client = app.test_client()
    response = client.post('/api/predict', json=SAMPLE_VITALS)
    assert response.status_code == 200
    data = response.get_json()
    assert data['risk_level'] in ['Low', 'Medium', 'High']
    assert 0 <= data['confidence'] <= 1
    assert 'class_probabilities' in data
    assert 'alerts' in data


def test_batch_predict_endpoint():
    from app import app
    client = app.test_client()
    records = [dict(SAMPLE_VITALS, patient_id=f'PAT-{i}') for i in range(3)]
    response = client.post('/api/predict/batch', json={'records': records})
    assert response.status_code == 200
    data = response.get_json()
    assert data['count'] == 3


def test_health_endpoint():
    from app import app
    client = app.test_client()
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.get_json()['status'] == 'OK'


def test_missing_field_returns_400():
    from app import app
    client = app.test_client()
    incomplete = {k: v for k, v in SAMPLE_VITALS.items() if k != 'heart_rate'}
    response = client.post('/api/predict', json=incomplete)
    assert response.status_code == 400


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
