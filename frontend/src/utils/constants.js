export const ROLES = { DOCTOR: 'doctor', PATIENT: 'patient', CARETAKER: 'caretaker', ADMIN: 'admin' };
export const DISEASES = ['Arrhythmia', 'Asthma', 'Diabetes Mellitus', 'Hypertension', 'Normal'];
export const RISK_LEVELS = ['Low', 'Medium', 'High'];
export const VITAL_RANGES = {
  heartRate: { min: 30, max: 220, unit: 'bpm', label: 'Heart Rate' },
  spo2: { min: 70, max: 100, unit: '%', label: 'SpO2' },
  systolicBP: { min: 70, max: 250, unit: 'mmHg', label: 'Systolic BP' },
  diastolicBP: { min: 40, max: 150, unit: 'mmHg', label: 'Diastolic BP' },
  temperature: { min: 34, max: 42, unit: '°C', label: 'Temperature' },
};
export const DISCLAIMER = 'AI predictions are decision-support tools and do not replace professional clinical diagnosis.';
