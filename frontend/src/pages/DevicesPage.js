import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Import API functions
import { getApiErrorMessage } from '../api/client';
import {
  getDevices,
  createDevice,
  deleteDevice,
  updateDevice,
} from '../api/deviceApi';
import { runNetworkScan } from '../api/scanApi';
import {
  DEVICE_STATUS_OPTIONS,
  DEVICE_TYPE_OPTIONS,
  getCategoryLabel,
  getVisibleDeviceFields,
  sanitizeDevicePayload,
} from '../utils/deviceFormConfig';
import { useCrudResource } from '../hooks/useCrudResource';

const ICON_OPTIONS = ['💻', '🖥️', '🖨️', '🛜', '📡', '🗄️', '📱', '📷'];
const EMPTY_DEVICE = {
  name: '',
  manufacturer: '',
  user_name: '',
  ip_address: '',
  type: '',
  icon: '💻',
  includeOnMap: false,
  os: '',
  ram: '',
  disk_space: '',
  device_age: '',
  serial_number: '',
  install_date: '',
  location: '',
  status: 'Active',
};
const DEFAULT_SCAN_TARGET = '192.168.1.0/24';
const DEFAULT_MAP_CENTER = {
  x: 600,
  y: 350,
};

const DevicesPage = () => {
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [scanTarget, setScanTarget] = useState(DEFAULT_SCAN_TARGET);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanResults, setScanResults] = useState([]);
  const [scanScannedAt, setScanScannedAt] = useState('');
  const [scanImportingByIp, setScanImportingByIp] = useState({});
  const {
    items: devices,
    loading,
    saving,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrudResource({
    listFn: getDevices,
    createFn: createDevice,
    updateFn: updateDevice,
    deleteFn: deleteDevice,
    loadErrorMessage: 'Failed to fetch devices.',
    createErrorMessage: 'Failed to add device.',
    updateErrorMessage: 'Failed to update device.',
    deleteErrorMessage: 'Failed to delete device.',
  });

  // State for new device form
  const [newDevice, setNewDevice] = useState(EMPTY_DEVICE);

  // State for editing
  const [editingData, setEditingData] = useState(EMPTY_DEVICE);

  // Update active view when URL changes
  useEffect(() => {
    setActiveView(viewParam === 'add' ? 'add' : 'list');
  }, [viewParam]);

  const normalizeDateValue = (value) => (value ? String(value).split('T')[0] : '');
  const formatDate = (value) => normalizeDateValue(value) || '-';
  const newDeviceFields = getVisibleDeviceFields(newDevice);
  const editingFields = getVisibleDeviceFields(editingData);

  // =========================
  // Handle input changes
  // =========================
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setNewDevice({
      ...newDevice,
      [e.target.name]: value,
    });
  };

  // =========================
  // Add new device
  // =========================
  const handleAddDevice = async () => {
    const payload = sanitizeDevicePayload({
      ...newDevice,
      x_position: newDevice.includeOnMap ? 100 : null,
      y_position: newDevice.includeOnMap ? 100 : null,
    });
    delete payload.includeOnMap;

    const created = await createItem(payload);
    if (created) {
      setNewDevice(EMPTY_DEVICE);
    }
  };

  // =========================
  // Delete device
  // =========================
  const handleDelete = async (id) => {
    await deleteItem(id);
  };

  // =========================
  // Start editing
  // =========================
  const handleStartEdit = (device) => {
    setEditingId(device.id);
    setEditingData({
      ...device,
      includeOnMap: device.x_position !== null && device.x_position !== undefined && device.y_position !== null && device.y_position !== undefined,
      install_date: normalizeDateValue(device.install_date),
    });
  };

  // =========================
  // Handle edit input changes
  // =========================
  const handleEditChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditingData({
      ...editingData,
      [e.target.name]: value,
    });
  };

  // =========================
  // Save edited device
  // =========================
  const handleSaveEdit = async () => {
    const payload = sanitizeDevicePayload({
      ...editingData,
      x_position: editingData.includeOnMap ? (editingData.x_position ?? 100) : null,
      y_position: editingData.includeOnMap ? (editingData.y_position ?? 100) : null,
    });
    delete payload.includeOnMap;

    const updated = await updateItem(editingId, payload);
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

  const handleRunScan = async () => {
    try {
      setScanLoading(true);
      setScanError('');
      const response = await runNetworkScan(scanTarget);
      setScanResults(response?.data?.devices || []);
      setScanScannedAt(response?.data?.scannedAt || '');
    } catch (err) {
      setScanError(getApiErrorMessage(err, 'Network scan failed.'));
      setScanResults([]);
      setScanScannedAt('');
    } finally {
      setScanLoading(false);
    }
  };

  const existingIps = new Set(
    devices
      .map((device) => String(device.ip_address || '').trim())
      .filter(Boolean)
  );

  const handleAddScannedDevice = async (host) => {
    if (!host?.ipAddress || existingIps.has(host.ipAddress)) {
      return;
    }

    setScanImportingByIp((prev) => ({ ...prev, [host.ipAddress]: true }));

    const payload = sanitizeDevicePayload({
      ...EMPTY_DEVICE,
      name: host.hostname || `Discovered ${host.ipAddress}`,
      manufacturer: host.vendor || '',
      ip_address: host.ipAddress,
      type: 'Other',
      icon: host.vendor ? '🛜' : '📡',
      location: 'Auto-discovered',
      status: 'Active',
      // Put discovered devices in the floor map center so they are easy to find.
      x_position: DEFAULT_MAP_CENTER.x,
      y_position: DEFAULT_MAP_CENTER.y,
    });

    const created = await createItem(payload);
    if (!created) {
      setScanError('Failed to import scanned device.');
    }

    setScanImportingByIp((prev) => ({ ...prev, [host.ipAddress]: false }));
  };

  const deviceTypes = [...new Set([...DEVICE_TYPE_OPTIONS, ...devices.map((d) => d.type).filter(Boolean)])];
  const deviceStatuses = [
    ...DEVICE_STATUS_OPTIONS,
    ...devices
      .map((device) => device.status)
      .filter((status) => status && !DEVICE_STATUS_OPTIONS.includes(status)),
  ];

  const filteredDevices = devices.filter((device) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (device.name || '').toLowerCase().includes(query) ||
      (device.manufacturer || '').toLowerCase().includes(query) ||
      (device.ip_address || '').toLowerCase().includes(query) ||
      (device.os || '').toLowerCase().includes(query) ||
      (device.location || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'All' || device.status === statusFilter;
    const matchesType = typeFilter === 'All' || device.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const scannedDevices = scanResults.map((host) => ({
    ...host,
    alreadyTracked: existingIps.has(String(host.ipAddress || '').trim()),
  }));

  return (
    <div style={styles.container}>
      {/* MAIN CONTENT */}
      <div style={styles.content}>
        {/* Add New Device View */}
        {activeView === 'add' && (
          <div style={styles.section}>
            <h2>Add New Machine</h2>
            {error && <div style={styles.errorBanner}>{error}</div>}
            <div style={styles.formContainer}>
              <input
                name="name"
                placeholder="Device Name"
                value={newDevice.name}
                onChange={handleChange}
                style={styles.input}
              />
              <select
                name="type"
                value={newDevice.type}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Select device type</option>
                {DEVICE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
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
              <div style={styles.formHint}>{getCategoryLabel(newDevice)}</div>
              {newDeviceFields.has('manufacturer') && (
                <input
                  name="manufacturer"
                  placeholder="Device Maker / Brand"
                  value={newDevice.manufacturer}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('user_name') && (
                <input
                  name="user_name"
                  placeholder="User Name"
                  value={newDevice.user_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('ip_address') && (
                <input
                  name="ip_address"
                  placeholder="IP Address"
                  value={newDevice.ip_address}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('os') && (
                <input
                  name="os"
                  placeholder="Operating System (Windows 10, macOS Monterey...)"
                  value={newDevice.os}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('ram') && (
                <input
                  name="ram"
                  placeholder="RAM (e.g., 16GB)"
                  value={newDevice.ram}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('disk_space') && (
                <input
                  name="disk_space"
                  placeholder="Disk Space (e.g., 512GB)"
                  value={newDevice.disk_space}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('device_age') && (
                <input
                  name="device_age"
                  placeholder="Device Age (e.g., 2 years)"
                  value={newDevice.device_age}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('serial_number') && (
                <input
                  name="serial_number"
                  placeholder="Serial Number"
                  value={newDevice.serial_number}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('install_date') && (
                <input
                  name="install_date"
                  placeholder="Install Date (YYYY-MM-DD)"
                  type="date"
                  value={newDevice.install_date}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              {newDeviceFields.has('location') && (
                <input
                  name="location"
                  placeholder="Location / Department"
                  value={newDevice.location}
                  onChange={handleChange}
                  style={styles.input}
                />
              )}
              <select
                name="status"
                value={newDevice.status}
                onChange={handleChange}
                style={styles.input}
              >
                {DEVICE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="includeOnMap"
                  checked={newDevice.includeOnMap}
                  onChange={handleChange}
                />
                Add this device to the floor map now
              </label>
              <button onClick={handleAddDevice} style={styles.submitButton} disabled={saving || loading}>
                Add Device
              </button>
            </div>
          </div>
        )}

        {/* All Devices View */}
        {activeView === 'list' && (
          <div style={styles.section}>
            <h2>All Machines</h2>
            {error && <div style={styles.errorBanner}>{error}</div>}
            <div style={styles.scanPanel}>
              <div style={styles.scanHeaderRow}>
                <div>
                  <h3 style={styles.scanTitle}>Network Discovery</h3>
                  <div style={styles.scanHint}>Scan a subnet to find active hosts and import them into inventory.</div>
                </div>
                <div style={styles.scanControls}>
                  <input
                    value={scanTarget}
                    onChange={(e) => setScanTarget(e.target.value)}
                    placeholder="Scan target (example: 192.168.1.0/24)"
                    style={styles.filterInput}
                  />
                  <button onClick={handleRunScan} style={styles.submitButton} disabled={scanLoading || loading || saving}>
                    {scanLoading ? 'Scanning...' : 'Run Scan'}
                  </button>
                </div>
              </div>
              {scanError && <div style={styles.errorBanner}>{scanError}</div>}
              {scanScannedAt && <div style={styles.scanMeta}>Last scan: {new Date(scanScannedAt).toLocaleString()}</div>}
              {scannedDevices.length > 0 && (
                <div style={styles.scanTableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={styles.th}>Hostname</th>
                        <th style={styles.th}>IP Address</th>
                        <th style={styles.th}>MAC Address</th>
                        <th style={styles.th}>Vendor</th>
                        <th style={styles.th}>Inventory</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannedDevices.map((host) => (
                        <tr key={host.ipAddress || host.hostname} style={styles.tableRow}>
                          <td style={styles.td}>{host.hostname || '-'}</td>
                          <td style={styles.td}>{host.ipAddress || '-'}</td>
                          <td style={styles.td}>{host.macAddress || '-'}</td>
                          <td style={styles.td}>{host.vendor || '-'}</td>
                          <td style={styles.td}>{host.alreadyTracked ? 'Already tracked' : 'Not tracked'}</td>
                          <td style={styles.td}>
                            <button
                              onClick={() => handleAddScannedDevice(host)}
                              style={host.alreadyTracked ? styles.disabledButton : styles.editButton}
                              disabled={host.alreadyTracked || scanImportingByIp[host.ipAddress] || saving}
                            >
                              {scanImportingByIp[host.ipAddress] ? 'Adding...' : host.alreadyTracked ? 'Added' : 'Add to Inventory'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div style={styles.filterBar}>
              <input
                placeholder="Search name, maker, IP, OS, location"
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
                {deviceStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
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
                      <select
                        name="type"
                        value={editingData.type}
                        onChange={handleEditChange}
                        style={styles.input}
                      >
                        <option value="">Select device type</option>
                        {DEVICE_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
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
                      <div style={styles.formHint}>{getCategoryLabel(editingData)}</div>
                      {editingFields.has('manufacturer') && (
                        <input
                          name="manufacturer"
                          placeholder="Device Maker / Brand"
                          value={editingData.manufacturer || ''}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('user_name') && (
                        <input
                          name="user_name"
                          placeholder="User Name"
                          value={editingData.user_name || ''}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('ip_address') && (
                        <input
                          name="ip_address"
                          placeholder="IP Address"
                          value={editingData.ip_address}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('os') && (
                        <input
                          name="os"
                          placeholder="Operating System"
                          value={editingData.os}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('ram') && (
                        <input
                          name="ram"
                          placeholder="RAM"
                          value={editingData.ram}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('disk_space') && (
                        <input
                          name="disk_space"
                          placeholder="Disk Space"
                          value={editingData.disk_space}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('device_age') && (
                        <input
                          name="device_age"
                          placeholder="Device Age"
                          value={editingData.device_age}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('serial_number') && (
                        <input
                          name="serial_number"
                          placeholder="Serial Number"
                          value={editingData.serial_number}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('install_date') && (
                        <input
                          name="install_date"
                          type="date"
                          value={editingData.install_date || ''}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      {editingFields.has('location') && (
                        <input
                          name="location"
                          placeholder="Location"
                          value={editingData.location}
                          onChange={handleEditChange}
                          style={styles.input}
                        />
                      )}
                      <select
                        name="status"
                        value={editingData.status}
                        onChange={handleEditChange}
                        style={styles.input}
                      >
                        {DEVICE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="includeOnMap"
                          checked={!!editingData.includeOnMap}
                          onChange={handleEditChange}
                        />
                        Show this device on the floor map
                      </label>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={handleSaveEdit} style={styles.submitButton} disabled={saving || loading}>
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
                    <th style={styles.th}>Maker / Brand</th>
                    <th style={styles.th}>User Name</th>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>Type</th>
                      <th style={styles.th}>OS</th>
                      <th style={styles.th}>RAM</th>
                      <th style={styles.th}>Disk</th>
                      <th style={styles.th}>Age</th>
                      <th style={styles.th}>Serial #</th>
                      <th style={styles.th}>Install Date</th>
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
                      <td style={styles.td}>{device.manufacturer || '-'}</td>
                      <td style={styles.td}>{device.user_name || '-'}</td>
                      <td style={styles.td}>{device.ip_address}</td>
                      <td style={styles.td}>{device.type}</td>
                      <td style={styles.td}>{device.os || '-'}</td>
                      <td style={styles.td}>{device.ram || '-'}</td>
                      <td style={styles.td}>{device.disk_space || '-'}</td>
                      <td style={styles.td}>{device.device_age || '-'}</td>
                      <td style={styles.td}>{device.serial_number || '-'}</td>
                      <td style={styles.td}>{formatDate(device.install_date)}</td>
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#2c3e50',
  },
  formHint: {
    fontSize: '12px',
    color: '#6c7a89',
    fontWeight: '600',
    marginTop: '-2px',
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
  scanPanel: {
    marginTop: '14px',
    marginBottom: '20px',
    padding: '14px',
    border: '1px solid #dde4e7',
    borderRadius: '8px',
    backgroundColor: '#fafcfd',
  },
  scanHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  scanTitle: {
    margin: 0,
    color: '#2c3e50',
  },
  scanHint: {
    marginTop: '6px',
    fontSize: '13px',
    color: '#60727f',
  },
  scanControls: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    minWidth: '320px',
  },
  scanMeta: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#60727f',
  },
  scanTableWrap: {
    marginTop: '12px',
    overflowX: 'auto',
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
  disabledButton: {
    padding: '6px 12px',
    backgroundColor: '#b9c3c9',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '12px',
  },
};

export default DevicesPage;