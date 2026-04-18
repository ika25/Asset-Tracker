import { apiClient } from './client';

export const getHardware = () => apiClient.get('/hardware');
export const createHardware = (data) => apiClient.post('/hardware', data);
export const updateHardware = (id, data) => apiClient.put(`/hardware/${id}`, data);
export const deleteHardware = (id) => apiClient.delete(`/hardware/${id}`);