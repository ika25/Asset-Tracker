import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createSoftware,
  deleteSoftware,
  getSoftware,
  updateSoftware,
} from '../api/softwareApi';
import { useCrudResource } from '../hooks/useCrudResource';

const EMPTY_SOFTWARE = {
  name: '',
  version: '',
  vendor: '',
  license_type: '',
  license_expiry: '',
  installed_on: '',
  installation_date: '',
};

const SoftwarePage = () => {
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const {
    items: softwareList,
    loading,
    saving,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrudResource({
    listFn: getSoftware,
    createFn: createSoftware,
    updateFn: updateSoftware,
    deleteFn: deleteSoftware,
    loadErrorMessage: 'Failed to fetch software.',
    createErrorMessage: 'Failed to add software.',
    updateErrorMessage: 'Failed to update software.',
    deleteErrorMessage: 'Failed to delete software.',
  });

  // State for new software form
  const [newSoftware, setNewSoftware] = useState(EMPTY_SOFTWARE);

  // State for editing
  const [editingData, setEditingData] = useState(EMPTY_SOFTWARE);

  const normalizeDateValue = (value) => (value ? String(value).split('T')[0] : '');
  const formatDate = (value) => normalizeDateValue(value) || '-';

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
      const created = await createItem(newSoftware);
      if (created) {
        setNewSoftware(EMPTY_SOFTWARE);
      }
    }
  };

  // =========================
  // Delete software
  // =========================
  const handleDelete = async (id) => {
    await deleteItem(id);
  };

  // =========================
  // Start editing
  // =========================
  const handleStartEdit = (software) => {
    setEditingId(software.id);
    setEditingData({
      ...software,
      license_expiry: normalizeDateValue(software.license_expiry),
      installation_date: normalizeDateValue(software.installation_date),
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
  // Save edited software
  // =========================
  const handleSaveEdit = async () => {
    const updated = await updateItem(editingId, editingData);
    if (updated) {
      setEditingId(null);
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
    setVendorFilter('All');
    setLicenseFilter('All');
  };

  const softwareVendors = [...new Set(softwareList.map((s) => s.vendor).filter(Boolean))];

  const filteredSoftware = softwareList.filter((software) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (software.name || '').toLowerCase().includes(query) ||
      (software.version || '').toLowerCase().includes(query) ||
      (software.installed_on || '').toLowerCase().includes(query);
    const matchesVendor = vendorFilter === 'All' || software.vendor === vendorFilter;
    const matchesLicense = licenseFilter === 'All' || software.license_type === licenseFilter;
    return matchesSearch && matchesVendor && matchesLicense;
  });

  return (
    <div style={styles.container}>
      {/* MAIN CONTENT */}
      <div style={styles.content}>
        {/* Add New Software View */}
        {activeView === 'add' && (
          <div style={styles.section}>
            <h2>Add New Software</h2>
            {error && <div style={styles.errorBanner}>{error}</div>}
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
              <button onClick={handleAddSoftware} style={styles.submitButton} disabled={saving || loading}>
                Add Software
              </button>
            </div>
          </div>
        )}

        {/* All Software View */}
        {activeView === 'list' && (
          <div style={styles.section}>
            <h2>Software Inventory</h2>
            {error && <div style={styles.errorBanner}>{error}</div>}
            <div style={styles.filterBar}>
              <input
                placeholder="Search name, version, installed on"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.filterInput}
              />
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                style={styles.filterInput}
              >
                <option value="All">All Vendors</option>
                {softwareVendors.map((vendor) => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                style={styles.filterInput}
              >
                <option value="All">All License Types</option>
                <option value="Commercial">Commercial</option>
                <option value="Free">Free</option>
                <option value="Trial">Trial</option>
                <option value="Pro">Pro</option>
              </select>
              <button onClick={handleClearFilters} style={styles.clearFilterButton}>
                Clear Filters
              </button>
            </div>
            {filteredSoftware.length === 0 ? (
              <p>{softwareList.length === 0 ? 'No software tracked. Start adding software to track licenses and installations.' : 'No software matches current filters.'}</p>
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
                  {filteredSoftware.map((software) => (
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
                          {formatDate(software.license_expiry)}
                        </span>
                      </td>
                      <td style={styles.td}>{software.installed_on || '-'}</td>
                      <td style={styles.td}>{formatDate(software.installation_date)}</td>

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
  errorBanner: {
    marginTop: '12px',
    marginBottom: '4px',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#fdecea',
    color: '#b23b3b',
    fontWeight: '600',
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