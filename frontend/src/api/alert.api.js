import api from './axiosInstance';

export const getAlerts         = (params) => api.get('/api/alerts', { params });
export const getAlertsByPatient = (patientId) => api.get(`/api/alerts/patient/${patientId}`);
export const acknowledgeAlert  = (id)     => api.put(`/api/alerts/${id}/acknowledge`);
export const resolveAlert      = (id)     => api.put(`/api/alerts/${id}/resolve`);
