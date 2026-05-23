const mongoose = require('mongoose');

const vitalRecordSchema = new mongoose.Schema({
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  submittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // caretaker
  submitterRole: { type: String, enum: ['caretaker', 'admin'], default: 'caretaker' },
  heartRate:     { type: Number, required: true, min: 30, max: 300 },
  spo2:          { type: Number, required: true, min: 70, max: 100 },
  systolicBP:    { type: Number, required: true, min: 70, max: 250 },
  diastolicBP:   { type: Number, required: true, min: 40, max: 200 },
  temperature:   { type: Number, required: true, min: 34.0, max: 42.0 },
  fallDetection: { type: Boolean, default: false },
  notes:         { type: String, maxlength: 1000 },
  recordedAt:    { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('VitalRecord', vitalRecordSchema);
