"""Random Forest model wrapper."""

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV


def build_random_forest(X_train, y_train, param_grid=None):
    if param_grid is None:
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [None, 15, 25],
            'min_samples_split': [2, 5],
        }
    base = RandomForestClassifier(random_state=42, n_jobs=-1, class_weight='balanced')
    gs = GridSearchCV(base, param_grid, cv=3, scoring='f1_weighted', n_jobs=-1, verbose=1)
    gs.fit(X_train, y_train)
    return gs.best_estimator_, gs.best_params_, gs.best_score_
