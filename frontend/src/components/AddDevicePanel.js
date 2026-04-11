// Import React and useState hook
import React, { useState } from 'react';

// Import API function to create device
import { createDevice } from '../api/deviceApi';

// Component receives position + control functions as props
const AddDevicePanel = ({ position, onClose, refreshDevices }) => {
  // =========================
  // Form state (device inputs)
  // =========================
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    type: '',
  });

  // =========================
  // Handle input changes
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // Create new device
  // =========================
  const handleCreate = async () => {
    try {
      // Send data to backend
      await createDevice({
        ...formData,

        // Save position from map click
        x_position: position.x,
        y_position: position.y,
      });

      // Refresh device list
      refreshDevices();

      // Close panel
      onClose();
    } catch (err) {
      console.error('Error creating device:', err);
    }
  };

  return (
    <div style={styles.panel}>
      <h3>Add Device</h3>

      {/* Show clicked coordinates */}
      <p>
        X: {Math.round(position.x)} | Y: {Math.round(position.y)}
      </p>

      {/* =========================
          Input fields
      ========================= */}
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

      {/* =========================
          Action buttons
      ========================= */}
      <button onClick={handleCreate}>Create</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

// =========================
// Styles for panel
// =========================
const styles = {
  panel: {
    position: 'fixed',
    right: '260px', // sits beside edit panel
    top: 0,
    width: '250px',
    height: '100%',
    background: '#eaeaea',
    padding: '15px',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.2)',
  },
};

export default AddDevicePanel;