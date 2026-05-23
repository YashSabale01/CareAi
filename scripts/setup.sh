#!/bin/bash
set -e
echo "Setting up CareAI..."

# Backend
cd backend && cp .env.example .env && npm install && cd ..

# ML Service
cd ml-service && cp .env.example .env
pip install -r requirements.txt
python ../scripts/convert_dataset.py
python -m models.train
cd ..

# Frontend
cd frontend && cp .env.example .env && npm install && cd ..

echo "Setup complete!"
echo "Start with: docker-compose up"
echo "Or run individually:"
echo "  Backend:    cd backend && npm run dev"
echo "  ML Service: cd ml-service && python app.py"
echo "  Frontend:   cd frontend && npm run dev"
echo "Seed database: cd backend && npm run seed"
