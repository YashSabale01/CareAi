import api from './axiosInstance';

// CARETAKER submits vitals via /submit
export const submitVitals      = (data)       => api.post('/api/vitals/submit', data);
export const getVitalsByPatient = (patientId, params) => api.get(`/api/vitals/patient/${patientId}`, { params });
export const getVital           = (id)        => api.get(`/api/vitals/${id}`);
