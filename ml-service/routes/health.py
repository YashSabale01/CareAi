"""Health check endpoint for CareAI ML service."""

from flask import Blueprint, jsonify
import time
import os

health_bp = Blueprint('health', __name__)
_start_time = time.time()


@health_bp.route('/health', methods=['GET'])
def health():
    saved_dir = os.path.join(os.path.dirname(__file__), '../models/saved')
    models_ready = os.path.exists(os.path.join(saved_dir, 'random_forest.joblib'))
    return jsonify({
        'status': 'OK',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'version': '1.0.0',
        'uptime_seconds': round(time.time() - _start_time, 2),
        'models_loaded': models_ready,
    })
