"""Model evaluation utilities."""

from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    classification_report, confusion_matrix
)
import numpy as np


def full_evaluation(model, X_test, y_test, class_names):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'f1_weighted': f1_score(y_test, y_pred, average='weighted'),
        'f1_macro': f1_score(y_test, y_pred, average='macro'),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
        'classification_report': classification_report(
            y_test, y_pred, target_names=class_names, output_dict=True
        ),
    }
    try:
        metrics['auc_roc'] = roc_auc_score(
            y_test, y_prob, multi_class='ovr', average='weighted'
        )
    except Exception:
        metrics['auc_roc'] = None
    return metrics
