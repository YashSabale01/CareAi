const CarePlan = require('../models/CarePlan');
const logger = require('../config/logger');

const PLANS = {
  'Diabetes Mellitus': {
    dietary: [
      'Low glycemic index foods',
      'Limit refined carbohydrates',
      'Increase fiber intake',
      'Control portion sizes',
      'Avoid sugary beverages',
    ],
    activity: [
      '30 min brisk walking daily',
      'Low-impact aerobics',
      'Resistance training 2x/week',
      'Avoid high-intensity workouts',
    ],
    followUp: { High: 'Every 4 weeks', default: 'Every 8 weeks' },
  },
  Hypertension: {
    dietary: [
      'DASH diet - low sodium (<2g/day)',
      'Increase potassium-rich foods',
      'Reduce saturated fats',
      'Limit alcohol',
      'Increase fruits and vegetables',
    ],
    activity: [
      'Aerobic exercise 30 min/5 days per week',
      'Avoid heavy lifting',
      'Yoga and meditation for stress reduction',
    ],
    followUp: { High: 'Every 2 weeks', default: 'Every 6 weeks' },
  },
  Arrhythmia: {
    dietary: [
      'Limit caffeine and alcohol',
      'Stay well hydrated',
      'Avoid large meals',
      'Omega-3 rich foods',
    ],
    activity: [
      'Light walking',
      'Gentle swimming',
      'Avoid strenuous exercise',
      'Heart rate monitoring during all exercise',
    ],
    followUp: { High: 'Every 1 week', default: 'Every 4 weeks' },
  },
  Asthma: {
    dietary: [
      'Anti-inflammatory foods',
      'Vitamin D rich diet',
      'Avoid known food triggers',
      'Stay hydrated',
    ],
    activity: [
      'Warm-up before exercise',
      'Swimming preferred',
      'Always carry rescue inhaler',
      'Avoid exercise in cold or polluted air',
    ],
    followUp: { High: 'Every 3 weeks', default: 'Every 8 weeks' },
  },
  Normal: {
    dietary: ['Balanced diet with all food groups', '8 glasses water/day'],
    activity: ['Maintain current activity level', '150 min moderate exercise/week'],
    followUp: { default: 'Annual checkup' },
  },
};

const generateCarePlan = async ({ patientId, doctorId, predictionId, predictedDisease, riskLevel }) => {
  try {
    const plan = PLANS[predictedDisease] || PLANS['Normal'];
    const followUp = plan.followUp[riskLevel] || plan.followUp.default;

    // Deactivate previous plans
    await CarePlan.updateMany({ patientId, isActive: true }, { isActive: false });

    const carePlan = await CarePlan.create({
      patientId,
      doctorId,
      predictionId,
      riskLevel,
      predictedDisease,
      dietaryGuidelines: plan.dietary,
      activityRecommendations: plan.activity,
      followUpSchedule: followUp,
      isApproved: false,
      isActive: true,
      status: 'Draft',
    });

    logger.info(`CarePlan generated for patient ${patientId}: ${predictedDisease} (${riskLevel})`, { module: 'CAREPLAN' });
    return carePlan;
  } catch (err) {
    logger.error(`CarePlan generation failed: ${err.message}`, { module: 'CAREPLAN' });
    throw err;
  }
};

module.exports = { generateCarePlan };
