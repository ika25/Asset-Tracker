import { apiClient } from './client';

export const getHardware = () => apiClient.get('/hardware');
export const createHardware = (data) => apiClient.post('/hardware', data);
export const updateHardware = (id, data) => apiClient.put(`/hardware/${id}`, data);
export const deleteHardware = (id) => apiClient.delete(`/hardware/${id}`);
export const bulkDeleteHardware = (ids) => apiClient.post('/hardware/bulk-delete', { ids });

export const importHardwareFromCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/hardware/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const exportHardwareToCSV = () => {
  return apiClient.get('/hardware/export/csv', { responseType: 'blob' });
};