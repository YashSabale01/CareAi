const VITAL_RANGES = {
  age:          { min: 0,    max: 120,  unit: 'yrs' },
  heartRate:    { min: 30,   max: 250,  unit: 'bpm' },
  systolicBP:   { min: 70,   max: 250,  unit: 'mmHg' },
  diastolicBP:  { min: 40,   max: 150,  unit: 'mmHg' },
  spo2:         { min: 80,   max: 100,  unit: '%' },
  glucoseLevel: { min: 40,   max: 500,  unit: 'mg/dL' },
  temperature:  { min: 95.0, max: 107.0, unit: '°F' },
  cholesterol:  { min: 100,  max: 400,  unit: 'mg/dL' },
  bmi:          { min: 10,   max: 60,   unit: 'kg/m²' },
};

const ALERT_THRESHOLDS = {
  heartRate:    { low: 60,   high: 100 },
  spo2:         { low: 95 },
  systolicBP:   { high: 140 },
  diastolicBP:  { high: 90 },
  temperature:  { low: 97.0, high: 99.5 },  // °F
  glucoseLevel: { low: 70,   high: 126 },
  cholesterol:  { high: 200 },
  bmi:          { low: 18.5, high: 30 },
};

module.exports = { VITAL_RANGES, ALERT_THRESHOLDS };
