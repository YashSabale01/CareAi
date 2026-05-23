"""
Full preprocessing pipeline for CareAI ML models.

Features:
  - Heart Rate (bpm), SpO2 Level (%), Systolic BP, Diastolic BP,
    Body Temperature (C), Fall Detection (binary)
  + Engineered: pulse_pressure, map, hr_spo2_ratio, temp_deviation,
    hypertension_flag, tachycardia_flag, hypoxia_flag

Target: Predicted Disease (5-class)
  Arrhythmia=0, Asthma=1, Diabetes Mellitus=2, Hypertension=3, Normal=4
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os

SAVED_DIR = os.path.join(os.path.dirname(__file__), '../models/saved')
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/patients_data_with_alerts.csv')

# Normalized column names used internally
TEMP_COL = 'Body Temperature (C)'

FEATURE_COLS = [
    'Heart Rate (bpm)',
    'SpO2 Level (%)',
    'Systolic Blood Pressure (mmHg)',
    'Diastolic Blood Pressure (mmHg)',
    TEMP_COL,
    'Fall Detection',
    'pulse_pressure',
    'map',
    'hr_spo2_ratio',
    'temp_deviation',
    'hypertension_flag',
    'tachycardia_flag',
    'hypoxia_flag',
]
TARGET_COL = 'Predicted Disease'


def _normalize_columns(df):
    """Rename temperature column to normalized name regardless of degree symbol encoding."""
    rename_map = {}
    for col in df.columns:
        if 'Body Temperature' in col:
            rename_map[col] = TEMP_COL
    if rename_map:
        df = df.rename(columns=rename_map)
    return df


def load_and_engineer(path=DATA_PATH):
    df = pd.read_csv(path)
    df = _normalize_columns(df)
    df['Fall Detection'] = (df['Fall Detection'].str.strip() == 'Yes').astype(int)
    df['pulse_pressure'] = df['Systolic Blood Pressure (mmHg)'] - df['Diastolic Blood Pressure (mmHg)']
    df['map'] = (df['Systolic Blood Pressure (mmHg)'] + 2 * df['Diastolic Blood Pressure (mmHg)']) / 3
    df['hr_spo2_ratio'] = df['Heart Rate (bpm)'] / df['SpO2 Level (%)']
    df['temp_deviation'] = df[TEMP_COL] - 37.0
    df['hypertension_flag'] = (df['Systolic Blood Pressure (mmHg)'] >= 140).astype(int)
    df['tachycardia_flag'] = (df['Heart Rate (bpm)'] > 100).astype(int)
    df['hypoxia_flag'] = (df['SpO2 Level (%)'] < 90).astype(int)
    df.dropna(subset=FEATURE_COLS + [TARGET_COL], inplace=True)
    return df


def build_pipeline(df):
    X = df[FEATURE_COLS].values
    le = LabelEncoder()
    y = le.fit_transform(df[TARGET_COL])
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    os.makedirs(SAVED_DIR, exist_ok=True)
    joblib.dump(scaler, os.path.join(SAVED_DIR, 'scaler.joblib'))
    joblib.dump(le, os.path.join(SAVED_DIR, 'label_encoder.joblib'))
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, le


def preprocess_inference(vitals: dict, scaler, le):
    """
    Takes a dict of raw vitals and returns scaled feature array for prediction.
    Expected keys: heart_rate, spo2, systolic_bp, diastolic_bp, temperature, fall_detection
    """
    fall = 1 if str(vitals.get('fall_detection', 'No')).lower() in ('yes', 'true', '1') else 0
    hr = float(vitals['heart_rate'])
    spo2 = float(vitals['spo2'])
    sys_bp = float(vitals['systolic_bp'])
    dia_bp = float(vitals['diastolic_bp'])
    temp = float(vitals['temperature'])

    features = [
        hr, spo2, sys_bp, dia_bp, temp, fall,
        sys_bp - dia_bp,
        (sys_bp + 2 * dia_bp) / 3,
        hr / spo2,
        temp - 37.0,
        int(sys_bp >= 140),
        int(hr > 100),
        int(spo2 < 90),
    ]
    arr = np.array(features).reshape(1, -1)
    return scaler.transform(arr)
