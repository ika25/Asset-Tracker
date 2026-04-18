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