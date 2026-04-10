// Import React and state hook
import React, { useState } from 'react';

// Import API functions for updating and deleting
import { updateDevice, deleteDevice } from '../api/deviceApi';

// =========================
// DevicePanel Component
// =========================
const DevicePanel = ({ device, onClose, refreshDevices }) => {

  // =========================
  // Local state (form editing)
  // =========================
  const [formData, setFormData] = useState(device);

  // =========================
  // Handle input changes
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value, // update specific field
    });
  };

  // =========================
  // Save updated device
  // =========================
  const handleSave = async () => {
    try {
      await updateDevice(device.id, formData); // send update to backend
      refreshDevices(); // reload devices list
      onClose(); // close panel
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // Delete device
  // =========================
  const handleDelete = async () => {
    try {
      await deleteDevice(device.id); // delete from backend
      refreshDevices(); // refresh UI
      onClose(); // close panel
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={styles.panel}>
      <h3>Device Info</h3>

      {/* Close panel */}
      <button onClick={onClose}>Close</button>

      {/* Name */}
      <div>
        <label>Name:</label>
        <input
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
        />
      </div>

      {/* IP Address */}
      <div>
        <label>IP Address:</label>
        <input
          name="ip_address"
          value={formData.ip_address || ''}
          onChange={handleChange}
        />
      </div>

      {/* Status */}
      <div>
        <label>Status:</label>
        <select
          name="status"
          value={formData.status || 'offline'}
          onChange={handleChange}
        >
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Actions */}
      <button onClick={handleSave}>Save</button>

      <button onClick={handleDelete} style={{ color: 'red' }}>
        Delete
      </button>
    </div>
  );
};

// =========================
// Styling
// =========================
const styles = {
  panel: {
    position: 'fixed',
    right: 0,
    top: 0,
    width: '250px',
    height: '100%',
    background: '#f4f4f4',
    padding: '15px',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.2)',
  },
};

// Export component
export default DevicePanel;