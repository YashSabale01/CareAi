"""XGBoost model wrapper."""

import xgboost as xgb
from sklearn.model_selection import GridSearchCV


def build_xgboost(X_train, y_train, param_grid=None):
    if param_grid is None:
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [4, 6],
            'learning_rate': [0.05, 0.1],
        }
    base = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=3,
        random_state=42,
        eval_metric='mlogloss',
        n_jobs=-1,
    )
    gs = GridSearchCV(base, param_grid, cv=3, scoring='f1_weighted', n_jobs=-1, verbose=1)
    gs.fit(X_train, y_train)
    return gs.best_estimator_, gs.best_params_, gs.best_score_
