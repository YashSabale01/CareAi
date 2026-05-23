const User    = require('../models/User');
const Patient = require('../models/Patient');
const logger  = require('../config/logger');

exports.listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users, count: users.length });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password, role, phone });
    logger.info(`Admin created user: ${email} (${role})`, { module: 'ADMIN' });
    res.status(201).json({ user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, phone, isActive }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deactivated' });
  } catch (err) { next(err); }
};

// POST /api/admin/assign/doctor — { patientId, doctorId }
exports.assignDoctor = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.body;
    const [patient, doctor] = await Promise.all([
      Patient.findById(patientId),
      User.findById(doctorId),
    ]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!doctor || doctor.role !== 'doctor') return res.status(404).json({ error: 'Doctor not found' });

    // Remove patient from previous doctor's list
    if (patient.assignedDoctorId) {
      await User.findByIdAndUpdate(patient.assignedDoctorId, { $pull: { assignedPatients: patient._id } });
    }

    await Promise.all([
      Patient.findByIdAndUpdate(patientId, { assignedDoctorId: doctorId }),
      User.findByIdAndUpdate(doctorId, { $addToSet: { assignedPatients: patient._id } }),
    ]);

    logger.info(`Doctor ${doctorId} assigned to patient ${patientId}`, { module: 'ADMIN' });
    res.json({ message: 'Doctor assigned successfully' });
  } catch (err) { next(err); }
};

// POST /api/admin/assign/caretaker — { patientId, caretakerId }
exports.assignCaretaker = async (req, res, next) => {
  try {
    const { patientId, caretakerId } = req.body;
    const [patient, caretaker] = await Promise.all([
      Patient.findById(patientId),
      User.findById(caretakerId),
    ]);
    if (!patient)   return res.status(404).json({ error: 'Patient not found' });
    if (!caretaker || caretaker.role !== 'caretaker') return res.status(404).json({ error: 'Caretaker not found' });

    if (patient.assignedCaretakerId) {
      await User.findByIdAndUpdate(patient.assignedCaretakerId, { $pull: { monitoredPatients: patient._id } });
    }

    await Promise.all([
      Patient.findByIdAndUpdate(patientId, { assignedCaretakerId: caretakerId }),
      User.findByIdAndUpdate(caretakerId, { $addToSet: { monitoredPatients: patient._id } }),
    ]);

    logger.info(`Caretaker ${caretakerId} assigned to patient ${patientId}`, { module: 'ADMIN' });
    res.json({ message: 'Caretaker assigned successfully' });
  } catch (err) { next(err); }
};
