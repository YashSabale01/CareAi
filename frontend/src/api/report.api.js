import api from './axiosInstance';
export const generateReport = (data) => api.post('/api/reports/generate', data);
export const getReportsByPatient = (patientId) => api.get(`/api/reports/patient/${patientId}`);
export const downloadReport = (reportId) => api.get(`/api/reports/${reportId}/download`, { responseType: 'blob' });
