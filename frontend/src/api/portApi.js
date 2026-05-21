import { apiClient } from './client';

export const getDevicePorts = (deviceId) => {
  return apiClient.get(`/devices/${deviceId}/ports`);
};

export const createDevicePort = (deviceId, data) => {
  return apiClient.post(`/devices/${deviceId}/ports`, data);
};

export const updateSwitchPort = (portId, data) => {
  return apiClient.put(`/ports/${portId}`, data);
};

export const deleteSwitchPort = (portId) => {
  return apiClient.delete(`/ports/${portId}`);
};

export const upsertPortConnection = (portId, data) => {
  return apiClient.post(`/ports/${portId}/connection`, data);
};

export const disconnectPort = (portId) => {
  return apiClient.delete(`/ports/${portId}/connection`);
};