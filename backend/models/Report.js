const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, enum: ['Full', 'Vitals', 'Predictions', 'CarePlan'], default: 'Full' },
  filePath: { type: String },
  fileSize: { type: Number },
  includesVitals: { type: Boolean, default: true },
  includesPredictions: { type: Boolean, default: true },
  includesCarePlan: { type: Boolean, default: true },
  includesAlerts: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
