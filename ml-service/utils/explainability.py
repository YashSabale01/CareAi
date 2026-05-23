"""SHAP-based explainability for CareAI predictions."""

import numpy as np


def get_shap_top_features(model, X, pred_idx, feature_names, top_n=3):
    """
    Returns top N most influential features using SHAP TreeExplainer.
    Falls back to feature importances if SHAP fails.
    """
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X)
        if isinstance(shap_vals, list):
            sv = shap_vals[pred_idx][0]
        else:
            sv = shap_vals[0]
        top_idx = np.argsort(np.abs(sv))[-top_n:][::-1]
        return {feature_names[i]: round(float(sv[i]), 4) for i in top_idx if i < len(feature_names)}
    except Exception:
        # Fallback: use model feature importances
        try:
            importances = model.feature_importances_
            top_idx = np.argsort(importances)[-top_n:][::-1]
            return {feature_names[i]: round(float(importances[i]), 4) for i in top_idx if i < len(feature_names)}
        except Exception:
            return {}
