"""Feature engineering utilities for CareAI clinical risk pipeline."""

import numpy as np


def compute_pulse_pressure(systolic, diastolic):
    return systolic - diastolic


def compute_map(systolic, diastolic):
    return (systolic + 2 * diastolic) / 3


def compute_hr_spo2_ratio(heart_rate, spo2):
    return heart_rate / spo2 if spo2 != 0 else 0


def compute_temp_deviation_f(temperature_f, normal=98.6):
    return temperature_f - normal


def compute_flags(heart_rate, spo2, systolic, glucose, cholesterol, bmi):
    return {
        'hypertension_flag':    int(systolic >= 140),
        'tachycardia_flag':     int(heart_rate > 100),
        'hypoxia_flag':         int(spo2 < 95),
        'high_glucose_flag':    int(glucose > 126),
        'high_cholesterol_flag': int(cholesterol > 200),
        'obese_flag':           int(bmi >= 30),
    }
