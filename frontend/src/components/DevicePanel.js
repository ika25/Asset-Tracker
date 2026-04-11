import React, { useState } from 'react';
import { updateDevice, deleteDevice } from '../api/deviceApi';

const DevicePanel = ({ device, onClose, refreshDevices }) => {
  // Form state
  const [formData, setFormData] = useState(device);

  // Handle input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Save changes
  const handleSave = async () => {
    try {
      await updateDevice(device.id, formData);
      refreshDevices();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete device
  const handleDelete = async () => {
    try {
      await deleteDevice(device.id);
      refreshDevices();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3>Device Info</h3>

      <button onClick={onClose}>Close</button>

      <input
        name="name"
        value={formData.name || ''}
        onChange={handleChange}
      />

      <input
        name="ip_address"
        value={formData.ip_address || ''}
        onChange={handleChange}
      />

      <select
        name="status"
        value={formData.status || 'offline'}
        onChange={handleChange}
      >
        <option value="online">Online</option>
        <option value="offline">Offline</option>
      </select>

      <button onClick={handleSave}>Save</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default DevicePanel;