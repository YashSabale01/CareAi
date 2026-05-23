const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  patientId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  predictionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
  vitalSnapshot: {
    age: Number, heartRate: Number, systolicBP: Number, diastolicBP: Number,
    spo2: Number, glucoseLevel: Number, temperature: Number,
    cholesterol: Number, bmi: Number,
  },
  riskLevel:         String,
  alertType:         { type: String, enum: ['Critical', 'Warning', 'Info'], default: 'Critical' },
  message:           { type: String, required: true },
  notifyDoctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notifyCaretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:            { type: String, enum: ['Active', 'Acknowledged', 'Resolved'], default: 'Active' },
  acknowledgedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt:    Date,
  resolvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:        Date,
  notificationsSent: {
    email: { type: Boolean, default: false },
    inApp: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
