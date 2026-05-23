const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  vitalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'VitalRecord', required: true },
  predictedDisease: {
    type: String,
    enum: ['Diabetes Mellitus', 'Asthma', 'Normal', 'Arrhythmia', 'Hypertension'],
  },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  confidence: { type: Number, min: 0, max: 1 },
  classProbabilities: { type: Map, of: Number },
  alerts: {
    heartRate:     { type: String, enum: ['Normal', 'High', 'Low'] },
    spo2:          { type: String, enum: ['Normal', 'Low'] },
    bloodPressure: { type: String, enum: ['Normal', 'High'] },
    temperature:   { type: String, enum: ['Normal', 'Abnormal'] },
  },
  confidenceLabel: { type: String },
  shapValues: { type: Map, of: Number },
  modelUsed: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
