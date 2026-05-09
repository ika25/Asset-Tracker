import { apiClient } from './client';

export const getSoftware = () => apiClient.get('/software');
export const createSoftware = (data) => apiClient.post('/software', data);
export const updateSoftware = (id, data) => apiClient.put(`/software/${id}`, data);
export const deleteSoftware = (id) => apiClient.delete(`/software/${id}`);
export const bulkDeleteSoftware = (ids) => apiClient.post('/software/bulk-delete', { ids });