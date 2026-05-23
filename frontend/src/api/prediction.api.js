import api from './axiosInstance';

export const getPredictionsByPatient = (patientId, params) => api.get(`/api/predictions/patient/${patientId}`, { params });
export const getPrediction           = (id)                => api.get(`/api/predictions/${id}`);
export const markPredictionReviewed  = (id)                => api.put(`/api/predictions/${id}/mark-reviewed`);
