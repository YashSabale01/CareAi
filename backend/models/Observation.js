const mongoose = require('mongoose');

const observationSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  caretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note:        { type: String, required: true, maxlength: 2000 },
  mood:        { type: String, enum: ['Good', 'Stable', 'Concerning', 'Critical'], default: 'Stable' },
  observedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Observation', observationSchema);
