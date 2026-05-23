import api from './axiosInstance';

export const adminGetUsers        = (params)              => api.get('/api/admin/users', { params });
export const adminCreateUser      = (data)                => api.post('/api/admin/users', data);
export const adminUpdateUser      = (id, data)            => api.put(`/api/admin/users/${id}`, data);
export const adminDeactivateUser  = (id)                  => api.delete(`/api/admin/users/${id}`);
export const adminAssignDoctor    = (patientId, doctorId)    => api.post('/api/admin/assign/doctor',    { patientId, doctorId });
export const adminAssignCaretaker = (patientId, caretakerId) => api.post('/api/admin/assign/caretaker', { patientId, caretakerId });
