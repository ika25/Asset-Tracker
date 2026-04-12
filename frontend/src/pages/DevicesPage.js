import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Import API functions
import {
  getDevices,
  createDevice,
  deleteDevice,
  updateDevice,
} from '../api/deviceApi';

const ICON_OPTIONS = ['💻', '🖥️', '🖨️', '🛜', '📡', '🗄️', '📱', '📷'];

const DevicesPage = () => {
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  // State to store devices
  const [devices, setDevices] = useState([]);
  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // State for new device form
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip_address: '',
    type: '',
    icon: '💻',
    os: '',
    ram: '',
    disk_space: '',
    device_age: '',
    serial_number: '',
    warranty_expiry: '',
    location: '',
    status: 'Active',
  });

  // State for editing
  const [editingData, setEditingData] = useState({
    name: '',
    ip_address: '',
    type: '',
    icon: '💻',
    os: '',
    ram: '',
    disk_space: '',
    device_age: '',
    serial_number: '',
    warranty_expiry: '',
    location: '',
    status: 'Active',
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

  const normalizeDateValue = (value) => (value ? String(value).split('T')[0] : '');
  const formatDate = (value) => normalizeDateValue(value) || '-';

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
      setNewDevice({ name: '', ip_address: '', type: '', icon: '💻', os: '', ram: '', disk_space: '', device_age: '', serial_number: '', warranty_expiry: '', location: '', status: 'Active' }); // clear form
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

  // =========================
  // Start editing
  // =========================
  const handleStartEdit = (device) => {
    setEditingId(device.id);
    setEditingData({
      ...device,
      warranty_expiry: normalizeDateValue(device.warranty_expiry),
    });
  };

  // =========================
  // Handle edit input changes
  // =========================
  const handleEditChange = (e) => {
    setEditingData({
      ...editingData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // Save edited device
  // =========================
  const handleSaveEdit = async () => {
    try {
      await updateDevice(editingId, editingData); // update API
      setEditingId(null);
      fetchDevices(); // refresh list
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // Cancel editing
  // =========================
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All');
  };

  const deviceTypes = [...new Set(devices.map((d) => d.type).filter(Boolean))];

  const filteredDevices = devices.filter((device) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (device.name || '').toLowerCase().includes(query) ||
      (device.ip_address || '').toLowerCase().includes(query) ||
      (device.os || '').toLowerCase().includes(query) ||
      (device.location || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'All' || device.status === statusFilter;
    const matchesType = typeFilter === 'All' || device.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

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
                placeholder="Type (PC, Laptop, Printer...)"
                value={newDevice.type}
                onChange={handleChange}
                style={styles.input}
              />
              <select
                name="icon"
                value={newDevice.icon}
                onChange={handleChange}
                style={styles.input}
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <input
                name="os"
                placeholder="Operating System (Windows 10, macOS Monterey...)"
                value={newDevice.os}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="ram"
                placeholder="RAM (e.g., 16GB)"
                value={newDevice.ram}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="disk_space"
                placeholder="Disk Space (e.g., 512GB)"
                value={newDevice.disk_space}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="device_age"
                placeholder="Device Age (e.g., 2 years)"
                value={newDevice.device_age}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="serial_number"
                placeholder="Serial Number"
                value={newDevice.serial_number}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="warranty_expiry"
                placeholder="Warranty Expiry Date (YYYY-MM-DD)"
                type="date"
                value={newDevice.warranty_expiry}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="location"
                placeholder="Location / Department"
                value={newDevice.location}
                onChange={handleChange}
                style={styles.input}
              />
              <select
                name="status"
                value={newDevice.status}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Retired">Retired</option>
                <option value="In Repair">In Repair</option>
                <option value="For Sale">For Sale</option>
              </select>
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
            <div style={styles.filterBar}>
              <input
                placeholder="Search name, IP, OS, location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.filterInput}
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={styles.filterInput}
              >
                <option value="All">All Types</option>
                {deviceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterInput}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Retired">Retired</option>
                <option value="In Repair">In Repair</option>
                <option value="For Sale">For Sale</option>
              </select>
              <button onClick={handleClearFilters} style={styles.clearFilterButton}>
                Clear Filters
              </button>
            </div>
            {filteredDevices.length === 0 ? (
              <p>{devices.length === 0 ? 'No devices found.' : 'No machines match current filters.'}</p>
            ) : (
              <>
                {/* Edit Form Modal */}
                {editingId && (
                  <div style={styles.editModal}>
                    <div style={styles.editForm}>
                      <h3>Edit Device</h3>
                      <input
                        name="name"
                        placeholder="Device Name"
                        value={editingData.name}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="ip_address"
                        placeholder="IP Address"
                        value={editingData.ip_address}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="type"
                        placeholder="Type"
                        value={editingData.type}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <select
                        name="icon"
                        value={editingData.icon || '💻'}
                        onChange={handleEditChange}
                        style={styles.input}
                      >
                        {ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      <input
                        name="os"
                        placeholder="Operating System"
                        value={editingData.os}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="ram"
                        placeholder="RAM"
                        value={editingData.ram}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="disk_space"
                        placeholder="Disk Space"
                        value={editingData.disk_space}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="device_age"
                        placeholder="Device Age"
                        value={editingData.device_age}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="serial_number"
                        placeholder="Serial Number"
                        value={editingData.serial_number}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="warranty_expiry"
                        type="date"
                        value={editingData.warranty_expiry}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="location"
                        placeholder="Location"
                        value={editingData.location}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <select
                        name="status"
                        value={editingData.status}
                        onChange={handleEditChange}
                        style={styles.input}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Retired">Retired</option>
                        <option value="In Repair">In Repair</option>
                        <option value="For Sale">For Sale</option>
                      </select>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={handleSaveEdit} style={styles.submitButton}>
                          Save Changes
                        </button>
                        <button onClick={handleCancelEdit} style={styles.cancelButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Devices Table */}
                <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Icon</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>Type</th>
                      <th style={styles.th}>OS</th>
                      <th style={styles.th}>RAM</th>
                      <th style={styles.th}>Disk</th>
                      <th style={styles.th}>Age</th>
                      <th style={styles.th}>Serial #</th>
                      <th style={styles.th}>Warranty</th>
                      <th style={styles.th}>Location</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDevices.map((device) => (
                    <tr key={device.id} style={styles.tableRow}>
                      <td style={styles.td}>{device.icon || '💻'}</td>
                      <td style={styles.td}>{device.name}</td>
                      <td style={styles.td}>{device.ip_address}</td>
                      <td style={styles.td}>{device.type}</td>
                      <td style={styles.td}>{device.os || '-'}</td>
                      <td style={styles.td}>{device.ram || '-'}</td>
                      <td style={styles.td}>{device.disk_space || '-'}</td>
                      <td style={styles.td}>{device.device_age || '-'}</td>
                      <td style={styles.td}>{device.serial_number || '-'}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.warranty,
                            backgroundColor:
                              device.warranty_expiry &&
                              new Date(device.warranty_expiry) < new Date()
                                ? '#e74c3c'
                                : '#27ae60',
                          }}
                        >
                          {formatDate(device.warranty_expiry)}
                        </span>
                      </td>
                      <td style={styles.td}>{device.location || '-'}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.status,
                            backgroundColor:
                              device.status === 'Active'
                                ? '#27ae60'
                                : device.status === 'Inactive'
                                ? '#f39c12'
                                : device.status === 'Retired'
                                ? '#e74c3c'
                                : '#95a5a6',
                          }}
                        >
                          {device.status}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          onClick={() => handleStartEdit(device)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>
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
              </>
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
    maxWidth: '500px',
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
  cancelButton: {
    padding: '10px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  editModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  editForm: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    maxWidth: '500px',
    width: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    fontSize: '13px',
  },
  filterBar: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr auto',
    gap: '10px',
    marginTop: '14px',
    marginBottom: '8px',
  },
  filterInput: {
    padding: '10px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
  },
  clearFilterButton: {
    padding: '10px 14px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
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
    whiteSpace: 'nowrap',
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
  warranty: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#3ba57d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '5px',
  },
};

export default DevicesPage;