const Patient = require('../models/Patient');
const Prediction = require('../models/Prediction');
const CarePlan = require('../models/CarePlan');
const logger = require('../config/logger');

const CRITICAL_KEYWORDS = ['chest pain', 'can\'t breathe', 'unconscious', 'emergency', 'heart attack', 'stroke'];

const RESPONSES = {
  greeting: 'Hello! I\'m CareAI Assistant. I can help you understand your health data, vitals, and care plan. How can I help you today?',
  vitals: 'Your vitals are regularly monitored by your care team. If you notice any unusual symptoms, please contact your doctor immediately.',
  careplan: 'Your care plan includes personalized dietary guidelines, activity recommendations, and follow-up schedules based on your health predictions.',
  risk: 'Risk levels are determined by AI analysis of your vital signs. High risk requires immediate medical attention.',
  disease: 'Disease predictions are AI-generated insights based on your vital patterns. They are decision-support tools — always consult your doctor.',
  emergency: '🚨 EMERGENCY DETECTED: Please call emergency services (911) immediately or go to the nearest emergency room. Alert your care team now.',
  default: 'I can help with questions about your vitals, care plan, risk levels, and health predictions. For medical emergencies, please call 911.',
};

const getContextualResponse = async (message, userId) => {
  const lower = message.toLowerCase();

  if (CRITICAL_KEYWORDS.some(k => lower.includes(k))) return { response: RESPONSES.emergency, isEmergency: true };
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) return { response: RESPONSES.greeting };
  if (lower.includes('vital') || lower.includes('heart rate') || lower.includes('blood pressure') || lower.includes('spo2')) return { response: RESPONSES.vitals };
  if (lower.includes('care plan') || lower.includes('diet') || lower.includes('exercise') || lower.includes('activity')) return { response: RESPONSES.careplan };
  if (lower.includes('risk')) return { response: RESPONSES.risk };
  if (lower.includes('disease') || lower.includes('prediction') || lower.includes('diagnosis')) return { response: RESPONSES.disease };

  return { response: RESPONSES.default };
};

exports.message = async (req, res, next) => {
  try {
    const { message, patientId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const { response, isEmergency } = await getContextualResponse(message, req.user.userId);

    if (isEmergency) {
      logger.warn(`Emergency keyword detected from user ${req.user.userId}: "${message}"`, { module: 'CHATBOT' });
      if (global.io) global.io.to(req.user.userId.toString()).emit('emergency_detected', { message });
    }

    res.json({
      response,
      isEmergency: isEmergency || false,
      timestamp: new Date(),
    });
  } catch (err) { next(err); }
};
