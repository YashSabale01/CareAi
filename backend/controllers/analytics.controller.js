const Patient    = require('../models/Patient');
const Prediction = require('../models/Prediction');
const Alert      = require('../models/Alert');
const User       = require('../models/User');
const VitalRecord = require('../models/VitalRecord');
const CarePlan   = require('../models/CarePlan');

// ADMIN ONLY — system-wide stats
exports.overview = async (req, res, next) => {
  try {
    const [totalUsers, totalPatients, activeAlerts, todayPredictions] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Patient.countDocuments({ isActive: true }),
      Alert.countDocuments({ status: 'Active' }),
      Prediction.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);
    res.json({ totalUsers, totalPatients, activeAlerts, todayPredictions });
  } catch (err) { next(err); }
};

exports.riskDistribution = async (req, res, next) => {
  try {
    const data = await Prediction.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ distribution: data });
  } catch (err) { next(err); }
};

exports.diseaseTrends = async (req, res, next) => {
  try {
    const data = await Prediction.aggregate([
      { $group: { _id: '$predictedDisease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ trends: data });
  } catch (err) { next(err); }
};

exports.alertStats = async (req, res, next) => {
  try {
    const [byType, byStatus] = await Promise.all([
      Alert.aggregate([{ $group: { _id: '$alertType', count: { $sum: 1 } } }]),
      Alert.aggregate([{ $group: { _id: '$status',    count: { $sum: 1 } } }]),
    ]);
    res.json({ byType, byStatus });
  } catch (err) { next(err); }
};

// Per-patient analytics — doctor (assigned), caretaker (assigned), patient (own)
exports.patientAnalytics = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const [vitalsCount, predictionsCount, alertsCount, latestPrediction, recentVitals, riskHistory, alertHistory] = await Promise.all([
      VitalRecord.countDocuments({ patientId }),
      Prediction.countDocuments({ patientId }),
      Alert.countDocuments({ patientId }),
      Prediction.findOne({ patientId }).sort({ createdAt: -1 }),
      VitalRecord.find({ patientId }).sort({ recordedAt: -1 }).limit(30).populate('submittedBy', 'name role'),
      Prediction.find({ patientId }).sort({ createdAt: 1 }).select('riskLevel predictedDisease confidence createdAt'),
      Alert.find({ patientId }).sort({ createdAt: -1 }).limit(20).select('alertType status createdAt message'),
    ]);

    // Compute vital averages from last 30 records
    const vitalAvg = recentVitals.length ? {
      heartRate:   +(recentVitals.reduce((s, v) => s + v.heartRate,   0) / recentVitals.length).toFixed(1),
      spo2:        +(recentVitals.reduce((s, v) => s + v.spo2,        0) / recentVitals.length).toFixed(1),
      systolicBP:  +(recentVitals.reduce((s, v) => s + v.systolicBP,  0) / recentVitals.length).toFixed(1),
      diastolicBP: +(recentVitals.reduce((s, v) => s + v.diastolicBP, 0) / recentVitals.length).toFixed(1),
      temperature: +(recentVitals.reduce((s, v) => s + v.temperature, 0) / recentVitals.length).toFixed(2),
    } : null;

    res.json({ vitalsCount, predictionsCount, alertsCount, latestPrediction, recentVitals, riskHistory, alertHistory, vitalAvg });
  } catch (err) { next(err); }
};

// Caretaker's own dashboard summary
exports.getCaretakerAnalytics = async (req, res, next) => {
  try {
    const caretakerId = req.params.caretakerId === 'me' ? req.user.userId : req.params.caretakerId;
    const patients = await Patient.find({ assignedCaretakerId: caretakerId, isActive: true });
    const patientIds = patients.map(p => p._id);

    const [activeAlerts, recentVitals] = await Promise.all([
      Alert.countDocuments({ notifyCaretakerId: caretakerId, status: 'Active' }),
      VitalRecord.find({ patientId: { $in: patientIds } }).sort({ recordedAt: -1 }).limit(10)
        .populate('patientId', 'patientId userId currentRiskLevel').populate('submittedBy', 'name'),
    ]);

    const riskBreakdown = patients.reduce((acc, p) => {
      acc[p.currentRiskLevel] = (acc[p.currentRiskLevel] || 0) + 1;
      return acc;
    }, {});

    res.json({ totalPatients: patients.length, riskBreakdown, activeAlerts, recentVitals });
  } catch (err) { next(err); }
};

// Doctor's own dashboard summary
exports.getDoctorAnalytics = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId === 'me' ? req.user.userId : req.params.doctorId;
    const patients = await Patient.find({ assignedDoctorId: doctorId, isActive: true });
    const patientIds = patients.map(p => p._id);

    const [activeAlerts, pendingCarePlans, recentPredictions] = await Promise.all([
      Alert.countDocuments({ notifyDoctorId: doctorId, status: 'Active' }),
      CarePlan.countDocuments({ patientId: { $in: patientIds }, status: 'Draft', isActive: true }),
      Prediction.find({ patientId: { $in: patientIds } }).sort({ createdAt: -1 }).limit(10)
        .populate('patientId', 'patientId userId'),
    ]);

    const riskBreakdown = patients.reduce((acc, p) => {
      acc[p.currentRiskLevel] = (acc[p.currentRiskLevel] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalPatients: patients.length,
      riskBreakdown,
      activeAlerts,
      pendingCarePlans,
      recentPredictions,
    });
  } catch (err) { next(err); }
};

// Recovery progress — first prediction vs latest
exports.getRecoveryProgress = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const [first, latest] = await Promise.all([
      Prediction.findOne({ patientId }).sort({ createdAt: 1 }),
      Prediction.findOne({ patientId }).sort({ createdAt: -1 }),
    ]);
    if (!first || !latest) return res.json({ status: 'Insufficient data', score: 0 });

    const riskScore = { High: 3, Medium: 2, Low: 1, Unknown: 2 };
    const firstScore  = riskScore[first.riskLevel]  || 2;
    const latestScore = riskScore[latest.riskLevel] || 2;
    const diff = firstScore - latestScore;

    const status = diff > 0 ? 'Improving' : diff < 0 ? 'Declining' : 'Stable';
    const score  = Math.round(((firstScore - latestScore) / firstScore) * 100);

    res.json({ status, score, firstRisk: first.riskLevel, latestRisk: latest.riskLevel });
  } catch (err) { next(err); }
};
