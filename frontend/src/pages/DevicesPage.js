import React, { useEffect, useState } from 'react';

// Import API functions
import {
  getDevices,
  createDevice,
  deleteDevice,
} from '../api/deviceApi';

const DevicesPage = () => {
  // State to store devices
  const [devices, setDevices] = useState([]);

  // State for new device form
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip_address: '',
    type: '',
  });

  // =========================
  // Fetch devices from backend
  // =========================
  const fetchDevices = async () => {
    try {
      const res = await getDevices(); // API call
      setDevices(res.data); // store in state
    } catch (err) {
      console.error(err);
    }
  };

  // Run once when component loads
  useEffect(() => {
    fetchDevices();
  }, []);

  // =========================
  // Handle input changes
  // =========================
  const handleChange = (e) => {
    setNewDevice({
      ...newDevice,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // Add new device
  // =========================
  const handleAddDevice = async () => {
    try {
      await createDevice(newDevice); // send to backend
      fetchDevices(); // refresh list
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // Delete device
  // =========================
  const handleDelete = async (id) => {
    try {
      await deleteDevice(id); // delete API
      fetchDevices(); // refresh list
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Devices</h2>

      {/* =========================
          Add Device Form
      ========================= */}
      <div>
        <input
          name="name"
          placeholder="Device Name"
          onChange={handleChange}
        />
        <input
          name="ip_address"
          placeholder="IP Address"
          onChange={handleChange}
        />
        <input
          name="type"
          placeholder="Type (PC, Printer...)"
          onChange={handleChange}
        />
        <button onClick={handleAddDevice}>Add Device</button>
      </div>

      {/* =========================
          Devices Table
      ========================= */}
      <table border="1" style={{ marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>IP</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              <td>{device.name}</td>
              <td>{device.ip_address}</td>
              <td>{device.type}</td>
              <td>{device.status}</td>

              <td>
                <button onClick={() => handleDelete(device.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DevicesPage;