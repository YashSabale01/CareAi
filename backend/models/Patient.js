const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  patientId:           { type: String, unique: true },
  age:                 { type: Number, min: 0, max: 150 },
  gender:              { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup:          { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  chronicConditions:   [String],
  allergies:           [String],
  medications:         [String],
  emergencyContact:    { name: String, phone: String, relationship: String },
  assignedDoctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedCaretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentRiskLevel:    { type: String, enum: ['Low', 'Medium', 'High', 'Unknown'], default: 'Unknown' },
  isActive:            { type: Boolean, default: true },
  deletedAt:           Date,
}, { timestamps: true });

patientSchema.pre('save', function (next) {
  if (!this.patientId) {
    this.patientId = 'PAT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
