import { apiClient } from './client';

export const getSoftware = () => apiClient.get('/software');
export const createSoftware = (data) => apiClient.post('/software', data);
export const updateSoftware = (id, data) => apiClient.put(`/software/${id}`, data);
export const deleteSoftware = (id) => apiClient.delete(`/software/${id}`);