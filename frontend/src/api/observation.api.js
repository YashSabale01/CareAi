import api from './axiosInstance';

export const getObservationsByPatient = (patientId) => api.get(`/api/observations/patient/${patientId}`);
export const createObservation        = (data)      => api.post('/api/observations', data);
export const deleteObservation        = (id)        => api.delete(`/api/observations/${id}`);
