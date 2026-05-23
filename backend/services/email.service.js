const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP not configured — skipping email', { module: 'EMAIL' });
    return false;
  }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM || 'noreply@careai.health', to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`, { module: 'EMAIL' });
    return true;
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`, { module: 'EMAIL' });
    return false;
  }
};

const sendAlertEmail = async ({ to, patientName, patientId, age, vitals, disease, riskLevel, timestamp }) => {
  const subject = `[CareAI ALERT] High Risk Detected — ${patientName}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#ef4444">⚠️ CareAI Critical Alert</h2>
      <p><strong>Patient:</strong> ${patientName} (${patientId})</p>
      <p><strong>Age:</strong> ${age || 'N/A'}</p>
      <p><strong>Predicted Disease:</strong> ${disease}</p>
      <p><strong>Risk Level:</strong> <span style="color:#ef4444">${riskLevel}</span></p>
      <h3>Vital Signs</h3>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:4px 8px;border:1px solid #ddd">Heart Rate</td><td style="padding:4px 8px;border:1px solid #ddd">${vitals.heartRate} bpm</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #ddd">SpO2</td><td style="padding:4px 8px;border:1px solid #ddd">${vitals.spo2}%</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #ddd">Blood Pressure</td><td style="padding:4px 8px;border:1px solid #ddd">${vitals.systolicBP}/${vitals.diastolicBP} mmHg</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #ddd">Temperature</td><td style="padding:4px 8px;border:1px solid #ddd">${vitals.temperature}°C</td></tr>
      </table>
      <p><strong>Detected at:</strong> ${new Date(timestamp).toLocaleString()}</p>
      <p style="color:#888;font-size:12px">AI predictions are decision-support tools and do not replace professional clinical diagnosis.</p>
    </div>`;
  return sendEmail({ to, subject, html });
};

module.exports = { sendEmail, sendAlertEmail };
