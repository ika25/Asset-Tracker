import React, { useState } from 'react';
import { updateDevice, deleteDevice } from '../api/deviceApi';
import {
  getCategoryLabel,
  getVisibleDeviceFields,
  sanitizeDevicePayload,
} from '../utils/deviceFormConfig';

const ICON_OPTIONS = ['💻', '🖥️', '🖨️', '🛜', '📡', '🗄️', '📱', '📷'];

const DevicePanel = ({ device, onClose, refreshDevices }) => {
  // Form state
  const [formData, setFormData] = useState(device);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const visibleFields = getVisibleDeviceFields(formData);

  // Handle input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Retired">Retired</option>
                <option value="In Repair">In Repair</option>
                <option value="For Sale">For Sale</option>
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