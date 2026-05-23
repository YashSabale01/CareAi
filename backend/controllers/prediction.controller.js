// Predictions are READ-ONLY — auto-created by vitals.controller.submitVitals
const Prediction = require('../models/Prediction');

exports.getByPatient = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const [predictions, total] = await Promise.all([
      Prediction.find({ patientId: req.params.patientId })
        .populate('vitalRecordId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Prediction.countDocuments({ patientId: req.params.patientId }),
    ]);
    res.json({ predictions, total, page: parseInt(page) });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .populate('vitalRecordId')
      .populate('patientId');
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    res.json({ prediction });
  } catch (err) { next(err); }
};

// Doctor marks prediction as reviewed
exports.markReviewed = async (req, res, next) => {
  try {
    const prediction = await Prediction.findByIdAndUpdate(
      req.params.id,
      { reviewedByDoctor: true, reviewedAt: new Date() },
      { new: true }
    );
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    res.json({ prediction });
  } catch (err) { next(err); }
};
