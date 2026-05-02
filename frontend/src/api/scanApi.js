import { apiClient } from './client';

export const runNetworkScan = (target) => {
  const params = target ? { target } : undefined;
  return apiClient.get('/scan', { params });
};
