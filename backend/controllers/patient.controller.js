const Patient = require('../models/Patient');
const User = require('../models/User');
const logger = require('../config/logger');

exports.getAll = async (req, res, next) => {
  try {
    const filter = { isActive: true, deletedAt: null };
    if (req.user.role === 'doctor')    filter.assignedDoctorId    = req.user.userId;
    if (req.user.role === 'caretaker') filter.assignedCaretakerId = req.user.userId;
    const patients = await Patient.find(filter)
      .populate('userId', 'name email phone')
      .populate('assignedDoctorId', 'name email')
      .populate('assignedCaretakerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ patients, count: patients.length });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('assignedDoctorId', 'name email')
      .populate('assignedCaretakerId', 'name email');
    if (!patient || patient.deletedAt) return res.status(404).json({ error: 'Patient not found' });
    res.json({ patient });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { userId, age, gender, bloodGroup, chronicConditions, allergies, medications, emergencyContact, assignedDoctorId, assignedCaretakerId } = req.body;
    const patient = await Patient.create({ userId, age, gender, bloodGroup, chronicConditions, allergies, medications, emergencyContact, assignedDoctorId, assignedCaretakerId });
    logger.info(`Patient created: ${patient.patientId}`, { module: 'PATIENT' });
    res.status(201).json({ patient });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ patient });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false, deletedAt: new Date() }, { new: true });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deactivated' });
  } catch (err) { next(err); }
};
