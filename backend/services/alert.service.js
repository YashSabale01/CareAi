const Alert = require('../models/Alert');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { sendAlertEmail } = require('./email.service');
const logger = require('../config/logger');

const dispatchAlert = async ({ patientId, predictionId, riskLevel, prediction, vitals }) => {
  try {
    const patient = await Patient.findById(patientId).populate('userId');
    const patientUser = patient?.userId;

    const alertType = riskLevel === 'High' ? 'Critical' : 'Warning';
    const diseaseLabel = prediction.predictedDisease === 'Normal' ? 'No specific condition' : prediction.predictedDisease;
    const message = `${alertType} alert: ${diseaseLabel} detected with ${riskLevel} risk. ` +
      `Confidence: ${(prediction.confidence * 100).toFixed(1)}%`;

    const alert = await Alert.create({
      patientId,
      predictionId,
      notifyDoctorId:    patient?.assignedDoctorId,
      notifyCaretakerId: patient?.assignedCaretakerId,
      alertType,
      message,
      vitalSnapshot: vitals,
      notificationsSent: { email: false, inApp: false },
    });

    // Emit Socket.IO in-app notification
    if (global.io) {
      const payload = { alert, patientName: patientUser?.name, riskLevel, disease: prediction.predictedDisease };
      if (patient?.assignedDoctorId)    global.io.to(patient.assignedDoctorId.toString()).emit('new_alert', payload);
      if (patient?.assignedCaretakerId) global.io.to(patient.assignedCaretakerId.toString()).emit('new_alert', payload);
      await Alert.findByIdAndUpdate(alert._id, { 'notificationsSent.inApp': true });
    }

    // Send email for High risk only
    if (riskLevel === 'High') {
      const recipients = [];
      if (patient?.assignedDoctorId) {
        const doc = await User.findById(patient.assignedDoctorId);
        if (doc?.email) recipients.push(doc.email);
      }
      if (patient?.assignedCaretakerId) {
        const ct = await User.findById(patient.assignedCaretakerId);
        if (ct?.email) recipients.push(ct.email);
      }

      const emailPayload = {
        patientName: patientUser?.name || 'Unknown',
        patientId: patient?.patientId || patientId,
        age: patient?.age,
        vitals,
        disease: prediction.predictedDisease,
        riskLevel,
        timestamp: new Date(),
      };

      for (const email of recipients) {
        const sent = await sendAlertEmail({ to: email, ...emailPayload });
        if (sent) await Alert.findByIdAndUpdate(alert._id, { 'notificationsSent.email': true });
      }
    }

    logger.info(`Alert dispatched: ${alertType} for patient ${patientId}`, { module: 'ALERT' });
    return alert;
  } catch (err) {
    logger.error(`Alert dispatch failed: ${err.message}`, { module: 'ALERT' });
    throw err;
  }
};

module.exports = { dispatchAlert };
