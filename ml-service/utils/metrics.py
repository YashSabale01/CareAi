"""Metrics utilities for CareAI ML service."""

import numpy as np


def compute_confidence_band(proba):
    """Returns confidence level description based on max probability."""
    max_p = float(np.max(proba))
    if max_p >= 0.80:
        return 'High Confidence'
    elif max_p >= 0.60:
        return 'Medium Confidence'
    return 'Low Confidence'


def format_class_probabilities(classes, proba):
    return {cls: round(float(p), 4) for cls, p in zip(classes, proba)}
