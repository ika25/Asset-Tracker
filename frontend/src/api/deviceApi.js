// Import axios for HTTP requests
import axios from 'axios';

// Create a reusable axios instance
// This avoids repeating base URL everywhere
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // backend URL
});

// =========================
// GET all devices
// =========================
export const getDevices = () => {
  return API.get('/devices'); // returns all devices
};

// =========================
// CREATE new device
// =========================
export const createDevice = (data) => {
  return API.post('/devices', data); // send device data to backend
};

// =========================
// UPDATE device
// =========================
export const updateDevice = (id, data) => {
  return API.put(`/devices/${id}`, data); // update device by ID
};

// =========================
// DELETE device
// =========================
export const deleteDevice = (id) => {
  return API.delete(`/devices/${id}`); // delete device
};