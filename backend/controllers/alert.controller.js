const Alert = require('../models/Alert');

exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'doctor') filter.notifyDoctorId = req.user.userId;
    const { status, limit = 50, page = 1 } = req.query;
    if (status) filter.status = status;
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .populate('patientId', 'patientId userId')
        .populate('notifyDoctorId', 'name email')
        .populate('notifyCaretakerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Alert.countDocuments(filter),
    ]);
    res.json({ alerts, total });
  } catch (err) { next(err); }
};

exports.getByPatient = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ patientId: req.params.patientId })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ alerts });
  } catch (err) { next(err); }
};

// DOCTOR ONLY
exports.acknowledge = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'Acknowledged', acknowledgedBy: req.user.userId, acknowledgedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    if (global.io) global.io.to(alert.notifyCaretakerId?.toString()).emit('alert_resolved', { alertId: alert._id, status: 'Acknowledged' });
    res.json({ alert });
  } catch (err) { next(err); }
};

// DOCTOR ONLY
exports.resolve = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved', resolvedBy: req.user.userId, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    if (global.io) global.io.to(alert.notifyCaretakerId?.toString()).emit('alert_resolved', { alertId: alert._id, status: 'Resolved', resolvedAt: alert.resolvedAt });
    res.json({ alert });
  } catch (err) { next(err); }
};
