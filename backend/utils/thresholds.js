const VITAL_RANGES = {
  heartRate:   { min: 30,  max: 220, unit: 'bpm' },
  spo2:        { min: 70,  max: 100, unit: '%' },
  systolicBP:  { min: 70,  max: 250, unit: 'mmHg' },
  diastolicBP: { min: 40,  max: 150, unit: 'mmHg' },
  temperature: { min: 34.0, max: 42.0, unit: 'C' },
};

const ALERT_THRESHOLDS = {
  heartRate:   { high: 100 },
  spo2:        { low: 90 },
  systolicBP:  { high: 140 },
  temperature: { low: 36.1, high: 37.9 },
};

module.exports = { VITAL_RANGES, ALERT_THRESHOLDS };
