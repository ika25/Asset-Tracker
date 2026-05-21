import React, { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/client';
import { getDevices, updateDevice, deleteDevice } from '../api/deviceApi';
import {
  createDevicePort,
  deleteSwitchPort,
  disconnectPort,
  getDevicePorts,
  updateSwitchPort,
  upsertPortConnection,
} from '../api/portApi';
import {
  DEVICE_STATUS_OPTIONS,
  getCategoryLabel,
  getVisibleDeviceFields,
  sanitizeDevicePayload,
} from '../utils/deviceFormConfig';

const ICON_OPTIONS = ['💻', '🖥️', '🖨️', '🛜', '📡', '🗄️', '📱', '📷'];
const PORT_TYPE_OPTIONS = ['copper', 'fiber', 'sfp'];
const EMPTY_PORT = {
  id: null,
  port_number: '',
  label: '',
  speed: '',
  vlan_id: '',
  port_type: 'copper',
  status: 'Active',
  connected_device_id: '',
  remote_port_id: '',
  cable_label: '',
  notes: '',
  connected_device_name: '',
  connected_device_location: '',
  remote_switch_name: '',
  remote_port_number: '',
};

const isSwitchDevice = (device) => String(device?.type || '').toLowerCase().includes('switch');
const normalizePortDraft = (port) => ({
  id: port?.id ?? null,
  port_number: port?.port_number || '',
  label: port?.label || '',
  speed: port?.speed || '',
  vlan_id: port?.vlan_id ?? '',
  port_type: port?.port_type || 'copper',
  status: port?.status || 'Active',
  connected_device_id: port?.connected_device_id ? String(port.connected_device_id) : '',
  remote_port_id: port?.remote_port_id ? String(port.remote_port_id) : '',
  cable_label: port?.cable_label || '',
  notes: port?.notes || '',
  connected_device_name: port?.connected_device_name || '',
  connected_device_location: port?.connected_device_location || '',
  remote_switch_name: port?.remote_switch_name || '',
  remote_port_number: port?.remote_port_number || '',
});
const buildEmptyPort = () => ({ ...EMPTY_PORT });

const DevicePanel = ({ device, onClose, refreshDevices, onPortsChanged }) => {
  // Form state
  const [formData, setFormData] = useState(device);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ports, setPorts] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [portsLoading, setPortsLoading] = useState(false);
  const [portsSavingId, setPortsSavingId] = useState(null);
  const visibleFields = getVisibleDeviceFields(formData);
  const switchDevice = isSwitchDevice(formData);

  useEffect(() => {
    setFormData(device);
    setError('');
    setSuccess('');
    setShowDeleteConfirm(false);
    setPorts([]);
    setAvailableDevices([]);
    setPortsLoading(false);
    setPortsSavingId(null);
  }, [device]);

  useEffect(() => {
    if (!switchDevice || !device?.id) {
      return undefined;
    }

    let cancelled = false;

    const loadPortContext = async () => {
      setPortsLoading(true);
      setError('');

      try {
        const [portsResponse, devicesResponse] = await Promise.all([
          getDevicePorts(device.id),
          getDevices(),
        ]);

        if (cancelled) {
          return;
        }

        setPorts((portsResponse.data || []).map(normalizePortDraft));
        setAvailableDevices((devicesResponse.data || []).filter((candidate) => candidate.id !== device.id));
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load switch ports.'));
        }
      } finally {
        if (!cancelled) {
          setPortsLoading(false);
        }
      }
    };

    loadPortContext();

    return () => {
      cancelled = true;
    };
  }, [device?.id, switchDevice]);

  // Handle input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handlePortChange = (index, field, value) => {
    setPorts((currentPorts) => currentPorts.map((port, portIndex) => (
      portIndex === index
        ? {
          ...port,
          [field]: value,
        }
        : port
    )));
    setError('');
    setSuccess('');
  };

  const handleAddPort = () => {
    setPorts((currentPorts) => [...currentPorts, buildEmptyPort()]);
    setSuccess('');
    setError('');
  };

  const reloadPorts = async () => {
    const response = await getDevicePorts(device.id);
    setPorts((response.data || []).map(normalizePortDraft));
  };

  const handleSavePort = async (port, index) => {
    const draftId = port.id || `new-${index}`;
    const trimmedPortNumber = String(port.port_number || '').trim();

    if (!trimmedPortNumber) {
      setError('Port number is required.');
      return;
    }

    setPortsSavingId(draftId);
    setError('');
    setSuccess('');

    try {
      const payload = {
        port_number: trimmedPortNumber,
        label: port.label || '',
        speed: port.speed || '',
        vlan_id: port.vlan_id === '' ? null : Number(port.vlan_id),
        port_type: port.port_type || 'copper',
        status: port.status || 'Active',
      };

      const portResponse = port.id
        ? await updateSwitchPort(port.id, payload)
        : await createDevicePort(device.id, payload);

      const savedPortId = portResponse.data.id;
      const connectionPayload = {
        connected_device_id: port.connected_device_id ? Number(port.connected_device_id) : null,
        remote_port_id: port.remote_port_id ? Number(port.remote_port_id) : null,
        cable_label: port.cable_label || '',
        notes: port.notes || '',
      };

      if (connectionPayload.connected_device_id || connectionPayload.remote_port_id) {
        await upsertPortConnection(savedPortId, connectionPayload);
      } else if (port.id && (port.connected_device_name || port.remote_switch_name || port.remote_port_number)) {
        await disconnectPort(savedPortId);
      }

      await reloadPorts();
      onPortsChanged?.();
      setSuccess(`Saved port ${trimmedPortNumber}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save port.'));
    } finally {
      setPortsSavingId(null);
    }
  };

  const handleDeletePort = async (port, index) => {
    if (!port.id) {
      setPorts((currentPorts) => currentPorts.filter((_, portIndex) => portIndex !== index));
      return;
    }

    setPortsSavingId(port.id);
    setError('');
    setSuccess('');

    try {
      await deleteSwitchPort(port.id);
      await reloadPorts();
      onPortsChanged?.();
      setSuccess(`Deleted port ${port.port_number}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete port.'));
    } finally {
      setPortsSavingId(null);
    }
  };

  // Save changes
  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateDevice(device.id, sanitizeDevicePayload(formData));
      setSuccess('✓ Device updated successfully!');
      setTimeout(() => {
        refreshDevices();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save device');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete device with confirmation
  const handleDeleteConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteDevice(device.id);
      refreshDevices();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete device');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Device Details</h3>
          <button
            onClick={onClose}
            style={styles.closeButton}
            title="Close"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {showDeleteConfirm ? (
          <div style={styles.deleteConfirm}>
            <p style={styles.deleteMessage}>
              ⚠️ Are you sure you want to delete <strong>{formData.name}</strong>? This cannot be undone.
            </p>
            <div style={styles.buttonGroup}>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                style={{
                  ...styles.deleteButton,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                {loading ? 'Deleting...' : '✓ Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                style={{
                  ...styles.cancelButton,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Device Name</label>
              <input
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>IP Address</label>
              {visibleFields.has('ip_address') ? (
                <input
                  name="ip_address"
                  value={formData.ip_address || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              ) : (
                <div style={styles.helperText}>Not relevant for this device type.</div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <input
                name="type"
                value={formData.type || ''}
                onChange={handleChange}
                disabled={loading}
                style={styles.input}
              />
              <div style={styles.typeHint}>{getCategoryLabel(formData)}</div>
            </div>

            {visibleFields.has('manufacturer') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Maker / Brand</label>
                <input
                  name="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('user_name') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>User Name</label>
                <input
                  name="user_name"
                  value={formData.user_name || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('os') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Operating System</label>
                <input
                  name="os"
                  value={formData.os || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('ram') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>RAM</label>
                <input
                  name="ram"
                  value={formData.ram || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('disk_space') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Disk Space</label>
                <input
                  name="disk_space"
                  value={formData.disk_space || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('device_age') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Device Age</label>
                <input
                  name="device_age"
                  value={formData.device_age || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('serial_number') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Serial Number</label>
                <input
                  name="serial_number"
                  value={formData.serial_number || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('install_date') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Install Date</label>
                <input
                  name="install_date"
                  type="date"
                  value={formData.install_date || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            {visibleFields.has('location') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Location</label>
                <input
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={formData.status || 'Active'}
                onChange={handleChange}
                disabled={loading}
                style={styles.input}
              >
                {DEVICE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Icon</label>
              <select
                name="icon"
                value={formData.icon || '💻'}
                onChange={handleChange}
                disabled={loading}
                style={styles.input}
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            {switchDevice && (
              <div style={styles.portSection}>
                <div style={styles.portSectionHeader}>
                  <div>
                    <div style={styles.portSectionTitle}>Switch Ports</div>
                    <div style={styles.portSectionHint}>Track which devices or uplinks are attached to each physical port.</div>
                  </div>
                  <button
                    onClick={handleAddPort}
                    disabled={loading || portsLoading}
                    style={{
                      ...styles.secondaryButton,
                      ...((loading || portsLoading) ? styles.buttonDisabled : {}),
                    }}
                  >
                    + Add Port
                  </button>
                </div>

                {portsLoading ? (
                  <div style={styles.helperText}>Loading ports...</div>
                ) : ports.length === 0 ? (
                  <div style={styles.helperText}>No ports tracked yet.</div>
                ) : (
                  ports.map((port, index) => {
                    const savingThisPort = portsSavingId === (port.id || `new-${index}`);

                    return (
                      <div key={port.id || `draft-${index}`} style={styles.portCard}>
                        <div style={styles.portCardHeader}>
                          <strong>{port.port_number || `New Port ${index + 1}`}</strong>
                          <span style={styles.portSummaryText}>
                            {port.connected_device_name
                              ? `${port.connected_device_name}${port.connected_device_location ? ` • ${port.connected_device_location}` : ''}`
                              : port.remote_switch_name
                                ? `${port.remote_switch_name} / ${port.remote_port_number || 'remote port'}`
                                : 'Unassigned'}
                          </span>
                        </div>

                        <div style={styles.portGrid}>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Port Number</label>
                            <input
                              value={port.port_number}
                              onChange={(e) => handlePortChange(index, 'port_number', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                            />
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Label</label>
                            <input
                              value={port.label}
                              onChange={(e) => handlePortChange(index, 'label', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                            />
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Speed</label>
                            <input
                              value={port.speed}
                              onChange={(e) => handlePortChange(index, 'speed', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                            />
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>VLAN</label>
                            <input
                              value={port.vlan_id}
                              onChange={(e) => handlePortChange(index, 'vlan_id', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                              inputMode="numeric"
                            />
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Port Type</label>
                            <select
                              value={port.port_type}
                              onChange={(e) => handlePortChange(index, 'port_type', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                            >
                              {PORT_TYPE_OPTIONS.map((portType) => (
                                <option key={portType} value={portType}>{portType}</option>
                              ))}
                            </select>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Port Status</label>
                            <select
                              value={port.status}
                              onChange={(e) => handlePortChange(index, 'status', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                            >
                              {DEVICE_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>

                          <div style={styles.formGroupWide}>
                            <label style={styles.label}>Connected Device</label>
                            <select
                              value={port.connected_device_id}
                              onChange={(e) => handlePortChange(index, 'connected_device_id', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                            >
                              <option value="">Not assigned</option>
                              {availableDevices.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.name || `Device ${candidate.id}`}
                                  {candidate.location ? ` • ${candidate.location}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={styles.formGroupWide}>
                            <label style={styles.label}>Remote Port ID</label>
                            <input
                              value={port.remote_port_id}
                              onChange={(e) => handlePortChange(index, 'remote_port_id', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                              placeholder="Optional uplink to another switch port"
                              inputMode="numeric"
                            />
                          </div>

                          <div style={styles.formGroupWide}>
                            <label style={styles.label}>Cable Label</label>
                            <input
                              value={port.cable_label}
                              onChange={(e) => handlePortChange(index, 'cable_label', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.input}
                            />
                          </div>

                          <div style={styles.formGroupWide}>
                            <label style={styles.label}>Notes</label>
                            <textarea
                              value={port.notes}
                              onChange={(e) => handlePortChange(index, 'notes', e.target.value)}
                              disabled={loading || savingThisPort}
                              style={styles.textarea}
                              rows={3}
                            />
                          </div>
                        </div>

                        <div style={styles.portButtonGroup}>
                          <button
                            onClick={() => handleSavePort(port, index)}
                            disabled={loading || savingThisPort}
                            style={{
                              ...styles.saveButton,
                              ...(loading || savingThisPort ? styles.buttonDisabled : {}),
                            }}
                          >
                            {savingThisPort ? 'Saving...' : 'Save Port'}
                          </button>
                          <button
                            onClick={() => handleDeletePort(port, index)}
                            disabled={loading || savingThisPort}
                            style={{
                              ...styles.deleteButton,
                              ...(loading || savingThisPort ? styles.buttonDisabled : {}),
                            }}
                          >
                            {port.id ? 'Delete Port' : 'Remove Draft'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {error && <div style={styles.errorMessage}>{error}</div>}
            {success && <div style={styles.successMessage}>{success}</div>}

            <div style={styles.buttonGroup}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  ...styles.saveButton,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                {loading ? 'Saving...' : '✓ Save'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                style={{
                  ...styles.deleteButton,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                🗑️ Delete
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  ...styles.cancelButton,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.1)',
    minWidth: '380px',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid #f0f0f0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '2px solid #ecf0f1',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#95a5a6',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#2c3e50',
  },
  input: {
    width: '100%',
    padding: '12px 13px',
    border: '1.5px solid #d5dbdb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    backgroundColor: '#f9fafb',
  },
  typeHint: {
    marginTop: '6px',
    fontSize: '12px',
    color: '#6b7b8d',
    fontWeight: '600',
  },
  helperText: {
    fontSize: '12px',
    color: '#95a5a6',
    padding: '8px 0 2px',
  },
  textarea: {
    width: '100%',
    padding: '12px 13px',
    border: '1.5px solid #d5dbdb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    backgroundColor: '#f9fafb',
    resize: 'vertical',
  },
  portSection: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '2px solid #ecf0f1',
  },
  portSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  portSectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2c3e50',
  },
  portSectionHint: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#6b7b8d',
  },
  portCard: {
    border: '1px solid #e1e8ed',
    borderRadius: '10px',
    padding: '16px',
    backgroundColor: '#fbfcfd',
    marginBottom: '14px',
  },
  portCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'baseline',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  portSummaryText: {
    fontSize: '12px',
    color: '#6b7b8d',
  },
  portGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '12px',
  },
  formGroupWide: {
    marginBottom: '15px',
    gridColumn: '1 / -1',
  },
  portButtonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    padding: '11px 14px',
    backgroundColor: '#eef3f8',
    color: '#2c3e50',
    border: '1px solid #d5dbdb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px',
    flexWrap: 'wrap',
  },
  saveButton: {
    flex: '1 1 auto',
    minWidth: '100px',
    padding: '13px 18px',
    backgroundColor: '#3ba57d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 165, 125, 0.25)',
  },
  deleteButton: {
    flex: '1 1 auto',
    minWidth: '100px',
    padding: '13px 18px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.25)',
  },
  cancelButton: {
    flex: '1 1 auto',
    minWidth: '100px',
    padding: '13px 18px',
    backgroundColor: '#bdc3c7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  deleteConfirm: {
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1.5px solid #ffc107',
  },
  deleteMessage: {
    margin: '0 0 20px 0',
    color: '#856404',
    fontSize: '14px',
    fontWeight: '600',
  },
  errorMessage: {
    backgroundColor: '#fadbd8',
    color: '#c0392b',
    border: '1.5px solid #f5b7b1',
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 6px rgba(192, 57, 43, 0.08)',
  },
  successMessage: {
    backgroundColor: '#d5f4e6',
    color: '#117a65',
    border: '1.5px solid #abebc6',
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 6px rgba(27, 188, 155, 0.08)',
  },
};

export default DevicePanel;