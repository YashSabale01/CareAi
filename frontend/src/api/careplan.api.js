import api from './axiosInstance';

export const getCarePlanByPatient = (patientId) => api.get(`/api/careplans/patient/${patientId}`);
export const getCarePlan          = (id)         => api.get(`/api/careplans/${id}`);
export const updateCarePlan       = (id, data)   => api.put(`/api/careplans/${id}`, data);
export const approveCarePlan      = (id)         => api.put(`/api/careplans/${id}/approve`);
