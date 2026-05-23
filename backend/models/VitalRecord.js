const mongoose = require('mongoose');

const vitalRecordSchema = new mongoose.Schema({
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  submittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submitterRole: { type: String, enum: ['caretaker', 'admin'], default: 'caretaker' },

  // Core vitals
  age:          { type: Number, required: true, min: 0,   max: 120 },
  heartRate:    { type: Number, required: true, min: 30,  max: 250 },
  systolicBP:   { type: Number, required: true, min: 70,  max: 250 },
  diastolicBP:  { type: Number, required: true, min: 40,  max: 150 },
  spo2:         { type: Number, required: true, min: 80,  max: 100 },
  glucoseLevel: { type: Number, required: true, min: 40,  max: 500 },
  temperature:  { type: Number, required: true, min: 95.0, max: 107.0 }, // °F
  cholesterol:  { type: Number, required: true, min: 100, max: 400 },
  bmi:          { type: Number, required: true, min: 10,  max: 60 },

  notes:      { type: String, maxlength: 1000 },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('VitalRecord', vitalRecordSchema);
