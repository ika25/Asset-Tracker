import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Import API functions
import { getApiErrorMessage } from '../api/client';
import {
  getDevices,
  createDevice,
  deleteDevice,
  updateDevice,
  bulkDeleteDevices,
  importDevicesFromCSV,
  exportDevicesToCSV,
} from '../api/deviceApi';
import { pingDevice, pingAllDevices } from '../api/pingApi';
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
const TYPE_ICON_MAP = {
  PC: '💻',
  Laptop: '💻',
  Printer: '🖨️',
  Router: '🛜',
  Switch: '📡',
  Server: '🗄️',
  Phone: '📱',
  Camera: '📷',
  Tablet: '📱',
  Other: '📡',
};

const formatPortSummary = (host) => host.portSummary || '-';
const extractSortableNumber = (value) => {
  if (value === null || value === undefined) {
    return Number.NEGATIVE_INFINITY;
  }

  const match = String(value).match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NEGATIVE_INFINITY;
};

const normalizeStatus = (value) => {
  const status = String(value || '').trim().toLowerCase();

  if (status === 'active' || status === 'online') {
    return 'active';
  }

  if (status === 'inactive' || status === 'offline') {
    return 'inactive';
  }

  if (status === 'retired') {
    return 'retired';
  }

  return 'unknown';
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
  const [ramFilter, setRamFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [scanTarget, setScanTarget] = useState(DEFAULT_SCAN_TARGET);
  const [scanDeepMode, setScanDeepMode] = useState(false);
  const [scanMode, setScanMode] = useState('quick');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanResults, setScanResults] = useState([]);
  const [scanScannedAt, setScanScannedAt] = useState('');
  const [scanImportingByIp, setScanImportingByIp] = useState({});
  const [selectedDeviceIds, setSelectedDeviceIds] = useState(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Health monitoring state: Map<deviceId, { alive, latency, checkedAt }>
  const [healthMap, setHealthMap] = useState({});
  const [pingLoading, setPingLoading] = useState(false);
  const [pingingDeviceId, setPingingDeviceId] = useState(null);
  const [pingError, setPingError] = useState('');
  const {
    items: devices,
    loading,
    saving,
    error,
    setError,
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
    const normalizedIp = String(newDevice.ip_address || '').trim().toLowerCase();
    if (normalizedIp && existingIps.has(normalizedIp)) {
      setError(`A device with IP address ${normalizedIp} already exists.`);
      return;
    }

    const payload = sanitizeDevicePayload({
      ...newDevice,
      ip_address: normalizedIp,
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
    const normalizedIp = String(editingData.ip_address || '').trim().toLowerCase();
    const duplicate = devices.some((device) => (
      device.id !== editingId && String(device.ip_address || '').trim().toLowerCase() === normalizedIp
    ));

    if (normalizedIp && duplicate) {
      setError(`A device with IP address ${normalizedIp} already exists.`);
      return;
    }

    const payload = sanitizeDevicePayload({
      ...editingData,
      ip_address: normalizedIp,
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
    setRamFilter('All');
    setSortField('name');
    setSortDirection('asc');
  };

  // =========================
  // Bulk Delete Actions
  // =========================
  const handleSelectDevice = (deviceId) => {
    const updated = new Set(selectedDeviceIds);
    if (updated.has(deviceId)) {
      updated.delete(deviceId);
    } else {
      updated.add(deviceId);
    }
    setSelectedDeviceIds(updated);
  };

  const handleSelectAllVisibleDevices = () => {
    if (selectedDeviceIds.size === sortedDevices.length && sortedDevices.length > 0) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(sortedDevices.map((d) => d.id)));
    }
  };

  const handleClearBulkSelection = () => {
    setSelectedDeviceIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedDeviceIds.size === 0) {
      setError('Please select at least one device.');
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedDeviceIds.size} device(s)? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setBulkDeleteLoading(true);
      setError('');
      await bulkDeleteDevices(Array.from(selectedDeviceIds));
      // Refresh the page to update the device list
      window.location.reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete devices.'));
      setBulkDeleteLoading(false);
    }
  };

  // =========================
  // Health / Ping
  // =========================
  const handlePingAll = async () => {
    try {
      setPingLoading(true);
      setPingError('');
      const response = await pingAllDevices();
      const results = response?.data?.results || [];
      const newMap = {};
      for (const r of results) {
        newMap[r.deviceId] = { alive: r.alive, latency: r.latency, checkedAt: r.checkedAt };
      }
      setHealthMap(newMap);
    } catch (err) {
      setPingError(getApiErrorMessage(err, 'Ping failed. Make sure the backend is running.'));
    } finally {
      setPingLoading(false);
    }
  };

  const handlePingOne = async (deviceId) => {
    try {
      setPingingDeviceId(deviceId);
      setPingError('');
      const response = await pingDevice(deviceId);
      const r = response?.data;
      setHealthMap((prev) => ({
        ...prev,
        [deviceId]: { alive: r.alive, latency: r.latency, checkedAt: r.checkedAt },
      }));
    } catch (err) {
      setPingError(getApiErrorMessage(err, 'Ping failed.'));
    } finally {
      setPingingDeviceId(null);
    }
  };

  // =========================
  // CSV Import/Export
  // =========================
  const fileInputRef = React.useRef(null);

  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      await importDevicesFromCSV(file);
      // Refresh after successful import
      window.location.reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to import devices from CSV.'));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = async () => {
    try {
      setError('');
      const response = await exportDevicesToCSV();
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'devices.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to export devices to CSV.'));
    }
  };

  const handleRunScan = async () => {
    try {
      setScanLoading(true);
      setScanError('');
      const response = await runNetworkScan(scanTarget, { deepScan: scanDeepMode });
      setScanResults(response?.data?.devices || []);
      setScanScannedAt(response?.data?.scannedAt || '');
      setScanMode(response?.data?.mode || (scanDeepMode ? 'deep' : 'quick'));
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
      .map((device) => String(device.ip_address || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const handleAddScannedDevice = async (host) => {
    if (!host?.ipAddress || existingIps.has(host.ipAddress)) {
      return;
    }

    setScanImportingByIp((prev) => ({ ...prev, [host.ipAddress]: true }));

    const payload = sanitizeDevicePayload({
      ...EMPTY_DEVICE,
      name: host.hostname || `${host.deviceTypeGuess || 'Discovered'} ${host.ipAddress}`,
      manufacturer: host.vendor || '',
      ip_address: host.ipAddress,
      type: host.deviceTypeGuess || 'Other',
      icon: TYPE_ICON_MAP[host.deviceTypeGuess] || (host.vendor ? '🛜' : '📡'),
      os: host.osGuess || '',
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
  const ramOptions = [...new Set(devices.map((device) => device.ram).filter(Boolean))].sort((left, right) => {
    return extractSortableNumber(left) - extractSortableNumber(right);
  });
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
    const matchesRam = ramFilter === 'All' || String(device.ram || '').trim() === ramFilter;
    return matchesSearch && matchesStatus && matchesType && matchesRam;
  });

  const sortedDevices = [...filteredDevices].sort((left, right) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortField === 'ram' || sortField === 'disk_space' || sortField === 'device_age') {
      return (extractSortableNumber(left[sortField]) - extractSortableNumber(right[sortField])) * direction;
    }

    if (sortField === 'install_date') {
      const leftDate = left.install_date ? new Date(left.install_date).getTime() : Number.NEGATIVE_INFINITY;
      const rightDate = right.install_date ? new Date(right.install_date).getTime() : Number.NEGATIVE_INFINITY;
      return (leftDate - rightDate) * direction;
    }

    const leftValue = String(left[sortField] || '').toLowerCase();
    const rightValue = String(right[sortField] || '').toLowerCase();

    if (leftValue < rightValue) return -1 * direction;
    if (leftValue > rightValue) return 1 * direction;
    return 0;
  });

  const dashboardMetrics = useMemo(() => {
    const typeCounts = devices.reduce((counts, device) => {
      const key = String(device.type || 'Unspecified').trim() || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    const statusCounts = devices.reduce((counts, device) => {
      const key = normalizeStatus(device.status);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, { active: 0, inactive: 0, retired: 0, unknown: 0 });

    const mappedDevices = devices.filter((device) => (
      device.x_position !== null
      && device.x_position !== undefined
      && device.y_position !== null
      && device.y_position !== undefined
    )).length;

    const topTypes = Object.entries(typeCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);

    return {
      total: devices.length,
      mappedDevices,
      unmappedDevices: devices.length - mappedDevices,
      statusCounts,
      topTypes,
    };
  }, [devices]);

  const totalStatusCount = Math.max(
    1,
    dashboardMetrics.statusCounts.active
      + dashboardMetrics.statusCounts.inactive
      + dashboardMetrics.statusCounts.retired
      + dashboardMetrics.statusCounts.unknown,
  );

  const statusSegments = [
    { key: 'active', label: 'Active', color: '#2ecc71', value: dashboardMetrics.statusCounts.active },
    { key: 'inactive', label: 'Inactive', color: '#e67e22', value: dashboardMetrics.statusCounts.inactive },
    { key: 'retired', label: 'Retired', color: '#e74c3c', value: dashboardMetrics.statusCounts.retired },
    { key: 'unknown', label: 'Unknown', color: '#95a5a6', value: dashboardMetrics.statusCounts.unknown },
  ];

  const discoveredCount = scanResults.length;
  const trackedDiscoveredCount = scanResults.filter((host) => existingIps.has(String(host.ipAddress || '').trim().toLowerCase())).length;
  const untrackedDiscoveredCount = discoveredCount - trackedDiscoveredCount;

  const scannedDevices = scanResults.map((host) => ({
    ...host,
    alreadyTracked: existingIps.has(String(host.ipAddress || '').trim().toLowerCase()),
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
            <div style={styles.dashboardPanel}>
              <div style={styles.dashboardHeaderRow}>
                <div>
                  <h3 style={styles.dashboardTitle}>Inventory Dashboard</h3>
                  <div style={styles.dashboardHint}>A quick visual snapshot of machine status, type mix, and map coverage.</div>
                </div>
                <div style={styles.dashboardBadgeRow}>
                  <span style={styles.dashboardBadge}>Total: {dashboardMetrics.total}</span>
                  <span style={styles.dashboardBadge}>Mapped: {dashboardMetrics.mappedDevices}</span>
                  <span style={styles.dashboardBadge}>Discovered: {discoveredCount}</span>
                </div>
              </div>

              <div style={styles.dashboardKpis}>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Total Machines</div>
                  <div style={styles.dashboardKpiValue}>{dashboardMetrics.total}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>On Floor Map</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#3ba57d' }}>{dashboardMetrics.mappedDevices}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Not Mapped</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#e67e22' }}>{dashboardMetrics.unmappedDevices}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Discovered / Tracked</div>
                  <div style={styles.dashboardKpiValue}>{trackedDiscoveredCount}/{discoveredCount}</div>
                </div>
              </div>

              <div style={styles.dashboardGrid}>
                <div style={styles.dashboardCard}>
                  <h4 style={styles.dashboardCardTitle}>Status Breakdown</h4>
                  <div style={styles.dashboardDonutWrap}>
                    <div
                      style={{
                        ...styles.dashboardDonut,
                        background: `conic-gradient(
                          #2ecc71 0% ${(dashboardMetrics.statusCounts.active / totalStatusCount) * 100}%,
                          #e67e22 ${(dashboardMetrics.statusCounts.active / totalStatusCount) * 100}% ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive) / totalStatusCount) * 100}%,
                          #e74c3c ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive) / totalStatusCount) * 100}% ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive + dashboardMetrics.statusCounts.retired) / totalStatusCount) * 100}%,
                          #95a5a6 ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive + dashboardMetrics.statusCounts.retired) / totalStatusCount) * 100}% 100%
                        )`,
                      }}
                    >
                      <div style={styles.dashboardDonutInner}>{dashboardMetrics.total}</div>
                    </div>
                    <div style={styles.dashboardLegend}>
                      {statusSegments.map((segment) => (
                        <div key={segment.key} style={styles.dashboardLegendRow}>
                          <span style={{ ...styles.dashboardLegendDot, backgroundColor: segment.color }} />
                          <span>{segment.label}: {segment.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={styles.dashboardCard}>
                  <h4 style={styles.dashboardCardTitle}>Top Device Types</h4>
                  {dashboardMetrics.topTypes.length === 0 ? (
                    <div style={styles.dashboardEmpty}>No devices yet.</div>
                  ) : (
                    <div style={styles.dashboardBars}>
                      {dashboardMetrics.topTypes.map(([type, count]) => {
                        const width = `${Math.max(8, (count / Math.max(1, dashboardMetrics.total)) * 100)}%`;
                        return (
                          <div key={type} style={styles.dashboardBarRow}>
                            <div style={styles.dashboardBarLabel}>{type}</div>
                            <div style={styles.dashboardBarTrack}>
                              <div style={{ ...styles.dashboardBarFill, width }} />
                            </div>
                            <div style={styles.dashboardBarValue}>{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={styles.dashboardCard}>
                  <h4 style={styles.dashboardCardTitle}>Discovery Snapshot</h4>
                  <div style={styles.dashboardSnapshot}>
                    <div style={styles.dashboardSnapshotValue}>{discoveredCount}</div>
                    <div style={styles.dashboardSnapshotLabel}>hosts found in the latest scan</div>
                    <div style={styles.dashboardSnapshotSubtext}>
                      {trackedDiscoveredCount} already tracked, {untrackedDiscoveredCount} ready to import.
                    </div>
                  </div>
                  <div style={styles.dashboardMiniStats}>
                    <div style={styles.dashboardMiniStat}>
                      <span style={styles.dashboardMiniStatLabel}>Tracked</span>
                      <span style={styles.dashboardMiniStatValue}>{trackedDiscoveredCount}</span>
                    </div>
                    <div style={styles.dashboardMiniStat}>
                      <span style={styles.dashboardMiniStatLabel}>New</span>
                      <span style={styles.dashboardMiniStatValue}>{untrackedDiscoveredCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={scanDeepMode}
                      onChange={(e) => setScanDeepMode(e.target.checked)}
                      disabled={scanLoading}
                    />
                    Deep scan (slower, more details)
                  </label>
                  <button onClick={handleRunScan} style={styles.submitButton} disabled={scanLoading || loading || saving}>
                    {scanLoading ? 'Scanning...' : 'Run Scan'}
                  </button>
                </div>
              </div>
              {scanError && <div style={styles.errorBanner}>{scanError}</div>}
              {!scanLoading && (
                <div style={styles.scanMeta}>Mode: {scanMode === 'deep' ? 'Deep (detailed)' : 'Quick (fast)'}</div>
              )}
              {scanScannedAt && <div style={styles.scanMeta}>Last scan: {new Date(scanScannedAt).toLocaleString()}</div>}
              {scannedDevices.length > 0 && (
                <div style={styles.scanTableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={styles.th}>Type Guess</th>
                        <th style={styles.th}>Hostname</th>
                        <th style={styles.th}>IP Address</th>
                        <th style={styles.th}>OS Guess</th>
                        <th style={styles.th}>MAC Address</th>
                        <th style={styles.th}>Vendor</th>
                        <th style={styles.th}>Open Services</th>
                        <th style={styles.th}>Inventory</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannedDevices.map((host) => (
                        <tr key={host.ipAddress || host.hostname} style={styles.tableRow}>
                          <td style={styles.td}>{host.deviceTypeGuess || '-'}</td>
                          <td style={styles.td}>{host.hostname || '-'}</td>
                          <td style={styles.td}>{host.ipAddress || '-'}</td>
                          <td style={styles.td}>{host.osGuess || '-'}</td>
                          <td style={styles.td}>{host.macAddress || '-'}</td>
                          <td style={styles.td}>{host.vendor || '-'}</td>
                          <td style={styles.td}>{formatPortSummary(host)}</td>
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
              <select
                value={ramFilter}
                onChange={(e) => setRamFilter(e.target.value)}
                style={styles.filterInput}
              >
                <option value="All">All RAM</option>
                {ramOptions.map((ram) => (
                  <option key={ram} value={ram}>{ram}</option>
                ))}
              </select>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                style={styles.filterInput}
              >
                <option value="name">Sort: Name</option>
                <option value="manufacturer">Sort: Maker</option>
                <option value="ip_address">Sort: IP</option>
                <option value="type">Sort: Type</option>
                <option value="os">Sort: OS</option>
                <option value="ram">Sort: RAM</option>
                <option value="disk_space">Sort: Disk</option>
                <option value="device_age">Sort: Age</option>
                <option value="install_date">Sort: Install Date</option>
                <option value="status">Sort: Status</option>
              </select>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                style={styles.filterInput}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button onClick={handleClearFilters} style={styles.clearFilterButton}>
                Clear Filters
              </button>
            </div>
            {sortedDevices.length === 0 ? (
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

                {/* CSV Import/Export + Health Toolbar */}
                <div style={styles.csvToolbar}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={styles.csvButtonLabel}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                      />
                      <span style={styles.csvButton}>📥 Import CSV</span>
                    </label>
                    <button onClick={handleExportCSV} style={styles.csvButton}>
                      📤 Export CSV
                    </button>
                    <button
                      onClick={handlePingAll}
                      style={styles.pingAllButton}
                      disabled={pingLoading}
                    >
                      {pingLoading ? '⏳ Pinging…' : '📡 Ping All'}
                    </button>
                    {pingError && (
                      <span style={{ color: '#e74c3c', fontSize: '13px' }}>{pingError}</span>
                    )}
                  </div>
                </div>

                {/* Bulk Delete Toolbar */}
                {selectedDeviceIds.size > 0 && (
                  <div style={styles.bulkActionToolbar}>
                    <span style={styles.bulkActionCount}>
                      {selectedDeviceIds.size} device{selectedDeviceIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      style={styles.bulkDeleteButton}
                      disabled={bulkDeleteLoading}
                    >
                      {bulkDeleteLoading ? 'Deleting...' : 'Delete Selected'}
                    </button>
                    <button
                      onClick={handleClearBulkSelection}
                      style={styles.bulkCancelButton}
                      disabled={bulkDeleteLoading}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Devices Table */}
                <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>
                      <input
                        type="checkbox"
                        checked={selectedDeviceIds.size === sortedDevices.length && sortedDevices.length > 0}
                        onChange={handleSelectAllVisibleDevices}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={styles.th}>Icon</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Maker / Brand</th>
                    <th style={styles.th}>User Name</th>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>Health</th>
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
                  {sortedDevices.map((device) => (
                    <tr key={device.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <input
                          type="checkbox"
                          checked={selectedDeviceIds.has(device.id)}
                          onChange={() => handleSelectDevice(device.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={styles.td}>{device.icon || '💻'}</td>
                      <td style={styles.td}>{device.name}</td>
                      <td style={styles.td}>{device.manufacturer || '-'}</td>
                      <td style={styles.td}>{device.user_name || '-'}</td>
                      <td style={styles.td}>{device.ip_address}</td>
                      <td style={styles.td}>
                        {(() => {
                          const h = healthMap[device.id];
                          if (!h) {
                            return (
                              <button
                                onClick={() => handlePingOne(device.id)}
                                style={styles.pingButton}
                                disabled={pingingDeviceId === device.id || !device.ip_address}
                                title={device.ip_address ? 'Ping this device' : 'No IP address assigned'}
                              >
                                {pingingDeviceId === device.id ? '⏳' : '📡'}
                              </button>
                            );
                          }
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  ...styles.healthBadge,
                                  backgroundColor: h.alive ? '#27ae60' : '#e74c3c',
                                }}
                              >
                                {h.alive ? '● Online' : '● Offline'}
                              </span>
                              {h.alive && h.latency !== null && (
                                <span style={styles.latencyText}>{h.latency}ms</span>
                              )}
                              <button
                                onClick={() => handlePingOne(device.id)}
                                style={styles.pingButton}
                                disabled={pingingDeviceId === device.id || !device.ip_address}
                                title="Re-ping"
                              >
                                {pingingDeviceId === device.id ? '⏳' : '🔄'}
                              </button>
                            </div>
                          );
                        })()}
                      </td>
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
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
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
  dashboardPanel: {
    marginTop: '14px',
    padding: '16px',
    border: '1px solid #dde4e7',
    borderRadius: '10px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f7fbf9 100%)',
  },
  dashboardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
    flexWrap: 'wrap',
  },
  dashboardTitle: {
    margin: 0,
    color: '#2c3e50',
  },
  dashboardHint: {
    marginTop: '6px',
    color: '#60727f',
    fontSize: '13px',
  },
  dashboardBadgeRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  dashboardBadge: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#edf7f2',
    border: '1px solid #cfe8dd',
    color: '#2f6f56',
    fontSize: '12px',
    fontWeight: '700',
  },
  dashboardKpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '14px',
  },
  dashboardKpiCard: {
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#fff',
    border: '1px solid #e5ece8',
  },
  dashboardKpiLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#6b7c87',
    marginBottom: '8px',
    fontWeight: '700',
  },
  dashboardKpiValue: {
    fontSize: '28px',
    lineHeight: 1,
    color: '#2c3e50',
    fontWeight: '800',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '12px',
    marginTop: '12px',
  },
  dashboardCard: {
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#fff',
    border: '1px solid #e5ece8',
    minHeight: '220px',
  },
  dashboardCardTitle: {
    margin: 0,
    fontSize: '15px',
    color: '#2c3e50',
  },
  dashboardDonutWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginTop: '14px',
    flexWrap: 'wrap',
  },
  dashboardDonut: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
  },
  dashboardDonutInner: {
    width: '92px',
    height: '92px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: '28px',
    fontWeight: '800',
    color: '#2c3e50',
    boxShadow: '0 4px 12px rgba(44,62,80,0.08)',
  },
  dashboardLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    color: '#51626d',
    fontSize: '13px',
  },
  dashboardLegendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dashboardLegendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  dashboardBars: {
    marginTop: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  dashboardBarRow: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 34px',
    gap: '10px',
    alignItems: 'center',
  },
  dashboardBarLabel: {
    fontSize: '13px',
    color: '#34495e',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dashboardBarTrack: {
    height: '12px',
    borderRadius: '999px',
    backgroundColor: '#edf2f3',
    overflow: 'hidden',
  },
  dashboardBarFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #3ba57d, #6cc3a0)',
  },
  dashboardBarValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'right',
  },
  dashboardSnapshot: {
    marginTop: '14px',
    padding: '16px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #edf9f4, #f8fbff)',
    border: '1px solid #dbe9e2',
    textAlign: 'center',
  },
  dashboardSnapshotValue: {
    fontSize: '40px',
    lineHeight: 1,
    fontWeight: '800',
    color: '#2f6f56',
  },
  dashboardSnapshotLabel: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#536572',
    fontWeight: '600',
  },
  dashboardSnapshotSubtext: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#6d7d88',
  },
  dashboardMiniStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  dashboardMiniStat: {
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: '#f9fbfc',
    border: '1px solid #e5ece8',
  },
  dashboardMiniStatLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6c7a89',
    marginBottom: '4px',
    fontWeight: '600',
  },
  dashboardMiniStatValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#2c3e50',
  },
  dashboardEmpty: {
    marginTop: '14px',
    color: '#6c7a89',
    fontSize: '13px',
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
  bulkActionToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    marginBottom: '15px',
  },
  bulkActionCount: {
    fontWeight: '600',
    color: '#856404',
    fontSize: '14px',
  },
  bulkDeleteButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  bulkCancelButton: {
    padding: '8px 16px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  csvToolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 0',
    marginBottom: '10px',
  },
  csvButtonLabel: {
    cursor: 'pointer',
  },
  csvButton: {
    padding: '8px 14px',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block',
  },
  pingAllButton: {
    padding: '8px 14px',
    backgroundColor: '#8e44ad',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  pingButton: {
    padding: '3px 7px',
    backgroundColor: 'transparent',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
  },
  healthBadge: {
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  latencyText: {
    fontSize: '11px',
    color: '#7f8c8d',
    whiteSpace: 'nowrap',
  },
};

export default DevicesPage;