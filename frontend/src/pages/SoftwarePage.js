import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// For demo purposes - you can replace with actual API calls
// import { getSoftware, createSoftware, deleteSoftware } from '../api/softwareApi';

const SoftwarePage = () => {
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  // State to store software
  const [softwareList, setSoftwareList] = useState([]);
  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');

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
      // Add to list (in real app, send to backend)
      setSoftwareList([...softwareList, { id: Date.now(), ...newSoftware }]);
      setNewSoftware({
        name: '',
        version: '',
        vendor: '',
        license_type: '',
        license_expiry: '',
        installed_on: '',
        installation_date: '',
      });
    }
  };

  // =========================
  // Delete software
  // =========================
  const handleDelete = (id) => {
    setSoftwareList(softwareList.filter((item) => item.id !== id));
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

export default SoftwarePage;