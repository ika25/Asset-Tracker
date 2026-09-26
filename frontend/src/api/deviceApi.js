import { apiClient } from './client';

// =========================
// GET all devices
// =========================
export const getDevices = () => {
  return apiClient.get('/devices'); // returns all devices
};

// =========================
// CREATE new device
// =========================
export const createDevice = (data) => {
  return apiClient.post('/devices', data); // send device data to backend
};

// =========================
// UPDATE device
// =========================
export const updateDevice = (id, data) => {
  return apiClient.put(`/devices/${id}`, data); // update device by ID
};

// =========================
// DELETE device
// =========================
export const deleteDevice = (id) => {
  return apiClient.delete(`/devices/${id}`); // delete device
};

// =========================
// BULK DELETE devices
// =========================
export const bulkDeleteDevices = (ids) => {
  return apiClient.post('/devices/bulk-delete', { ids });
};

// =========================
// IMPORT devices from CSV
// =========================
export const importDevicesFromCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/devices/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// =========================
// EXPORT devices as CSV
// =========================
export const exportDevicesToCSV = () => {
  return apiClient.get('/devices/export/csv', { responseType: 'blob' });
};