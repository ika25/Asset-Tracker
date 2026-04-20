import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createHardware,
  deleteHardware,
  getHardware,
  updateHardware,
} from '../api/hardwareApi';
import { useCrudResource } from '../hooks/useCrudResource';
import { sanitizeHardwarePayload } from '../utils/inventoryPayloadConfig';

const EMPTY_HARDWARE = {
  name: '',
  type: '',
  model: '',
  manufacturer: '',
  purchase_date: '',
  cost: '',
  location: '',
  warranty_expiry: '',
  status: 'Active',
};

const HardwarePage = () => {
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const {
    items: hardwareList,
    loading,
    saving,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrudResource({
    listFn: getHardware,
    createFn: createHardware,
    updateFn: updateHardware,
    deleteFn: deleteHardware,
    loadErrorMessage: 'Failed to fetch hardware.',
    createErrorMessage: 'Failed to add hardware.',
    updateErrorMessage: 'Failed to update hardware.',
    deleteErrorMessage: 'Failed to delete hardware.',
  });

  // State for new hardware form
  const [newHardware, setNewHardware] = useState(EMPTY_HARDWARE);

  // State for editing
  const [editingData, setEditingData] = useState(EMPTY_HARDWARE);

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
    setNewHardware({
      ...newHardware,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // Add new hardware
  // =========================
  const handleAddHardware = async () => {
    if (newHardware.name && newHardware.type) {
      const created = await createItem(sanitizeHardwarePayload(newHardware));
      if (created) {
        setNewHardware(EMPTY_HARDWARE);
      }
    }
  };

  // =========================
  // Delete hardware
  // =========================
  const handleDelete = async (id) => {
    await deleteItem(id);
  };

  // =========================
  // Start editing
  // =========================
  const handleStartEdit = (hardware) => {
    setEditingId(hardware.id);
    setEditingData({
      ...hardware,
      purchase_date: normalizeDateValue(hardware.purchase_date),
      warranty_expiry: normalizeDateValue(hardware.warranty_expiry),
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
  // Save edited hardware
  // =========================
  const handleSaveEdit = async () => {
    const updated = await updateItem(editingId, sanitizeHardwarePayload(editingData));
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
    setTypeFilter('All');
    setStatusFilter('All');
  };

  const hardwareTypes = [...new Set(hardwareList.map((h) => h.type).filter(Boolean))];

  const filteredHardware = hardwareList.filter((hardware) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (hardware.name || '').toLowerCase().includes(query) ||
      (hardware.model || '').toLowerCase().includes(query) ||
      (hardware.manufacturer || '').toLowerCase().includes(query) ||
      (hardware.location || '').toLowerCase().includes(query);
    const matchesType = typeFilter === 'All' || hardware.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || hardware.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div style={styles.container}>
      {/* MAIN CONTENT */}
      <div style={styles.content}>
        {/* Add New Hardware View */}
        {activeView === 'add' && (
          <div style={styles.section}>
            <h2>Add New Hardware</h2>
            {error && <div style={styles.errorBanner}>{error}</div>}
            <div style={styles.formContainer}>
              <input
                name="name"
                placeholder="Hardware Name / Item"
                value={newHardware.name}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="type"
                placeholder="Type (Monitor, Printer, Scanner, Server...)"
                value={newHardware.type}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="model"
                placeholder="Model Number"
                value={newHardware.model}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="manufacturer"
                placeholder="Manufacturer / Brand"
                value={newHardware.manufacturer}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="purchase_date"
                placeholder="Purchase Date (YYYY-MM-DD)"
                type="date"
                value={newHardware.purchase_date}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="cost"
                placeholder="Cost / Price"
                value={newHardware.cost}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="location"
                placeholder="Location / Asset Tag"
                value={newHardware.location}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="warranty_expiry"
                placeholder="Warranty Expiry Date (YYYY-MM-DD)"
                type="date"
                value={newHardware.warranty_expiry}
                onChange={handleChange}
                style={styles.input}
              />
              <select
                name="status"
                value={newHardware.status}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Retired">Retired</option>
                <option value="For Sale">For Sale</option>
              </select>
              <button onClick={handleAddHardware} style={styles.submitButton} disabled={saving || loading}>
                Add Hardware
              </button>
            </div>
          </div>
        )}

        {/* All Hardware View */}
        {activeView === 'list' && (
          <div style={styles.section}>
            <h2>Hardware Inventory</h2>
            {error && <div style={styles.errorBanner}>{error}</div>}
            <div style={styles.filterBar}>
              <input
                placeholder="Search name, model, manufacturer, location"
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
                {hardwareTypes.map((type) => (
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
                <option value="For Sale">For Sale</option>
              </select>
              <button onClick={handleClearFilters} style={styles.clearFilterButton}>
                Clear Filters
              </button>
            </div>
            {filteredHardware.length === 0 ? (
              <p>{hardwareList.length === 0 ? 'No hardware tracked. Start adding hardware items to track inventory and warranties.' : 'No hardware matches current filters.'}</p>
            ) : (
              <>
                {/* Edit Form Modal */}
                {editingId && (
                  <div style={styles.editModal}>
                    <div style={styles.editForm}>
                      <h3>Edit Hardware</h3>
                      <input
                        name="name"
                        placeholder="Hardware Name"
                        value={editingData.name}
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
                      <input
                        name="model"
                        placeholder="Model Number"
                        value={editingData.model}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="manufacturer"
                        placeholder="Manufacturer"
                        value={editingData.manufacturer}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="purchase_date"
                        type="date"
                        value={editingData.purchase_date}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                      <input
                        name="cost"
                        placeholder="Cost"
                        value={editingData.cost}
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
                      <input
                        name="warranty_expiry"
                        type="date"
                        value={editingData.warranty_expiry}
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

                {/* Hardware Table */}
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Hardware Name</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Model</th>
                      <th style={styles.th}>Manufacturer</th>
                      <th style={styles.th}>Purchase Date</th>
                      <th style={styles.th}>Cost</th>
                      <th style={styles.th}>Location</th>
                      <th style={styles.th}>Warranty Expiry</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredHardware.map((hardware) => (
                      <tr key={hardware.id} style={styles.tableRow}>
                        <td style={styles.td}>{hardware.name}</td>
                        <td style={styles.td}>{hardware.type || '-'}</td>
                        <td style={styles.td}>{hardware.model || '-'}</td>
                        <td style={styles.td}>{hardware.manufacturer || '-'}</td>
                        <td style={styles.td}>{formatDate(hardware.purchase_date)}</td>
                        <td style={styles.td}>{hardware.cost || '-'}</td>
                        <td style={styles.td}>{hardware.location || '-'}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.warranty,
                              backgroundColor:
                                hardware.warranty_expiry &&
                                new Date(hardware.warranty_expiry) < new Date()
                                  ? '#e74c3c'
                                  : '#27ae60',
                            }}
                          >
                            {formatDate(hardware.warranty_expiry)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.status,
                              backgroundColor:
                                hardware.status === 'Active'
                                  ? '#27ae60'
                                  : hardware.status === 'Inactive'
                                  ? '#f39c12'
                                  : '#e74c3c',
                            }}
                          >
                            {hardware.status}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => handleStartEdit(hardware)}
                              style={styles.editButton}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(hardware.id)}
                              style={styles.deleteButton}
                            >
                              Delete
                            </button>
                          </div>
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
    marginLeft: '5px',
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
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
};

export default HardwarePage;