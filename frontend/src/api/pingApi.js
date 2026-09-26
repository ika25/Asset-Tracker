import { apiClient } from './client';

/**
 * Ping a single device by its DB ID.
 * @param {number} deviceId
 */
export const pingDevice = (deviceId) => {
  return apiClient.get(`/ping/${deviceId}`);
};

/**
 * Batch-ping all devices (or a subset by IDs).
 * @param {number[]} [ids] - Optional list of device IDs to limit scope
 */
export const pingAllDevices = (ids) => {
  return apiClient.post('/ping/batch', ids && ids.length ? { ids } : {});
};
