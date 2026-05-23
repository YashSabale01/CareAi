const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const VitalRecord = require('../models/VitalRecord');
const Prediction = require('../models/Prediction');
const Alert = require('../models/Alert');
const CarePlan = require('../models/CarePlan');
const User = require('../models/User');
const logger = require('../config/logger');

const REPORTS_DIR = path.join(__dirname, '../reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

exports.generate = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    const patient = await Patient.findById(patientId).populate('userId', 'name email phone');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const [vitals, predictions, alerts, carePlans] = await Promise.all([
      VitalRecord.find({ patientId }).sort({ recordedAt: -1 }).limit(10),
      Prediction.find({ patientId }).sort({ createdAt: -1 }).limit(10),
      Alert.find({ patientId }).sort({ createdAt: -1 }).limit(10),
      CarePlan.find({ patientId, isActive: true }).limit(1),
    ]);

    const fileName = `report_${patientId}_${Date.now()}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(22).fillColor('#1a2234').text('CareAI Health Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();

      // Patient Info
      doc.fontSize(14).fillColor('#000').text('Patient Information');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).text(`Name: ${patient.userId?.name || 'N/A'}`);
      doc.text(`Patient ID: ${patient.patientId}`);
      doc.text(`Age: ${patient.age || 'N/A'} | Gender: ${patient.gender || 'N/A'} | Blood Group: ${patient.bloodGroup || 'N/A'}`);
      doc.text(`Email: ${patient.userId?.email || 'N/A'}`);
      doc.moveDown();

      // Vitals
      doc.fontSize(14).text('Recent Vital Records (Last 10)');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      vitals.forEach((v, i) => {
        doc.fontSize(9).text(
          `${i + 1}. ${new Date(v.recordedAt).toLocaleDateString()} — HR: ${v.heartRate}bpm | SpO2: ${v.spo2}% | BP: ${v.systolicBP}/${v.diastolicBP}mmHg | Temp: ${v.temperature}°C`
        );
      });
      doc.moveDown();

      // Predictions
      doc.fontSize(14).text('Prediction History (Last 10)');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      predictions.forEach((p, i) => {
        doc.fontSize(9).text(
          `${i + 1}. ${new Date(p.createdAt).toLocaleDateString()} — ${p.predictedDisease} | Risk: ${p.riskLevel} | Confidence: ${(p.confidence * 100).toFixed(1)}%`
        );
      });
      doc.moveDown();

      // Active Care Plan
      if (carePlans.length) {
        const cp = carePlans[0];
        doc.fontSize(14).text('Active Care Plan');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(10).text(`Disease: ${cp.predictedDisease} | Risk: ${cp.riskLevel}`);
        doc.text(`Follow-up: ${cp.followUpSchedule}`);
        doc.text('Dietary: ' + cp.dietaryGuidelines.join(', '));
        doc.text('Activity: ' + cp.activityRecommendations.join(', '));
        doc.moveDown();
      }

      // Disclaimer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#888')
        .text('DISCLAIMER: AI predictions are decision-support tools and do not replace professional clinical diagnosis.', { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const stat = fs.statSync(filePath);
    const report = await Report.create({
      patientId, generatedBy: req.user.userId,
      filePath: fileName, fileSize: stat.size,
    });

    logger.info(`Report generated: ${fileName}`, { module: 'REPORT' });
    res.status(201).json({ report, message: 'Report generated successfully' });
  } catch (err) { next(err); }
};

exports.getByPatient = async (req, res, next) => {
  try {
    const reports = await Report.find({ patientId: req.params.patientId })
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) { next(err); }
};

exports.download = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    const filePath = path.join(REPORTS_DIR, report.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Report file not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filePath}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) { next(err); }
};
