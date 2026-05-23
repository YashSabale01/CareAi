const CarePlan = require('../models/CarePlan');
const Patient  = require('../models/Patient');
const logger   = require('../config/logger');

exports.getPatientCarePlan = async (req, res, next) => {
  try {
    const carePlan = await CarePlan.findOne({ patientId: req.params.patientId, isActive: true })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'name email')
      .populate('predictionId', 'predictedDisease riskLevel confidence');
    if (!carePlan) return res.status(404).json({ error: 'No active care plan found' });
    return res.json({ carePlan });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const carePlan = await CarePlan.findById(req.params.id)
      .populate('doctorId', 'name email')
      .populate('patientId')
      .populate('predictionId');
    if (!carePlan) return res.status(404).json({ error: 'Care plan not found' });
    return res.json({ carePlan });
  } catch (err) { next(err); }
};

exports.updateCarePlan = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const carePlan = await CarePlan.findById(req.params.id);
    if (!carePlan) return res.status(404).json({ error: 'Care plan not found' });

    const patient = await Patient.findById(carePlan.patientId);
    if (patient.assignedDoctorId?.toString() !== doctorId) {
      return res.status(403).json({ error: 'You are not the assigned doctor for this patient' });
    }

    // Save current version to history
    const snapshot = carePlan.toObject();
    const previousVersions = [...(carePlan.previousVersions || []), {
      version: carePlan.version, updatedAt: new Date(),
      content: {
        dietaryGuidelines:       snapshot.dietaryGuidelines,
        activityRecommendations: snapshot.activityRecommendations,
        medications:             snapshot.medications,
        restrictions:            snapshot.restrictions,
        followUpSchedule:        snapshot.followUpSchedule,
        doctorNotes:             snapshot.doctorNotes,
      },
    }];

    const { dietaryGuidelines, activityRecommendations, medications, restrictions, followUpSchedule, doctorNotes } = req.body;
    const updated = await CarePlan.findByIdAndUpdate(req.params.id, {
      dietaryGuidelines, activityRecommendations, medications,
      restrictions, followUpSchedule, doctorNotes,
      version: carePlan.version + 1,
      previousVersions,
      status: 'Draft', // reset to draft on edit
    }, { new: true });

    logger.info(`CarePlan ${req.params.id} updated by doctor ${doctorId} (v${updated.version})`, { module: 'CAREPLAN' });
    return res.json({ carePlan: updated });
  } catch (err) { next(err); }
};

exports.approveCarePlan = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const carePlan = await CarePlan.findById(req.params.id);
    if (!carePlan) return res.status(404).json({ error: 'Care plan not found' });

    const patient = await Patient.findById(carePlan.patientId).populate('userId', '_id');
    if (patient.assignedDoctorId?.toString() !== doctorId) {
      return res.status(403).json({ error: 'Only the assigned doctor can approve this care plan' });
    }

    const approved = await CarePlan.findByIdAndUpdate(req.params.id, {
      status: 'Approved', approvedAt: new Date(),
    }, { new: true });

    if (global.io) {
      const payload = { carePlanId: req.params.id, patientId: carePlan.patientId };
      if (patient.userId?._id) global.io.to(patient.userId._id.toString()).emit('careplan_approved', payload);
      if (patient.assignedCaretakerId) global.io.to(patient.assignedCaretakerId.toString()).emit('careplan_approved', payload);
    }

    logger.info(`CarePlan ${req.params.id} APPROVED by doctor ${doctorId}`, { module: 'CAREPLAN' });
    return res.json({ success: true, carePlan: approved });
  } catch (err) { next(err); }
};
