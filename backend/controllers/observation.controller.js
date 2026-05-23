const Observation = require('../models/Observation');
const Patient     = require('../models/Patient');

// POST /api/observations — CARETAKER ONLY
exports.create = async (req, res, next) => {
  try {
    const caretakerId = req.user.userId;
    const { patientId, note, mood } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.assignedCaretakerId?.toString() !== caretakerId) {
      return res.status(403).json({ error: 'You are not assigned to this patient' });
    }
    const obs = await Observation.create({ patientId, caretakerId, note, mood });
    return res.status(201).json({ observation: obs });
  } catch (err) { next(err); }
};

exports.getByPatient = async (req, res, next) => {
  try {
    const observations = await Observation.find({ patientId: req.params.patientId })
      .sort({ observedAt: -1 })
      .populate('caretakerId', 'name');
    return res.json({ observations });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const obs = await Observation.findById(req.params.id);
    if (!obs) return res.status(404).json({ error: 'Observation not found' });
    if (obs.caretakerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own observations' });
    }
    await obs.deleteOne();
    return res.json({ message: 'Observation deleted' });
  } catch (err) { next(err); }
};
