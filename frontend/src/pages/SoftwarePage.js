import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api/software';

const SoftwarePage = () => {
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  // State to store software
  const [softwareList, setSoftwareList] = useState([]);
  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');
  const [editingId, setEditingId] = useState(null);

  // State for new software form
  const [newSoftware, setNewSoftware] = useState({
    name: '',
    version: '',
    vendor: '',
    license_type: '',
    license_expiry: '',
    installed_on: '',
    installation_date: '',
  });

  // State for editing
  const [editingData, setEditingData] = useState({
    name: '',
    version: '',
    vendor: '',
    license_type: '',
    license_expiry: '',
    installed_on: '',
    installation_date: '',
  });

  // Fetch software from backend
  const fetchSoftware = async () => {
    try {
      const res = await axios.get(API);
      setSoftwareList(res.data);
    } catch (err) {
      console.error('Failed to fetch software:', err);
    }
  };

  useEffect(() => { fetchSoftware(); }, []);

  // Update active view when URL changes
  useEffect(() => {
    setActiveView(viewParam === 'add' ? 'add' : 'list');
  }, [viewParam]);

  // =========================
  // Handle input changes
  // =========================
  const handleChange = (e) => {
    setNewSoftware({
      ...newSoftware,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // Add new software
  // =========================
  const handleAddSoftware = async () => {
    if (newSoftware.name && newSoftware.vendor) {
      try {
        await axios.post(API, newSoftware);
        await fetchSoftware();
        setNewSoftware({
          name: '',
          version: '',
          vendor: '',
          license_type: '',
          license_expiry: '',
          installed_on: '',
          installation_date: '',
        });
      } catch (err) {
        console.error('Failed to add software:', err);
      }
    }
  };

  // =========================
  // Delete software
  // =========================
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      await fetchSoftware();
    } catch (err) {
      console.error('Failed to delete software:', err);
    }
  };

  // =========================
  // Start editing
  // =========================
  const handleStartEdit = (software) => {
    setEditingId(software.id);
    setEditingData(software);
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
  // Save edited software
  // =========================
  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API}/${editingId}`, editingData);
      await fetchSoftware();
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update software:', err);
    }
  };

  // =========================
  // Cancel editing
  // =========================
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div style={styles.container}>
      {/* MAIN CONTENT */}
      <div style={styles.content}>
        {/* Add New Software View */}
        {activeView === 'add' && (
          <div style={styles.section}>
            <h2>Add New Software</h2>
            <div style={styles.formContainer}>
              <input
                name="name"
                placeholder="Software Name"
                value={newSoftware.name}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="version"
                placeholder="Version (e.g., 2.5.1)"
                value={newSoftware.version}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="vendor"
                placeholder="Vendor / Publisher"
                value={newSoftware.vendor}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="license_type"
                placeholder="License Type (Commercial, Free, Trial...)"
                value={newSoftware.license_type}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="license_expiry"
                placeholder="License Expiry Date (YYYY-MM-DD)"
                type="date"
                value={newSoftware.license_expiry}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="installed_on"
                placeholder="Installed On (Device Name)"
                value={newSoftware.installed_on}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="installation_date"
                placeholder="Installation Date (YYYY-MM-DD)"
                type="date"
                value={newSoftware.installation_date}
                onChange={handleChange}
                style={styles.input}
              />
              <button onClick={handleAddSoftware} style={styles.submitButton}>
                Add Software
              </button>
            </div>
          </div>
        )}

        {/* All Software View */}
        {activeView === 'list' && (
          <div style={styles.section}>
            <h2>Software Inventory</h2>
            {softwareList.length === 0 ? (
              <p>No software tracked. Start adding software to track licenses and installations.</p>
            ) : (
              <>
                {/* Edit Form Modal */}
                {editingId && (
                  <div style={styles.editModal}>
                    <div style={styles.editForm}>
                      <h3>Edit Software</h3>
                      <input
                        name="name"
                        placeholder="Software Name"
                        value={editingData.name}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="version"
                        placeholder="Version"
                        value={editingData.version}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="vendor"
                        placeholder="Vendor"
                        value={editingData.vendor}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="license_type"
                        placeholder="License Type"
                        value={editingData.license_type}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="license_expiry"
                        type="date"
                        value={editingData.license_expiry}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="installed_on"
                        placeholder="Installed On"
                        value={editingData.installed_on}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="installation_date"
                        type="date"
                        value={editingData.installation_date}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
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

                {/* Software Table */}
                <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Software Name</th>
                    <th style={styles.th}>Version</th>
                    <th style={styles.th}>Vendor</th>
                    <th style={styles.th}>License Type</th>
                    <th style={styles.th}>License Expiry</th>
                    <th style={styles.th}>Installed On</th>
                    <th style={styles.th}>Installation Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {softwareList.map((software) => (
                    <tr key={software.id} style={styles.tableRow}>
                      <td style={styles.td}>{software.name}</td>
                      <td style={styles.td}>{software.version || '-'}</td>
                      <td style={styles.td}>{software.vendor || '-'}</td>
                      <td style={styles.td}>{software.license_type || '-'}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.license,
                            backgroundColor:
                              software.license_expiry &&
                              new Date(software.license_expiry) < new Date()
                                ? '#e74c3c'
                                : '#27ae60',
                          }}
                        >
                          {software.license_expiry || '-'}
                        </span>
                      </td>
                      <td style={styles.td}>{software.installed_on || '-'}</td>
                      <td style={styles.td}>{software.installation_date || '-'}</td>

                      <td style={styles.td}>
                        <button
                          onClick={() => handleStartEdit(software)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(software.id)}
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
  license: {
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

export default SoftwarePage;