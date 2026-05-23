const mongoose = require('mongoose');

const carePlanSchema = new mongoose.Schema({
  patientId:               { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:                { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  predictionId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
  riskLevel:               { type: String, enum: ['Low', 'Medium', 'High'] },
  predictedDisease:        String,
  dietaryGuidelines:       [String],
  activityRecommendations: [String],
  medications:             [{ name: String, dosage: String, frequency: String }],
  restrictions:            [String],
  followUpSchedule:        String,
  doctorNotes:             String,
  // 'Draft' = auto-generated, awaiting doctor approval
  status:           { type: String, enum: ['Draft', 'Approved', 'Archived'], default: 'Draft' },
  approvedAt:       Date,
  version:          { type: Number, default: 1 },
  previousVersions: [mongoose.Schema.Types.Mixed],
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CarePlan', carePlanSchema);
