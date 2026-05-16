import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createSoftware,
  deleteSoftware,
  getSoftware,
  updateSoftware,
  bulkDeleteSoftware,
  importSoftwareFromCSV,
  exportSoftwareToCSV,
} from '../api/softwareApi';
import { getApiErrorMessage } from '../api/client';
import { useCrudResource } from '../hooks/useCrudResource';
import { sanitizeSoftwarePayload } from '../utils/inventoryPayloadConfig';

// Software page keeps add/list/edit together and reuses shared CRUD behavior
// so validation and error handling stay consistent with other pages.

const EMPTY_SOFTWARE = {
  name: '',
  version: '',
  vendor: '',
  license_type: '',
  license_expiry: '',
  installed_on: '',
  installation_date: '',
};

const parseDateSortValue = (value) => {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const daysUntil = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const SoftwarePage = () => {
  // Support deep links like /software?view=add.
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [licenseFilter, setLicenseFilter] = useState('All');
  const [licenseHealthFilter, setLicenseHealthFilter] = useState('All');
  const [installedOnFilter, setInstalledOnFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedSoftwareIds, setSelectedSoftwareIds] = useState(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
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

  // Draft values for the add form.
  const [newSoftware, setNewSoftware] = useState(EMPTY_SOFTWARE);

  // Snapshot of whichever software row is currently being edited.
  const [editingData, setEditingData] = useState(EMPTY_SOFTWARE);

  const normalizeDateValue = (value) => (value ? String(value).split('T')[0] : '');
  const formatDate = (value) => normalizeDateValue(value) || '-';

  // Keep the view aligned with query param navigation.
  useEffect(() => {
    setActiveView(viewParam === 'add' ? 'add' : 'list');
  }, [viewParam]);

  // Generic add-form change handler.
  const handleChange = (e) => {
    setNewSoftware({
      ...newSoftware,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSoftware = async () => {
    if (newSoftware.name && newSoftware.vendor) {
      // Sanitizer keeps payload aligned with backend schema rules.
      const created = await createItem(sanitizeSoftwarePayload(newSoftware));
      if (created) {
        setNewSoftware(EMPTY_SOFTWARE);
      }
    }
  };

  // Delete uses shared hook; refresh/error behavior is centralized.
  const handleDelete = async (id) => {
    await deleteItem(id);
  };

  const handleStartEdit = (software) => {
    setEditingId(software.id);
    setEditingData({
      ...software,
      // Date inputs expect YYYY-MM-DD, so drop the time section if present.
      license_expiry: normalizeDateValue(software.license_expiry),
      installation_date: normalizeDateValue(software.installation_date),
    });
  };

  // Generic edit-form change handler.
  const handleEditChange = (e) => {
    setEditingData({
      ...editingData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveEdit = async () => {
    // Reuse same sanitizer as create path to prevent payload drift.
    const updated = await updateItem(editingId, sanitizeSoftwarePayload(editingData));
    if (updated) {
      setEditingId(null);
    }
  };

  // Leave edit mode and discard unsaved local changes.
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setVendorFilter('All');
    setLicenseFilter('All');
    setLicenseHealthFilter('All');
    setInstalledOnFilter('All');
    setSortField('name');
    setSortDirection('asc');
  };

  // =========================
  // Bulk Delete Actions
  // =========================
  const handleSelectSoftware = (softwareId) => {
    const updated = new Set(selectedSoftwareIds);
    if (updated.has(softwareId)) {
      updated.delete(softwareId);
    } else {
      updated.add(softwareId);
    }
    setSelectedSoftwareIds(updated);
  };

  const handleSelectAllVisibleSoftware = () => {
    if (selectedSoftwareIds.size === sortedSoftware.length && sortedSoftware.length > 0) {
      setSelectedSoftwareIds(new Set());
    } else {
      setSelectedSoftwareIds(new Set(sortedSoftware.map((s) => s.id)));
    }
  };

  const handleClearBulkSelection = () => {
    setSelectedSoftwareIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedSoftwareIds.size === 0) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedSoftwareIds.size} software item(s)? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setBulkDeleteLoading(true);
      await bulkDeleteSoftware(Array.from(selectedSoftwareIds));
      // Refresh the page to update the list
      window.location.reload();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      setBulkDeleteLoading(false);
    }
  };

  // =========================
  // CSV Import/Export
  // =========================
  const csvFileInputRef = React.useRef(null);
  const [csvError, setCsvError] = useState('');

  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setCsvError('');
      await importSoftwareFromCSV(file);
      window.location.reload();
    } catch (err) {
      setCsvError(getApiErrorMessage(err, 'Failed to import software from CSV.'));
    }

    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  const handleExportCSV = async () => {
    try {
      setCsvError('');
      const response = await exportSoftwareToCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'software.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setCsvError(getApiErrorMessage(err, 'Failed to export software to CSV.'));
    }
  };

  const softwareVendors = [...new Set(softwareList.map((s) => s.vendor).filter(Boolean))];
  const installedOnOptions = [...new Set(softwareList.map((s) => s.installed_on).filter(Boolean))].sort((left, right) => {
    return String(left).localeCompare(String(right));
  });

  const filteredSoftware = softwareList.filter((software) => {
    const remaining = daysUntil(software.license_expiry);
    const healthStatus = remaining === null
      ? 'No Expiry'
      : remaining < 0
      ? 'Expired'
      : remaining <= 30
      ? 'Expiring'
      : 'Valid';

    const query = searchTerm.toLowerCase();
    // These are the fields people usually remember when searching for software.
    const matchesSearch =
      (software.name || '').toLowerCase().includes(query) ||
      (software.version || '').toLowerCase().includes(query) ||
      (software.installed_on || '').toLowerCase().includes(query);
    const matchesVendor = vendorFilter === 'All' || software.vendor === vendorFilter;
    const matchesLicense = licenseFilter === 'All' || software.license_type === licenseFilter;
    const matchesLicenseHealth = licenseHealthFilter === 'All' || healthStatus === licenseHealthFilter;
    const matchesInstalledOn = installedOnFilter === 'All' || software.installed_on === installedOnFilter;
    return matchesSearch && matchesVendor && matchesLicense && matchesLicenseHealth && matchesInstalledOn;
  });

  const sortedSoftware = [...filteredSoftware].sort((left, right) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortField === 'license_expiry' || sortField === 'installation_date') {
      return (parseDateSortValue(left[sortField]) - parseDateSortValue(right[sortField])) * direction;
    }

    const leftValue = String(left[sortField] || '').toLowerCase();
    const rightValue = String(right[sortField] || '').toLowerCase();
    if (leftValue < rightValue) return -1 * direction;
    if (leftValue > rightValue) return 1 * direction;
    return 0;
  });

  const handleDashboardVendorClick = (vendor) => {
    setVendorFilter((current) => (current === vendor ? 'All' : vendor));
  };

  const handleDashboardLicenseClick = (licenseType) => {
    setLicenseFilter((current) => (current === licenseType ? 'All' : licenseType));
  };

  const handleDashboardLicenseHealthClick = (health) => {
    setLicenseHealthFilter((current) => (current === health ? 'All' : health));
  };

  const dashboardMetrics = useMemo(() => {
    const vendorCounts = softwareList.reduce((counts, software) => {
      const key = String(software.vendor || 'Unspecified').trim() || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    const licenseCounts = softwareList.reduce((counts, software) => {
      const key = String(software.license_type || 'Unspecified').trim() || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    const expiringSoon = softwareList.filter((software) => {
      const remaining = daysUntil(software.license_expiry);
      return remaining !== null && remaining >= 0 && remaining <= 30;
    }).length;

    const expired = softwareList.filter((software) => {
      const remaining = daysUntil(software.license_expiry);
      return remaining !== null && remaining < 0;
    }).length;

    const installedEntries = softwareList.filter((software) => software.installed_on).length;
    const noExpiry = softwareList.filter((software) => daysUntil(software.license_expiry) === null).length;
    const valid = softwareList.filter((software) => {
      const remaining = daysUntil(software.license_expiry);
      return remaining !== null && remaining > 30;
    }).length;

    const topVendors = Object.entries(vendorCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);

    const topLicenseTypes = Object.entries(licenseCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4);

    return {
      total: softwareList.length,
      installedEntries,
      expiringSoon,
      expired,
      noExpiry,
      valid,
      topVendors,
      topLicenseTypes,
    };
  }, [softwareList]);

  const healthTotal = Math.max(1, dashboardMetrics.total);
  const healthSegments = [
    { key: 'valid', label: 'Valid', color: '#2ecc71', value: dashboardMetrics.valid },
    { key: 'expiring', label: 'Expiring', color: '#e67e22', value: dashboardMetrics.expiringSoon },
    { key: 'expired', label: 'Expired', color: '#e74c3c', value: dashboardMetrics.expired },
    { key: 'no-expiry', label: 'No Expiry', color: '#95a5a6', value: dashboardMetrics.noExpiry },
  ];

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
            <div style={styles.dashboardPanel}>
              <div style={styles.dashboardHeaderRow}>
                <div>
                  <h3 style={styles.dashboardTitle}>Software Dashboard</h3>
                  <div style={styles.dashboardHint}>Track license health, vendor spread, and installation coverage at a glance.</div>
                  <div style={styles.dashboardSubHint}>Click bars or status labels to filter the table.</div>
                </div>
                <div style={styles.dashboardBadgeRow}>
                  <span style={styles.dashboardBadge}>Total: {dashboardMetrics.total}</span>
                  <span style={styles.dashboardBadge}>Expiring Soon: {dashboardMetrics.expiringSoon}</span>
                  <span style={styles.dashboardBadge}>Expired: {dashboardMetrics.expired}</span>
                </div>
              </div>

              <div style={styles.dashboardKpis}>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Total Software</div>
                  <div style={styles.dashboardKpiValue}>{dashboardMetrics.total}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Installed Records</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#3ba57d' }}>{dashboardMetrics.installedEntries}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Expiring in 30 Days</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#e67e22' }}>{dashboardMetrics.expiringSoon}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Expired Licenses</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#e74c3c' }}>{dashboardMetrics.expired}</div>
                </div>
              </div>

              <div style={styles.dashboardGrid}>
                <div style={styles.dashboardCard}>
                  <h4 style={styles.dashboardCardTitle}>License Health Breakdown</h4>
                  <div style={styles.dashboardDonutWrap}>
                    <div
                      style={{
                        ...styles.dashboardDonut,
                        background: `conic-gradient(
                          #2ecc71 0% ${(dashboardMetrics.valid / healthTotal) * 100}%,
                          #e67e22 ${(dashboardMetrics.valid / healthTotal) * 100}% ${((dashboardMetrics.valid + dashboardMetrics.expiringSoon) / healthTotal) * 100}%,
                          #e74c3c ${((dashboardMetrics.valid + dashboardMetrics.expiringSoon) / healthTotal) * 100}% ${((dashboardMetrics.valid + dashboardMetrics.expiringSoon + dashboardMetrics.expired) / healthTotal) * 100}%,
                          #95a5a6 ${((dashboardMetrics.valid + dashboardMetrics.expiringSoon + dashboardMetrics.expired) / healthTotal) * 100}% 100%
                        )`,
                      }}
                    >
                      <div style={styles.dashboardDonutInner}>{dashboardMetrics.total}</div>
                    </div>
                    <div style={styles.dashboardLegend}>
                      {healthSegments.map((segment) => (
                        <button
                          key={segment.key}
                          type="button"
                          onClick={() => handleDashboardLicenseHealthClick(segment.label)}
                          style={styles.dashboardLegendButton}
                          title={`Filter by ${segment.label}`}
                        >
                          <span style={{ ...styles.dashboardLegendDot, backgroundColor: segment.color }} />
                          <span>{segment.label}: {segment.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={styles.dashboardCard}>
                  <h4 style={styles.dashboardCardTitle}>Top Vendors</h4>
                  {dashboardMetrics.topVendors.length === 0 ? (
                    <div style={styles.dashboardEmpty}>No software yet.</div>
                  ) : (
                    <div style={styles.dashboardBars}>
                      {dashboardMetrics.topVendors.map(([vendor, count]) => {
                        const width = `${Math.max(8, (count / Math.max(1, dashboardMetrics.total)) * 100)}%`;
                        return (
                          <button
                            key={vendor}
                            type="button"
                            onClick={() => handleDashboardVendorClick(vendor)}
                            style={styles.dashboardBarButton}
                            title={`Filter by ${vendor}`}
                          >
                            <div style={styles.dashboardBarRow}>
                              <div style={styles.dashboardBarLabel}>{vendor}</div>
                              <div style={styles.dashboardBarTrack}>
                                <div style={{ ...styles.dashboardBarFill, width }} />
                              </div>
                              <div style={styles.dashboardBarValue}>{count}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={styles.dashboardCard}>
                  <h4 style={styles.dashboardCardTitle}>License Mix</h4>
                  {dashboardMetrics.topLicenseTypes.length === 0 ? (
                    <div style={styles.dashboardEmpty}>No software yet.</div>
                  ) : (
                    <div style={styles.dashboardBars}>
                      {dashboardMetrics.topLicenseTypes.map(([type, count]) => {
                        const width = `${Math.max(8, (count / Math.max(1, dashboardMetrics.total)) * 100)}%`;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleDashboardLicenseClick(type)}
                            style={styles.dashboardBarButton}
                            title={`Filter by ${type}`}
                          >
                            <div style={styles.dashboardBarRow}>
                              <div style={styles.dashboardBarLabel}>{type}</div>
                              <div style={styles.dashboardBarTrack}>
                                <div style={{ ...styles.dashboardBarFill, width }} />
                              </div>
                              <div style={styles.dashboardBarValue}>{count}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div style={styles.dashboardSnapshot}>
                    <div style={styles.dashboardSnapshotValue}>{dashboardMetrics.expiringSoon}</div>
                    <div style={styles.dashboardSnapshotLabel}>licenses expiring within 30 days</div>
                    <div style={styles.dashboardSnapshotSubtext}>
                      {dashboardMetrics.expired} licenses are already expired.
                    </div>
                  </div>
                  <div style={styles.dashboardMiniStats}>
                    <div style={styles.dashboardMiniStat}>
                      <span style={styles.dashboardMiniStatLabel}>Installed</span>
                      <span style={styles.dashboardMiniStatValue}>{dashboardMetrics.installedEntries}</span>
                    </div>
                    <div style={styles.dashboardMiniStat}>
                      <span style={styles.dashboardMiniStatLabel}>Tracked</span>
                      <span style={styles.dashboardMiniStatValue}>{dashboardMetrics.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <select
                value={installedOnFilter}
                onChange={(e) => setInstalledOnFilter(e.target.value)}
                style={styles.filterInput}
              >
                <option value="All">All Installed On</option>
                {installedOnOptions.map((installedOn) => (
                  <option key={installedOn} value={installedOn}>{installedOn}</option>
                ))}
              </select>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                style={styles.filterInput}
              >
                <option value="name">Sort: Name</option>
                <option value="version">Sort: Version</option>
                <option value="vendor">Sort: Vendor</option>
                <option value="license_type">Sort: License Type</option>
                <option value="license_expiry">Sort: License Expiry</option>
                <option value="installed_on">Sort: Installed On</option>
                <option value="installation_date">Sort: Installation Date</option>
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
            {sortedSoftware.length === 0 ? (
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

                {/* CSV Import/Export */}
                <div style={styles.csvToolbar}>
                  {csvError && <span style={{ color: '#e74c3c', fontSize: '13px', marginRight: 'auto' }}>{csvError}</span>}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={styles.csvButtonLabel}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        style={{ display: 'none' }}
                        ref={csvFileInputRef}
                      />
                      <span style={styles.csvButton}>📥 Import CSV</span>
                    </label>
                    <button onClick={handleExportCSV} style={styles.csvButton}>
                      📤 Export CSV
                    </button>
                  </div>
                </div>

                {/* Bulk Delete Toolbar */}
                {selectedSoftwareIds.size > 0 && (
                  <div style={styles.bulkActionToolbar}>
                    <span style={styles.bulkActionCount}>
                      {selectedSoftwareIds.size} item{selectedSoftwareIds.size !== 1 ? 's' : ''} selected
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

                {/* Software Table */}
                <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>
                      <input
                        type="checkbox"
                        checked={selectedSoftwareIds.size === sortedSoftware.length && sortedSoftware.length > 0}
                        onChange={handleSelectAllVisibleSoftware}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
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
                  {sortedSoftware.map((software) => (
                    <tr key={software.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <input
                          type="checkbox"
                          checked={selectedSoftwareIds.has(software.id)}
                          onChange={() => handleSelectSoftware(software.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
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
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
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
  dashboardSubHint: {
    marginTop: '4px',
    color: '#7c8b95',
    fontSize: '12px',
    fontWeight: '600',
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
  dashboardLegendButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: 'inherit',
    textAlign: 'left',
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
  dashboardBarButton: {
    width: '100%',
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
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
    height: '14px',
    borderRadius: '999px',
    backgroundColor: '#e8eef3',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
  },
  dashboardBarFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #1abc9c, #16a085)',
    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
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
};

export default SoftwarePage;