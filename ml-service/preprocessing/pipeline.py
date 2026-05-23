"""
Preprocessing pipeline for CareAI clinical risk prediction.

Input vitals (from caretaker):
  Age, Heart Rate (bpm), Systolic BP, Diastolic BP, SpO2 (%),
  Glucose Level (mg/dL), Temperature (°F), Cholesterol (mg/dL), BMI

Engineered features:
  pulse_pressure, map, hr_spo2_ratio, temp_deviation_f,
  hypertension_flag, tachycardia_flag, hypoxia_flag,
  high_glucose_flag, high_cholesterol_flag, obese_flag

Target: Risk Level — Low=0, Medium=1, High=2
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os

SAVED_DIR = os.path.join(os.path.dirname(__file__), '../models/saved')
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/clinical_risk_dataset_50k.csv')

FEATURE_COLS = [
    'Age',
    'Heart Rate',
    'Systolic BP',
    'Diastolic BP',
    'SpO2',
    'Glucose Level',
    'Temperature',
    'Cholesterol',
    'BMI',
    'pulse_pressure',
    'map',
    'hr_spo2_ratio',
    'temp_deviation_f',
    'hypertension_flag',
    'tachycardia_flag',
    'hypoxia_flag',
    'high_glucose_flag',
    'high_cholesterol_flag',
    'obese_flag',
]
TARGET_COL = 'Risk Level'


def _engineer(df):
    df = df.copy()
    df['pulse_pressure']      = df['Systolic BP'] - df['Diastolic BP']
    df['map']                 = (df['Systolic BP'] + 2 * df['Diastolic BP']) / 3
    df['hr_spo2_ratio']       = df['Heart Rate'] / df['SpO2'].replace(0, np.nan)
    df['temp_deviation_f']    = df['Temperature'] - 98.6
    df['hypertension_flag']   = (df['Systolic BP'] >= 140).astype(int)
    df['tachycardia_flag']    = (df['Heart Rate'] > 100).astype(int)
    df['hypoxia_flag']        = (df['SpO2'] < 95).astype(int)
    df['high_glucose_flag']   = (df['Glucose Level'] > 126).astype(int)
    df['high_cholesterol_flag'] = (df['Cholesterol'] > 200).astype(int)
    df['obese_flag']          = (df['BMI'] >= 30).astype(int)
    return df


def load_and_engineer(path=DATA_PATH):
    df = pd.read_csv(path)
    # Drop the combined 'Blood Pressure' string column if present
    if 'Blood Pressure' in df.columns:
        df = df.drop(columns=['Blood Pressure'])
    df = _engineer(df)
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
    X_test_scaled  = scaler.transform(X_test)
    os.makedirs(SAVED_DIR, exist_ok=True)
    joblib.dump(scaler, os.path.join(SAVED_DIR, 'scaler.joblib'))
    joblib.dump(le,     os.path.join(SAVED_DIR, 'label_encoder.joblib'))
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, le


def preprocess_inference(vitals: dict, scaler, le):
    """
    vitals keys: age, heart_rate, systolic_bp, diastolic_bp, spo2,
                 glucose_level, temperature, cholesterol, bmi
    temperature expected in °F
    """
    age   = float(vitals['age'])
    hr    = float(vitals['heart_rate'])
    sys_  = float(vitals['systolic_bp'])
    dia_  = float(vitals['diastolic_bp'])
    spo2  = float(vitals['spo2'])
    gluc  = float(vitals['glucose_level'])
    temp  = float(vitals['temperature'])
    chol  = float(vitals['cholesterol'])
    bmi   = float(vitals['bmi'])

    features = [
        age, hr, sys_, dia_, spo2, gluc, temp, chol, bmi,
        sys_ - dia_,
        (sys_ + 2 * dia_) / 3,
        hr / spo2 if spo2 != 0 else 0,
        temp - 98.6,
        int(sys_ >= 140),
        int(hr > 100),
        int(spo2 < 95),
        int(gluc > 126),
        int(chol > 200),
        int(bmi >= 30),
    ]
    arr = np.array(features).reshape(1, -1)
    return scaler.transform(arr)
