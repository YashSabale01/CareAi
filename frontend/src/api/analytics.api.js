import api from './axiosInstance';

export const getOverview          = ()              => api.get('/api/analytics/overview');
export const getRiskDistribution  = ()              => api.get('/api/analytics/risk-distribution');
export const getDiseaseTrends     = ()              => api.get('/api/analytics/disease-trends');
export const getAlertStats        = ()              => api.get('/api/analytics/alert-stats');
export const getPatientAnalytics  = (patientId)     => api.get(`/api/analytics/patient/${patientId}`);
export const getDoctorAnalytics   = (doctorId)      => api.get(`/api/analytics/doctor/${doctorId}`);
export const getCaretakerAnalytics= (caretakerId)   => api.get(`/api/analytics/caretaker/${caretakerId}`);
export const getRecoveryProgress  = (patientId)     => api.get(`/api/analytics/recovery/${patientId}`);
