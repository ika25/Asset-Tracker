import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createHardware,
  deleteHardware,
  getHardware,
  updateHardware,
  bulkDeleteHardware,
  importHardwareFromCSV,
  exportHardwareToCSV,
} from '../api/hardwareApi';
import { getApiErrorMessage } from '../api/client';
import { useCrudResource } from '../hooks/useCrudResource';
import { sanitizeHardwarePayload } from '../utils/inventoryPayloadConfig';

// Hardware page keeps add/list/edit in one place and relies on the shared CRUD hook
// so error/loading behavior is consistent with the other inventory pages.

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

const parseDateSortValue = (value) => {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const parseNumericSortValue = (value) => {
  if (value === null || value === undefined) {
    return Number.NEGATIVE_INFINITY;
  }

  const match = String(value).replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NEGATIVE_INFINITY;
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

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const HardwarePage = () => {
  // Support deep links like /hardware?view=add.
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const [activeView, setActiveView] = useState(viewParam === 'add' ? 'add' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [manufacturerFilter, setManufacturerFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedHardwareIds, setSelectedHardwareIds] = useState(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
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

  // Draft values for the add form.
  const [newHardware, setNewHardware] = useState(EMPTY_HARDWARE);

  // Snapshot of the item currently being edited.
  const [editingData, setEditingData] = useState(EMPTY_HARDWARE);

  const normalizeDateValue = (value) => (value ? String(value).split('T')[0] : '');
  const formatDate = (value) => normalizeDateValue(value) || '-';

  // Keep UI in sync when user navigates with query params.
  useEffect(() => {
    setActiveView(viewParam === 'add' ? 'add' : 'list');
  }, [viewParam]);

  // Generic add-form change handler.
  const handleChange = (e) => {
    setNewHardware({
      ...newHardware,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddHardware = async () => {
    if (newHardware.name && newHardware.type) {
      // Use shared sanitizer so payload shape always matches backend validation.
      const created = await createItem(sanitizeHardwarePayload(newHardware));
      if (created) {
        setNewHardware(EMPTY_HARDWARE);
      }
    }
  };

  // Delete uses shared hook; list refresh is handled there.
  const handleDelete = async (id) => {
    await deleteItem(id);
  };

  const handleStartEdit = (hardware) => {
    setEditingId(hardware.id);
    setEditingData({
      ...hardware,
      // Date inputs expect YYYY-MM-DD, so trim timestamp if API returns one.
      purchase_date: normalizeDateValue(hardware.purchase_date),
      warranty_expiry: normalizeDateValue(hardware.warranty_expiry),
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
    // Same sanitizer for create/update keeps request format consistent over time.
    const updated = await updateItem(editingId, sanitizeHardwarePayload(editingData));
    if (updated) {
      setEditingId(null);
    }
  };

  // Exit edit mode without persisting local edits.
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All');
    setManufacturerFilter('All');
    setSortField('name');
    setSortDirection('asc');
  };

  // =========================
  // Bulk Delete Actions
  // =========================
  const handleSelectHardware = (hardwareId) => {
    const updated = new Set(selectedHardwareIds);
    if (updated.has(hardwareId)) {
      updated.delete(hardwareId);
    } else {
      updated.add(hardwareId);
    }
    setSelectedHardwareIds(updated);
  };

  const handleSelectAllVisibleHardware = () => {
    if (selectedHardwareIds.size === sortedHardware.length && sortedHardware.length > 0) {
      setSelectedHardwareIds(new Set());
    } else {
      setSelectedHardwareIds(new Set(sortedHardware.map((h) => h.id)));
    }
  };

  const handleClearBulkSelection = () => {
    setSelectedHardwareIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedHardwareIds.size === 0) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedHardwareIds.size} hardware item(s)? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setBulkDeleteLoading(true);
      await bulkDeleteHardware(Array.from(selectedHardwareIds));
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
      await importHardwareFromCSV(file);
      window.location.reload();
    } catch (err) {
      setCsvError(getApiErrorMessage(err, 'Failed to import hardware from CSV.'));
    }

    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  const handleExportCSV = async () => {
    try {
      setCsvError('');
      const response = await exportHardwareToCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hardware.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setCsvError(getApiErrorMessage(err, 'Failed to export hardware to CSV.'));
    }
  };

  const hardwareTypes = [...new Set(hardwareList.map((h) => h.type).filter(Boolean))];
  const manufacturerOptions = [...new Set(hardwareList.map((h) => h.manufacturer).filter(Boolean))].sort((left, right) => {
    return String(left).localeCompare(String(right));
  });

  const filteredHardware = hardwareList.filter((hardware) => {
    const query = searchTerm.toLowerCase();
    // Search is broad on purpose: users usually remember one clue, not exact fields.
    const matchesSearch =
      (hardware.name || '').toLowerCase().includes(query) ||
      (hardware.model || '').toLowerCase().includes(query) ||
      (hardware.manufacturer || '').toLowerCase().includes(query) ||
      (hardware.location || '').toLowerCase().includes(query);
    const matchesType = typeFilter === 'All' || hardware.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || hardware.status === statusFilter;
    const matchesManufacturer = manufacturerFilter === 'All' || hardware.manufacturer === manufacturerFilter;
    return matchesSearch && matchesType && matchesStatus && matchesManufacturer;
  });

  const sortedHardware = [...filteredHardware].sort((left, right) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortField === 'purchase_date' || sortField === 'warranty_expiry') {
      return (parseDateSortValue(left[sortField]) - parseDateSortValue(right[sortField])) * direction;
    }

    if (sortField === 'cost') {
      return (parseNumericSortValue(left.cost) - parseNumericSortValue(right.cost)) * direction;
    }

    const leftValue = String(left[sortField] || '').toLowerCase();
    const rightValue = String(right[sortField] || '').toLowerCase();
    if (leftValue < rightValue) return -1 * direction;
    if (leftValue > rightValue) return 1 * direction;
    return 0;
  });

  const dashboardMetrics = useMemo(() => {
    const typeCounts = hardwareList.reduce((counts, hardware) => {
      const key = String(hardware.type || 'Unspecified').trim() || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    const statusCounts = hardwareList.reduce((counts, hardware) => {
      const key = normalizeStatus(hardware.status) || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, { active: 0, inactive: 0, retired: 0, 'for sale': 0, unknown: 0 });

    const expiringSoon = hardwareList.filter((hardware) => {
      const remaining = daysUntil(hardware.warranty_expiry);
      return remaining !== null && remaining >= 0 && remaining <= 60;
    }).length;

    const expired = hardwareList.filter((hardware) => {
      const remaining = daysUntil(hardware.warranty_expiry);
      return remaining !== null && remaining < 0;
    }).length;

    const totalCost = hardwareList.reduce((sum, hardware) => {
      const parsed = parseNumericSortValue(hardware.cost);
      return Number.isFinite(parsed) && parsed > 0 ? sum + parsed : sum;
    }, 0);

    const costEntries = hardwareList.filter((hardware) => parseNumericSortValue(hardware.cost) > 0).length;
    const averageCost = costEntries > 0 ? totalCost / costEntries : 0;

    const topTypes = Object.entries(typeCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);

    return {
      total: hardwareList.length,
      expiringSoon,
      expired,
      averageCost,
      topTypes,
      statusCounts,
    };
  }, [hardwareList]);

  const statusTotal = Math.max(
    1,
    dashboardMetrics.statusCounts.active
      + dashboardMetrics.statusCounts.inactive
      + dashboardMetrics.statusCounts.retired
      + dashboardMetrics.statusCounts['for sale']
      + dashboardMetrics.statusCounts.unknown,
  );

  const statusSegments = [
    { key: 'active', label: 'Active', color: '#2ecc71', value: dashboardMetrics.statusCounts.active },
    { key: 'inactive', label: 'Inactive', color: '#e67e22', value: dashboardMetrics.statusCounts.inactive },
    { key: 'retired', label: 'Retired', color: '#e74c3c', value: dashboardMetrics.statusCounts.retired },
    { key: 'for sale', label: 'For Sale', color: '#8e44ad', value: dashboardMetrics.statusCounts['for sale'] },
    { key: 'unknown', label: 'Unknown', color: '#95a5a6', value: dashboardMetrics.statusCounts.unknown },
  ];

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
            <div style={styles.dashboardPanel}>
              <div style={styles.dashboardHeaderRow}>
                <div>
                  <h3 style={styles.dashboardTitle}>Hardware Dashboard</h3>
                  <div style={styles.dashboardHint}>Visualize hardware status, asset mix, and warranty coverage in one place.</div>
                </div>
                <div style={styles.dashboardBadgeRow}>
                  <span style={styles.dashboardBadge}>Total: {dashboardMetrics.total}</span>
                  <span style={styles.dashboardBadge}>Expiring Soon: {dashboardMetrics.expiringSoon}</span>
                  <span style={styles.dashboardBadge}>Expired: {dashboardMetrics.expired}</span>
                </div>
              </div>

              <div style={styles.dashboardKpis}>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Total Hardware</div>
                  <div style={styles.dashboardKpiValue}>{dashboardMetrics.total}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Expiring in 60 Days</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#e67e22' }}>{dashboardMetrics.expiringSoon}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Expired Warranties</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#e74c3c' }}>{dashboardMetrics.expired}</div>
                </div>
                <div style={styles.dashboardKpiCard}>
                  <div style={styles.dashboardKpiLabel}>Avg. Cost</div>
                  <div style={{ ...styles.dashboardKpiValue, color: '#3ba57d' }}>{dashboardMetrics.averageCost ? `$${Math.round(dashboardMetrics.averageCost).toLocaleString()}` : '-'}</div>
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
                          #2ecc71 0% ${(dashboardMetrics.statusCounts.active / statusTotal) * 100}%,
                          #e67e22 ${(dashboardMetrics.statusCounts.active / statusTotal) * 100}% ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive) / statusTotal) * 100}%,
                          #e74c3c ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive) / statusTotal) * 100}% ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive + dashboardMetrics.statusCounts.retired) / statusTotal) * 100}%,
                          #8e44ad ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive + dashboardMetrics.statusCounts.retired) / statusTotal) * 100}% ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive + dashboardMetrics.statusCounts.retired + dashboardMetrics.statusCounts['for sale']) / statusTotal) * 100}%,
                          #95a5a6 ${((dashboardMetrics.statusCounts.active + dashboardMetrics.statusCounts.inactive + dashboardMetrics.statusCounts.retired + dashboardMetrics.statusCounts['for sale']) / statusTotal) * 100}% 100%
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
                  <h4 style={styles.dashboardCardTitle}>Top Hardware Types</h4>
                  {dashboardMetrics.topTypes.length === 0 ? (
                    <div style={styles.dashboardEmpty}>No hardware yet.</div>
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
                  <h4 style={styles.dashboardCardTitle}>Warranty Snapshot</h4>
                  <div style={styles.dashboardSnapshot}>
                    <div style={styles.dashboardSnapshotValue}>{dashboardMetrics.expiringSoon}</div>
                    <div style={styles.dashboardSnapshotLabel}>warranties expiring within 60 days</div>
                    <div style={styles.dashboardSnapshotSubtext}>
                      {dashboardMetrics.expired} hardware items are already expired.
                    </div>
                  </div>
                  <div style={styles.dashboardMiniStats}>
                    <div style={styles.dashboardMiniStat}>
                      <span style={styles.dashboardMiniStatLabel}>Tracked</span>
                      <span style={styles.dashboardMiniStatValue}>{dashboardMetrics.total}</span>
                    </div>
                    <div style={styles.dashboardMiniStat}>
                      <span style={styles.dashboardMiniStatLabel}>Avg. Cost</span>
                      <span style={styles.dashboardMiniStatValue}>{dashboardMetrics.averageCost ? Math.round(dashboardMetrics.averageCost).toLocaleString() : '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <select
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                style={styles.filterInput}
              >
                <option value="All">All Manufacturers</option>
                {manufacturerOptions.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                style={styles.filterInput}
              >
                <option value="name">Sort: Name</option>
                <option value="type">Sort: Type</option>
                <option value="model">Sort: Model</option>
                <option value="manufacturer">Sort: Manufacturer</option>
                <option value="purchase_date">Sort: Purchase Date</option>
                <option value="cost">Sort: Cost</option>
                <option value="location">Sort: Location</option>
                <option value="warranty_expiry">Sort: Warranty Expiry</option>
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
            {sortedHardware.length === 0 ? (
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
                {selectedHardwareIds.size > 0 && (
                  <div style={styles.bulkActionToolbar}>
                    <span style={styles.bulkActionCount}>
                      {selectedHardwareIds.size} item{selectedHardwareIds.size !== 1 ? 's' : ''} selected
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

                {/* Hardware Table */}
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>
                        <input
                          type="checkbox"
                          checked={selectedHardwareIds.size === sortedHardware.length && sortedHardware.length > 0}
                          onChange={handleSelectAllVisibleHardware}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
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
                    {sortedHardware.map((hardware) => (
                      <tr key={hardware.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <input
                            type="checkbox"
                            checked={selectedHardwareIds.has(hardware.id)}
                            onChange={() => handleSelectHardware(hardware.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
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
};

export default HardwarePage;