const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

let token, patientId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/careai_test');

  // Register doctor
  const authRes = await request(app).post('/api/auth/register').send({
    name: 'Test Doctor', email: 'pred_doc@careai.health', password: 'Test@1234', role: 'doctor',
  });
  token = authRes.body.token;
  const doctorId = authRes.body.user._id;

  // Register patient user
  const patRes = await request(app).post('/api/auth/register').send({
    name: 'Test Patient', email: 'pred_pat@careai.health', password: 'Test@1234', role: 'patient',
  });

  // Create patient profile
  const cpRes = await request(app).post('/api/patients')
    .set('Authorization', `Bearer ${token}`)
    .send({ userId: patRes.body.user._id, age: 45, gender: 'Male', assignedDoctorId: doctorId });
  patientId = cpRes.body.patient?._id;
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

const validVitals = { heartRate: 96, spo2: 92, systolicBP: 130, diastolicBP: 85, temperature: 37.2, fallDetection: false };

describe('Prediction API', () => {
  test('POST /api/predictions/predict — valid vitals returns prediction', async () => {
    if (!patientId) return;
    const res = await request(app).post('/api/predictions/predict')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, ...validVitals });
    expect([201, 503]).toContain(res.status); // 503 if ML service not running
    if (res.status === 201) {
      expect(res.body.prediction).toBeDefined();
      expect(res.body.prediction.riskLevel).toMatch(/Low|Medium|High/);
      expect(res.body.carePlan).toBeDefined();
    }
  });

  test('POST /api/predictions/predict — out-of-range heartRate returns 400', async () => {
    if (!patientId) return;
    const res = await request(app).post('/api/predictions/predict')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, ...validVitals, heartRate: 5 });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  test('POST /api/predictions/predict — missing field returns 400', async () => {
    if (!patientId) return;
    const { heartRate, ...incomplete } = validVitals;
    const res = await request(app).post('/api/predictions/predict')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, ...incomplete });
    expect(res.status).toBe(400);
  });

  test('POST /api/predictions/predict — patient role forbidden', async () => {
    const patAuth = await request(app).post('/api/auth/login').send({ email: 'pred_pat@careai.health', password: 'Test@1234' });
    const res = await request(app).post('/api/predictions/predict')
      .set('Authorization', `Bearer ${patAuth.body.token}`)
      .send({ patientId, ...validVitals });
    expect(res.status).toBe(403);
  });
});
