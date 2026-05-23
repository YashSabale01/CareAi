"""
CareAI ML Microservice — Flask REST API
Endpoints:
  POST /api/predict        — predict disease + risk level
  POST /api/predict/batch  — batch predictions
  GET  /api/health         — health check
  GET  /api/models/info    — model metadata
"""
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=os.getenv('ALLOWED_ORIGINS', '*').split(','))

from routes.predict import predict_bp
from routes.health import health_bp

app.register_blueprint(predict_bp, url_prefix='/api')
app.register_blueprint(health_bp, url_prefix='/api')


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('ML_PORT', 5001))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    )
