import { apiClient } from './client';

export const runNetworkScan = (target, options = {}) => {
  const params = {
    ...(target ? { target } : {}),
    ...(options.deepScan ? { deep: true } : {}),
  };

  return apiClient.get('/scan', { params });
};
