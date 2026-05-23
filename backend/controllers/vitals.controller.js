const VitalRecord       = require('../models/VitalRecord');
const Patient           = require('../models/Patient');
const Prediction        = require('../models/Prediction');
const { callMLService } = require('../services/ml.service');
const { dispatchAlert } = require('../services/alert.service');
const { generateCarePlan } = require('../services/careplan.service');
const { VITAL_RANGES }  = require('../utils/thresholds');
const logger            = require('../config/logger');

const RANGE_LABELS = {
  age: 'Age', heartRate: 'Heart Rate', systolicBP: 'Systolic BP',
  diastolicBP: 'Diastolic BP', spo2: 'SpO2', glucoseLevel: 'Glucose Level',
  temperature: 'Temperature (°F)', cholesterol: 'Cholesterol', bmi: 'BMI',
};

function validateRanges(vitals) {
  return Object.entries(VITAL_RANGES).reduce((errs, [key, { min, max }]) => {
    const v = vitals[key];
    if (v === undefined || v === null) { errs.push(`${RANGE_LABELS[key]} is required`); return errs; }
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
    const {
      patientId, age, heartRate, systolicBP, diastolicBP,
      spo2, glucoseLevel, temperature, cholesterol, bmi, notes,
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.assignedCaretakerId?.toString() !== caretakerId) {
      return res.status(403).json({ error: 'You are not assigned to this patient' });
    }

    const vitals = { age, heartRate, systolicBP, diastolicBP, spo2, glucoseLevel, temperature, cholesterol, bmi };
    const rangeErrors = validateRanges(vitals);
    if (rangeErrors.length) return res.status(400).json({ error: 'Vital values out of physiological range', details: rangeErrors });

    const vitalRecord = await VitalRecord.create({
      patientId, submittedBy: caretakerId, submitterRole: 'caretaker',
      age, heartRate, systolicBP, diastolicBP, spo2,
      glucoseLevel, temperature, cholesterol, bmi,
      notes: notes || '',
    });
    logger.info(`VitalRecord ${vitalRecord._id} created for patient ${patientId}`, { module: 'VITALS' });

    let mlResult;
    try {
      mlResult = await callMLService({
        age, heart_rate: heartRate, systolic_bp: systolicBP,
        diastolic_bp: diastolicBP, spo2, glucose_level: glucoseLevel,
        temperature, cholesterol, bmi,
      });
    } catch (mlErr) {
      logger.error(`ML service error: ${mlErr.message}`, { module: 'VITALS' });
      return res.status(503).json({
        error: 'AI prediction service temporarily unavailable. Vitals saved. Please retry.',
        vitalRecordId: vitalRecord._id,
      });
    }

    const predictedDisease = mlResult.predicted_disease || 'Unknown';

    const a = mlResult.alerts || {};
    const toHighLowNormal  = (v) => ['High','Low','Normal'].includes(v)  ? v : (v ? 'High' : 'Normal');
    const toHighNormal     = (v) => ['High','Normal'].includes(v)        ? v : (v ? 'High' : 'Normal');
    const toLowNormal      = (v) => ['Low','Normal'].includes(v)         ? v : (v ? 'Low'  : 'Normal');
    const toBmiEnum        = (v) => ['Normal','Obese','Underweight'].includes(v) ? v : 'Normal';

    const prediction = await Prediction.create({
      patientId,
      vitalRecordId:      vitalRecord._id,
      riskLevel:          mlResult.risk_level,
      confidence:         mlResult.confidence,
      confidenceLabel:    mlResult.confidence_label,
      classProbabilities: new Map(Object.entries(mlResult.class_probabilities || {})),
      alerts: {
        heartRate:     toHighLowNormal(a.heart_rate),
        spo2:          toLowNormal(a.spo2),
        bloodPressure: toHighNormal(a.blood_pressure),
        temperature:   toHighLowNormal(a.temperature),
        glucose:       toHighLowNormal(a.glucose),
        cholesterol:   toHighNormal(a.cholesterol),
        bmi:           toBmiEnum(a.bmi),
      },
      shapValues: new Map(Object.entries(mlResult.shap_values || {})),
      modelUsed:  mlResult.model_used || 'random_forest',
    });

    await Patient.findByIdAndUpdate(patientId, { currentRiskLevel: mlResult.risk_level });

    const carePlan = await generateCarePlan({
      patientId,
      doctorId:         patient.assignedDoctorId,
      predictionId:     prediction._id,
      riskLevel:        mlResult.risk_level,
      predictedDisease,
    });

    let alertTriggered = false;
    if (mlResult.risk_level === 'High') {
      await dispatchAlert({
        patientId,
        predictionId:     prediction._id,
        riskLevel:        mlResult.risk_level,
        predictedDisease,
        prediction:       { confidence: mlResult.confidence },
        vitals:           { age, heartRate, systolicBP, diastolicBP, spo2, glucoseLevel, temperature, cholesterol, bmi },
      });
      alertTriggered = true;
    }

    if (global.io) {
      global.io.to(patient.assignedDoctorId?.toString()).emit('new_prediction', {
        patientId, riskLevel: mlResult.risk_level, alertTriggered,
      });
      global.io.to(caretakerId).emit('vitals_processed', {
        patientId, riskLevel: mlResult.risk_level, alertTriggered,
        message: `Vitals processed: ${mlResult.risk_level} risk`,
      });
    }

    return res.status(201).json({
      success: true,
      vitalRecord,
      prediction: {
        id:                 prediction._id,
        riskLevel:          mlResult.risk_level,
        predictedDisease,
        confidence:         mlResult.confidence,
        confidenceLabel:    mlResult.confidence_label,
        classProbabilities: mlResult.class_probabilities,
        alerts:             mlResult.alerts,
        shapValues:         mlResult.shap_values,
      },
      carePlan: { id: carePlan._id, status: carePlan.status, riskLevel: carePlan.riskLevel },
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
