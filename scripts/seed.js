require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careai';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  await Promise.all(collections.map(c => db.collection(c.name).deleteMany({})));
  console.log('Database cleared');

  const hash = (p) => bcrypt.hash(p, 12);

  // ── Models ──────────────────────────────────────────────────────────────────
  const UserSchema = new mongoose.Schema({
    name: String, email: { type: String, unique: true }, password: String,
    role: String, phone: String, isActive: { type: Boolean, default: true },
    assignedPatients: [mongoose.Schema.Types.ObjectId],
    monitoredPatients: [mongoose.Schema.Types.ObjectId],
  }, { timestamps: true });

  const PatientSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    patientId: String, age: Number, gender: String, bloodGroup: String,
    chronicConditions: [String],
    assignedDoctorId:    mongoose.Schema.Types.ObjectId,
    assignedCaretakerId: mongoose.Schema.Types.ObjectId,
    currentRiskLevel: { type: String, default: 'Unknown' },
    isActive: { type: Boolean, default: true },
  }, { timestamps: true });

  const VitalSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    submittedBy: mongoose.Schema.Types.ObjectId,   // caretaker
    submitterRole: { type: String, default: 'caretaker' },
    heartRate: Number, spo2: Number, systolicBP: Number,
    diastolicBP: Number, temperature: Number, fallDetection: Boolean,
    recordedAt: { type: Date, default: Date.now },
  }, { timestamps: true });

  const PredictionSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    vitalRecordId: mongoose.Schema.Types.ObjectId,
    predictedDisease: String, riskLevel: String,
    confidence: Number, modelUsed: String,
    reviewedByDoctor: { type: Boolean, default: false },
  }, { timestamps: true });

  const AlertSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    predictionId: mongoose.Schema.Types.ObjectId,
    notifyDoctorId:    mongoose.Schema.Types.ObjectId,
    notifyCaretakerId: mongoose.Schema.Types.ObjectId,
    alertType: String, message: String,
    status: { type: String, default: 'Active' },
    notificationsSent: { email: Boolean, inApp: Boolean },
  }, { timestamps: true });

  const CarePlanSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    doctorId:  mongoose.Schema.Types.ObjectId,
    predictionId: mongoose.Schema.Types.ObjectId,
    riskLevel: String, predictedDisease: String,
    dietaryGuidelines: [String], activityRecommendations: [String],
    medications: [{ name: String, dosage: String, frequency: String }],
    restrictions: [String], followUpSchedule: String, doctorNotes: String,
    status: { type: String, default: 'Draft' },  // Draft | Approved | Archived
    approvedAt: Date,
    version: { type: Number, default: 1 },
    previousVersions: [Object],
    isActive: { type: Boolean, default: true },
  }, { timestamps: true });

  const ObservationSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    caretakerId: mongoose.Schema.Types.ObjectId,
    note: String, mood: String,
    observedAt: { type: Date, default: Date.now },
  }, { timestamps: true });

  const User        = mongoose.model('User',        UserSchema);
  const Patient     = mongoose.model('Patient',     PatientSchema);
  const Vital       = mongoose.model('VitalRecord', VitalSchema);
  const Prediction  = mongoose.model('Prediction',  PredictionSchema);
  const Alert       = mongoose.model('Alert',       AlertSchema);
  const CarePlan    = mongoose.model('CarePlan',    CarePlanSchema);
  const Observation = mongoose.model('Observation', ObservationSchema);

  // ── Users ────────────────────────────────────────────────────────────────────
  const [admin, doctor, caretaker, patUser1, patUser2] = await User.insertMany([
    { name: 'Admin User',       email: 'admin@careai.health',     password: await hash('Admin@123'),     role: 'admin' },
    { name: 'Dr. Sarah Johnson',email: 'doctor@careai.health',    password: await hash('Doctor@123'),    role: 'doctor' },
    { name: 'Alex Caretaker',   email: 'caretaker@careai.health', password: await hash('Caretaker@123'), role: 'caretaker' },
    { name: 'John Patient',     email: 'patient1@careai.health',  password: await hash('Patient@123'),   role: 'patient' },
    { name: 'Alice Smith',      email: 'patient2@careai.health',  password: await hash('Patient@123'),   role: 'patient' },
  ]);

  // ── Patient profiles ─────────────────────────────────────────────────────────
  const [pat1, pat2] = await Patient.insertMany([
    {
      userId: patUser1._id, patientId: 'PAT-000001',
      age: 52, gender: 'Male', bloodGroup: 'A+',
      chronicConditions: ['Hypertension'],
      assignedDoctorId:    doctor._id,
      assignedCaretakerId: caretaker._id,
      currentRiskLevel: 'High',
    },
    {
      userId: patUser2._id, patientId: 'PAT-000002',
      age: 38, gender: 'Female', bloodGroup: 'B+',
      chronicConditions: ['Diabetes Mellitus'],
      assignedDoctorId:    doctor._id,
      assignedCaretakerId: caretaker._id,
      currentRiskLevel: 'Medium',
    },
  ]);

  // ── Update doctor + caretaker assignment lists ────────────────────────────────
  await User.findByIdAndUpdate(doctor._id,    { assignedPatients:  [pat1._id, pat2._id] });
  await User.findByIdAndUpdate(caretaker._id, { monitoredPatients: [pat1._id, pat2._id] });

  // ── Vitals for Patient 1 (submitted by caretaker) ────────────────────────────
  const vitals1 = await Vital.insertMany([
    { patientId: pat1._id, submittedBy: caretaker._id, heartRate: 112, spo2: 91, systolicBP: 165, diastolicBP: 98,  temperature: 37.8, fallDetection: false, recordedAt: new Date(Date.now() - 4 * 86400000) },
    { patientId: pat1._id, submittedBy: caretaker._id, heartRate: 105, spo2: 93, systolicBP: 158, diastolicBP: 95,  temperature: 37.5, fallDetection: false, recordedAt: new Date(Date.now() - 3 * 86400000) },
    { patientId: pat1._id, submittedBy: caretaker._id, heartRate: 98,  spo2: 94, systolicBP: 152, diastolicBP: 92,  temperature: 37.2, fallDetection: false, recordedAt: new Date(Date.now() - 2 * 86400000) },
    { patientId: pat1._id, submittedBy: caretaker._id, heartRate: 95,  spo2: 95, systolicBP: 148, diastolicBP: 90,  temperature: 37.0, fallDetection: false, recordedAt: new Date(Date.now() - 1 * 86400000) },
    { patientId: pat1._id, submittedBy: caretaker._id, heartRate: 90,  spo2: 96, systolicBP: 142, diastolicBP: 88,  temperature: 36.8, fallDetection: false, recordedAt: new Date() },
  ]);

  // ── Vitals for Patient 2 (submitted by caretaker) ────────────────────────────
  const vitals2 = await Vital.insertMany([
    { patientId: pat2._id, submittedBy: caretaker._id, heartRate: 88, spo2: 97, systolicBP: 128, diastolicBP: 82, temperature: 37.1, fallDetection: false, recordedAt: new Date(Date.now() - 2 * 86400000) },
    { patientId: pat2._id, submittedBy: caretaker._id, heartRate: 85, spo2: 97, systolicBP: 125, diastolicBP: 80, temperature: 36.9, fallDetection: false, recordedAt: new Date(Date.now() - 1 * 86400000) },
    { patientId: pat2._id, submittedBy: caretaker._id, heartRate: 82, spo2: 98, systolicBP: 122, diastolicBP: 78, temperature: 36.8, fallDetection: false, recordedAt: new Date() },
  ]);

  // ── Predictions ───────────────────────────────────────────────────────────────
  const pred1 = await Prediction.create({
    patientId: pat1._id, vitalRecordId: vitals1[4]._id,
    predictedDisease: 'Hypertension', riskLevel: 'High',
    confidence: 0.87, modelUsed: 'random_forest',
  });
  const pred2 = await Prediction.create({
    patientId: pat2._id, vitalRecordId: vitals2[2]._id,
    predictedDisease: 'Diabetes Mellitus', riskLevel: 'Medium',
    confidence: 0.79, modelUsed: 'random_forest',
  });

  // ── Alert for Patient 1 (High Risk) ──────────────────────────────────────────
  await Alert.create({
    patientId: pat1._id, predictionId: pred1._id,
    notifyDoctorId:    doctor._id,
    notifyCaretakerId: caretaker._id,
    alertType: 'Critical',
    message: 'HIGH RISK ALERT: Patient predicted with Hypertension. HR=90bpm, SpO2=96%, BP=142/88mmHg, Temp=36.8°C',
    status: 'Active',
    notificationsSent: { email: true, inApp: true },
  });

  // ── Care Plans ────────────────────────────────────────────────────────────────
  // Patient 1 — Draft (awaiting doctor approval)
  await CarePlan.create({
    patientId: pat1._id, doctorId: doctor._id, predictionId: pred1._id,
    riskLevel: 'High', predictedDisease: 'Hypertension',
    dietaryGuidelines: ['DASH diet — low sodium (<2g/day)', 'Increase potassium-rich foods', 'Reduce saturated fats', 'Limit alcohol'],
    activityRecommendations: ['Aerobic exercise 30 min/5 days per week', 'Avoid heavy lifting', 'Yoga and meditation'],
    restrictions: ['Salt/sodium-rich foods', 'Processed meats', 'Heavy alcohol'],
    followUpSchedule: 'Every 1 week',
    status: 'Draft', isActive: true, version: 1,
  });

  // Patient 2 — Approved
  await CarePlan.create({
    patientId: pat2._id, doctorId: doctor._id, predictionId: pred2._id,
    riskLevel: 'Medium', predictedDisease: 'Diabetes Mellitus',
    dietaryGuidelines: ['Low glycemic index foods', 'Limit refined carbohydrates', 'Increase fiber intake', 'Control portion sizes'],
    activityRecommendations: ['30 min brisk walking daily', 'Low-impact aerobics', 'Resistance training 2x/week'],
    restrictions: ['Sugary snacks', 'White bread', 'Fried foods'],
    followUpSchedule: 'Every 4 weeks',
    status: 'Approved', approvedAt: new Date(), isActive: true, version: 1,
  });

  // ── Observation note from caretaker ──────────────────────────────────────────
  await Observation.create({
    patientId: pat1._id, caretakerId: caretaker._id,
    note: 'Patient reported mild headache this morning. BP was elevated. Reminded to take medication.',
    mood: 'Concerning',
  });

  console.log('\n✅ Seed complete! Corrected role workflow seeded.\n');
  console.log('┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│  Role        │ Email                      │ Password      │ Action   │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  console.log('│  Admin       │ admin@careai.health         │ Admin@123     │ Assign doctors/caretakers │');
  console.log('│  Doctor      │ doctor@careai.health        │ Doctor@123    │ Review analytics, approve care plans │');
  console.log('│  Caretaker   │ caretaker@careai.health     │ Caretaker@123 │ Enter patient vitals │');
  console.log('│  Patient 1   │ patient1@careai.health      │ Patient@123   │ View health status │');
  console.log('│  Patient 2   │ patient2@careai.health      │ Patient@123   │ View health status │');
  console.log('└─────────────────────────────────────────────────────────────────────┘');
  console.log('\nWorkflow: Admin assigns → Caretaker enters vitals → AI predicts → Doctor approves care plan → Patient views\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
