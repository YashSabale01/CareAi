# CareAI — AI-Powered Healthcare Monitoring Platform

> Production-grade full-stack healthcare monitoring system with real-time AI disease prediction, alert dispatch, and care plan generation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CAREAI SYSTEM                        │
├──────────────┬──────────────────┬───────────────────────────┤
│   Frontend   │     Backend      │       ML Service          │
│  React + Vite│  Node/Express    │    Python Flask           │
│  Port: 3000  │  Port: 5000      │    Port: 5001             │
│              │                  │                           │
│  4 Role UIs  │  REST API        │  Random Forest + XGBoost  │
│  Recharts    │  Socket.IO       │  SHAP Explainability      │
│  TanStack Q  │  JWT + RBAC      │  50,000 record dataset    │
└──────┬───────┴────────┬─────────┴────────────┬──────────────┘
       │                │                       │
       └────────────────┴───────────────────────┘
                        │
               ┌────────▼────────┐
               │    MongoDB      │
               │   Port: 27017   │
               └─────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, TanStack Query, Socket.IO Client |
| Backend | Node.js, Express.js, Mongoose, Socket.IO, JWT, PDFKit |
| ML Service | Python, Flask, scikit-learn, XGBoost, SHAP, pandas |
| Database | MongoDB 6.0 |
| DevOps | Docker, Docker Compose |

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB 6.0+ (or Docker)
- npm / pip

---

## Quick Start

### Option 1 — Docker (Recommended)

```bash
git clone <repo-url> && cd careai

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ml-service/.env.example ml-service/.env

# Start all services
docker-compose up --build
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- ML Service: http://localhost:5001
- API Docs: http://localhost:5000/api/docs

### Option 2 — Local Development

```bash
# 1. Install & setup
bash scripts/setup.sh

# 2. Start MongoDB
mongod

# 3. Start ML Service
cd ml-service && python app.py

# 4. Start Backend
cd backend && npm run dev

# 5. Start Frontend
cd frontend && npm run dev

# 6. Seed database (optional)
cd backend && npm run seed
```

---

## Environment Variables

### `backend/.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/careai
JWT_SECRET=your_32_char_secret_here
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@careai.health
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
```

### `ml-service/.env`
```
ML_PORT=5001
FLASK_DEBUG=false
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=CareAI
```

---

## API Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, get JWT |
| GET | `/api/auth/me` | All | Current user |
| GET | `/api/patients` | Doctor/Admin | List patients |
| POST | `/api/patients` | Doctor/Admin | Create patient |
| POST | `/api/predictions/predict` | Doctor | **Core: vitals → AI prediction** |
| GET | `/api/predictions/patient/:id` | All | Patient predictions |
| GET | `/api/alerts` | Doctor/Admin | Active alerts |
| PUT | `/api/alerts/:id/resolve` | Doctor | Resolve alert |
| GET | `/api/careplans/patient/:id` | All | Patient care plans |
| POST | `/api/reports/generate` | Doctor/Admin | Generate PDF report |
| GET | `/api/analytics/overview` | Admin/Doctor | System KPIs |
| POST | `/api/chatbot/message` | All | AI chatbot |

Full OpenAPI 3.0 spec: `backend/swagger/swagger.yaml` or http://localhost:5000/api/docs

---

## ML Model Details

### Dataset
- **Records:** 50,000 patient vital sign records
- **Features:** Heart Rate, SpO2, Systolic BP, Diastolic BP, Body Temperature, Fall Detection
- **Engineered Features:** pulse_pressure, MAP, hr_spo2_ratio, temp_deviation, hypertension_flag, tachycardia_flag, hypoxia_flag
- **Target:** Predicted Disease (5 classes, balanced ~20% each)

### Models
| Model | Algorithm | Tuning |
|-------|-----------|--------|
| Primary | Random Forest | GridSearchCV (3-fold CV) |
| Secondary | XGBoost | GridSearchCV (3-fold CV) |

### Training
```bash
cd ml-service
python scripts/convert_dataset.py   # xlsx -> csv
python -m models.train              # trains both models, saves champion
```

### Prediction API
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"heart_rate":96,"spo2":92,"systolic_bp":130,"diastolic_bp":85,"temperature":37.2,"fall_detection":"No"}'
```

### Risk Level Rules
- **High** — Arrhythmia/Hypertension predicted, OR any vital alert triggered
- **Medium** — Diabetes/Asthma predicted, confidence ≥ 50%
- **Low** — Normal predicted, no alerts

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Doctor** | Add vitals, trigger predictions, manage patients, approve care plans, generate reports |
| **Patient** | View own vitals, predictions, care plan |
| **Caretaker** | Monitor assigned patients, view alerts |
| **Admin** | System analytics, user management |

### Demo Credentials (after seeding)
```
Admin:     admin@careai.health     / Admin@123
Doctor:    doctor@careai.health    / Doctor@123
Patient:   patient@careai.health   / Patient@123
Caretaker: caretaker@careai.health / Caretaker@123
```

---

## Real-Time Features (Socket.IO)

| Event | Direction | Trigger |
|-------|-----------|---------|
| `new_alert` | Server → Client | High/Medium risk detected |
| `new_prediction` | Server → Client | Prediction completed |
| `alert_resolved` | Server → Client | Doctor resolves alert |
| `emergency_detected` | Server → Client | Critical chatbot keyword |

---

## Running Tests

```bash
# Backend tests
cd backend && npm test

# ML service tests
cd ml-service && pytest tests/ -v
```

---

## Safety & Compliance

> **DISCLAIMER:** AI predictions are decision-support tools and do not replace professional clinical diagnosis.

- All prediction results display the SR-01 disclaimer
- JWT authentication on all protected routes
- RBAC enforced per role (doctor/patient/caretaker/admin)
- Rate limiting: 100 req/15min per IP
- Input validation against physiological ranges (SR-03)
- ML service failure handled with 3-attempt retry + 503 response (SR-05)
- Winston logging for all API access, errors, ML calls, alerts (SR-06)

---

## Team

| Name | Role |
|------|------|
| Yash Sabale | Project Lead & Backend |
| Arya Gandewar | ML Engineering |
| Laxman Adhikari | Frontend Development |
| Sanika Karande | Data Engineering |
| Om Kadam | DevOps & Docker |
| Abhay Maurya | QA & Testing |

---

## License

MIT License — see [LICENSE](LICENSE)

---

*CareAI SRS Reference: IEEE Std 830-1998. Version 1.0*
