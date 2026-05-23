export const ROLES = { DOCTOR: 'doctor', PATIENT: 'patient', CARETAKER: 'caretaker', ADMIN: 'admin' };
export const RISK_LEVELS = ['Low', 'Medium', 'High'];

export const VITAL_RANGES = {
  age:          { min: 0,    max: 120,  unit: 'yrs',    label: 'Age' },
  heartRate:    { min: 30,   max: 250,  unit: 'bpm',    label: 'Heart Rate' },
  systolicBP:   { min: 70,   max: 250,  unit: 'mmHg',   label: 'Systolic BP' },
  diastolicBP:  { min: 40,   max: 150,  unit: 'mmHg',   label: 'Diastolic BP' },
  spo2:         { min: 80,   max: 100,  unit: '%',      label: 'SpO2' },
  glucoseLevel: { min: 40,   max: 500,  unit: 'mg/dL',  label: 'Glucose Level' },
  temperature:  { min: 35.0, max: 41.5,  unit: '°C',   label: 'Temperature' },
  cholesterol:  { min: 100,  max: 400,  unit: 'mg/dL',  label: 'Cholesterol' },
  bmi:          { min: 10,   max: 60,   unit: 'kg/m²',  label: 'BMI' },
};

// Normal/warning bands for colour coding in forms
export const VITAL_NORMAL = {
  age:          [18, 85],
  heartRate:    [60, 100],
  systolicBP:   [90, 140],
  diastolicBP:  [60, 90],
  spo2:         [95, 100],
  glucoseLevel: [70, 126],
  temperature:  [36.1, 37.5],
  cholesterol:  [100, 200],
  bmi:          [18.5, 30],
};

export const DISCLAIMER = 'AI predictions are decision-support tools and do not replace professional clinical diagnosis.';
