import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Import API functions
import {
  getDevices,
  createDevice,
  deleteDevice,
} from '../api/deviceApi';

const DevicesPage = () => {
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  // State to store devices
  const [devices, setDevices] = useState([]);
  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');

  // State for new device form
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip_address: '',
    type: '',
  });

  // Update active view when URL changes
  useEffect(() => {
    setActiveView(viewParam === 'add' ? 'add' : 'list');
  }, [viewParam]);

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
      setNewDevice({ name: '', ip_address: '', type: '' }); // clear form
      // Don't change view - let the sidebar handle navigation
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
    <div style={styles.container}>
      {/* MAIN CONTENT */}
      <div style={styles.content}>
        {/* Add New Device View */}
        {activeView === 'add' && (
          <div style={styles.section}>
            <h2>Add New Machine</h2>
            <div style={styles.formContainer}>
              <input
                name="name"
                placeholder="Device Name"
                value={newDevice.name}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="ip_address"
                placeholder="IP Address"
                value={newDevice.ip_address}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="type"
                placeholder="Type (PC, Printer...)"
                value={newDevice.type}
                onChange={handleChange}
                style={styles.input}
              />
              <button onClick={handleAddDevice} style={styles.submitButton}>
                Add Device
              </button>
            </div>
          </div>
        )}

        {/* All Devices View */}
        {activeView === 'list' && (
          <div style={styles.section}>
            <h2>All Machines</h2>
            {devices.length === 0 ? (
              <p>No devices found.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} style={styles.tableRow}>
                      <td style={styles.td}>{device.name}</td>
                      <td style={styles.td}>{device.ip_address}</td>
                      <td style={styles.td}>{device.type}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.status,
                            backgroundColor: device.status === 'online' ? '#27ae60' : '#e74c3c',
                          }}
                        >
                          {device.status}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          onClick={() => handleDelete(device.id)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================
// STYLES
// =========================
const styles = {
  container: {
    display: 'flex',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px',
    maxWidth: '400px',
  },
  input: {
    padding: '10px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
  },
  submitButton: {
    padding: '10px',
    backgroundColor: '#3ba57d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#ecf0f1',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #bdc3c7',
    color: '#2c3e50',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ecf0f1',
  },
  tableRow: {
    ':hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default DevicesPage;