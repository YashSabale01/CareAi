const VitalRecord     = require('../models/VitalRecord');
const Patient         = require('../models/Patient');
const Prediction      = require('../models/Prediction');
const { callMLService } = require('../services/ml.service');
const { dispatchAlert } = require('../services/alert.service');
const { generateCarePlan } = require('../services/careplan.service');
const { VITAL_RANGES } = require('../utils/thresholds');
const logger          = require('../config/logger');

const RANGE_LABELS = {
  heartRate: 'Heart Rate', spo2: 'SpO2',
  systolicBP: 'Systolic BP', diastolicBP: 'Diastolic BP', temperature: 'Temperature',
};

function validateRanges(vitals) {
  return Object.entries(VITAL_RANGES).reduce((errs, [key, { min, max }]) => {
    const v = vitals[key];
    if (v < min || v > max) errs.push(`${RANGE_LABELS[key]} ${v} outside valid range [${min}–${max}]`);
    return errs;
  }, []);
}

async function verifyPatientAccess(user, patient) {
  if (user.role === 'admin') return;
  if (user.role === 'doctor'    && patient.assignedDoctorId?.toString()    !== user.userId) throw Object.assign(new Error('Access denied'), { status: 403 });
  if (user.role === 'caretaker' && patient.assignedCaretakerId?.toString() !== user.userId) throw Object.assign(new Error('Access denied'), { status: 403 });
  if (user.role === 'patient'   && patient.userId?.toString()              !== user.userId) throw Object.assign(new Error('Access denied'), { status: 403 });
}

// POST /api/vitals/submit — CARETAKER ONLY
exports.submitVitals = async (req, res, next) => {
  try {
    const caretakerId = req.user.userId;
    const { patientId, heartRate, spo2, systolicBP, diastolicBP, temperature, fallDetection, notes } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.assignedCaretakerId?.toString() !== caretakerId) {
      return res.status(403).json({ error: 'You are not assigned to this patient' });
    }

    const rangeErrors = validateRanges({ heartRate, spo2, systolicBP, diastolicBP, temperature });
    if (rangeErrors.length) return res.status(400).json({ error: 'Vital values out of physiological range', details: rangeErrors });

    const vitalRecord = await VitalRecord.create({
      patientId, submittedBy: caretakerId, submitterRole: 'caretaker',
      heartRate, spo2, systolicBP, diastolicBP, temperature,
      fallDetection: fallDetection || false, notes: notes || '',
    });
    logger.info(`VitalRecord ${vitalRecord._id} created for patient ${patientId} by caretaker ${caretakerId}`, { module: 'VITALS' });

    let mlResult;
    try {
      mlResult = await callMLService({
        heart_rate: heartRate, spo2, systolic_bp: systolicBP,
        diastolic_bp: diastolicBP, temperature,
        fall_detection: fallDetection ? 'Yes' : 'No',
      });
    } catch (mlErr) {
      logger.error(`ML service error: ${mlErr.message}`, { module: 'VITALS' });
      return res.status(503).json({
        error: 'AI prediction service temporarily unavailable. Vitals saved. Please retry.',
        vitalRecordId: vitalRecord._id,
      });
    }

    const prediction = await Prediction.create({
      patientId,
      vitalRecordId: vitalRecord._id,
      predictedDisease:   mlResult.predicted_disease,
      riskLevel:          mlResult.risk_level,
      confidence:         mlResult.confidence,
      confidenceLabel:    mlResult.confidence_label,
      classProbabilities: new Map(Object.entries(mlResult.class_probabilities || {})),
      alerts: {
        heartRate:     mlResult.alerts?.heart_rate     || 'Normal',
        spo2:          mlResult.alerts?.spo2           || 'Normal',
        bloodPressure: mlResult.alerts?.blood_pressure || 'Normal',
        temperature:   mlResult.alerts?.temperature    || 'Normal',
      },
      shapValues: new Map(Object.entries(mlResult.shap_values || {})),
      modelUsed:  mlResult.model_used || 'random_forest',
    });

    await Patient.findByIdAndUpdate(patientId, { currentRiskLevel: mlResult.risk_level });

    const carePlan = await generateCarePlan({
      patientId,
      doctorId:         patient.assignedDoctorId,
      predictionId:     prediction._id,
      predictedDisease: mlResult.predicted_disease,
      riskLevel:        mlResult.risk_level,
    });

    let alertTriggered = false;
    if (mlResult.risk_level === 'High') {
      await dispatchAlert({
        patientId,
        predictionId: prediction._id,
        riskLevel:    mlResult.risk_level,
        prediction:   { predictedDisease: mlResult.predicted_disease, confidence: mlResult.confidence },
        vitals:       { heartRate, spo2, systolicBP, diastolicBP, temperature, fallDetection },
      });
      alertTriggered = true;
    }

    if (global.io) {
      global.io.to(patient.assignedDoctorId?.toString()).emit('new_prediction', {
        patientId, predictedDisease: mlResult.predicted_disease,
        riskLevel: mlResult.risk_level, alertTriggered,
      });
      global.io.to(caretakerId).emit('vitals_processed', {
        patientId, riskLevel: mlResult.risk_level, alertTriggered,
        message: `Vitals processed: ${mlResult.predicted_disease} (${mlResult.risk_level} risk)`,
      });
    }

    return res.status(201).json({
      success: true,
      vitalRecord,
      prediction: {
        id: prediction._id,
        predictedDisease:   mlResult.predicted_disease,
        riskLevel:          mlResult.risk_level,
        confidence:         mlResult.confidence,
        confidenceLabel:    mlResult.confidence_label,
        classProbabilities: mlResult.class_probabilities,
        alerts:             mlResult.alerts,
        shapValues:         mlResult.shap_values,
      },
      carePlan: { id: carePlan._id, status: carePlan.status, predictedDisease: carePlan.predictedDisease, riskLevel: carePlan.riskLevel },
      alertTriggered,
    });
  } catch (err) { next(err); }
};

exports.getByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    await verifyPatientAccess(req.user, patient);
    const [vitals, total] = await Promise.all([
      VitalRecord.find({ patientId }).sort({ recordedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('submittedBy', 'name role'),
      VitalRecord.countDocuments({ patientId }),
    ]);
    return res.json({ vitals, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const vital = await VitalRecord.findById(req.params.id).populate('patientId').populate('submittedBy', 'name role email');
    if (!vital) return res.status(404).json({ error: 'Vital record not found' });
    return res.json({ vital });
  } catch (err) { next(err); }
};
