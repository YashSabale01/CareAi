const { VITAL_RANGES } = require('./thresholds');

const validateVitals = (vitals) => {
  const errors = [];
  const checks = [
    ['heartRate', vitals.heartRate],
    ['spo2', vitals.spo2],
    ['systolicBP', vitals.systolicBP],
    ['diastolicBP', vitals.diastolicBP],
    ['temperature', vitals.temperature],
  ];
  for (const [field, value] of checks) {
    const range = VITAL_RANGES[field];
    if (value === undefined || value === null) {
      errors.push(`${field} is required`);
    } else if (value < range.min || value > range.max) {
      errors.push(`${field} must be between ${range.min} and ${range.max} ${range.unit}`);
    }
  }
  return errors;
};

module.exports = { validateVitals };
