"""Feature engineering utilities for CareAI ML pipeline."""

import numpy as np


def compute_pulse_pressure(systolic, diastolic):
    return systolic - diastolic


def compute_map(systolic, diastolic):
    """Mean Arterial Pressure."""
    return (systolic + 2 * diastolic) / 3


def compute_hr_spo2_ratio(heart_rate, spo2):
    return heart_rate / spo2 if spo2 != 0 else 0


def compute_temp_deviation(temperature, normal=37.0):
    return temperature - normal


def compute_flags(heart_rate, spo2, systolic):
    return {
        'hypertension_flag': int(systolic >= 140),
        'tachycardia_flag': int(heart_rate > 100),
        'hypoxia_flag': int(spo2 < 90),
    }
