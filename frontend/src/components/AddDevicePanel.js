import React, { useState } from 'react';
import { createDevice } from '../api/deviceApi';

const AddDevicePanel = ({ position, onClose, refreshDevices }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    type: '',
  });

  // Handle input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Create device
  const handleCreate = async () => {
    try {
      await createDevice({
        ...formData,
        x_position: position.x,
        y_position: position.y,
      });

      refreshDevices();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3>Add Device</h3>

      <p>
        Position: ({Math.round(position.x)}, {Math.round(position.y)})
      </p>

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
        placeholder="Type"
        onChange={handleChange}
      />

      <button onClick={handleCreate}>Create</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default AddDevicePanel;