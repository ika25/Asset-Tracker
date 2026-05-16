import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../api/deviceApi';
import { getHardware } from '../api/hardwareApi';
import { getSoftware } from '../api/softwareApi';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [devicesRes, hardwareRes, softwareRes] = await Promise.all([
          getDevices(),
          getHardware(),
          getSoftware(),
        ]);

        setDevices(devicesRes.data || []);
        setHardware(hardwareRes.data || []);
        setSoftware(softwareRes.data || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toDate = useCallback((value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const startOfToday = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const daysUntil = useCallback((value) => {
    const d = toDate(value);
    if (!d) return null;
    const today = startOfToday();
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }, [startOfToday, toDate]);

  const isExpiringInDays = useCallback((value, maxDays) => {
    const remaining = daysUntil(value);
    return remaining !== null && remaining >= 0 && remaining <= maxDays;
  }, [daysUntil]);

  const getNormalizedStatus = useCallback((value) => {
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
  }, []);

  const formatDateLabel = useCallback((value) => {
    if (!value) return '-';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  const getComparableDate = useCallback((value) => {
    if (!value) return null;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const getRecentWindowDays = useCallback(() => {
    if (timeRange === '7d') return 7;
    if (timeRange === '90d') return 90;
    return 30;
  }, [timeRange]);

  const isWithinWindow = useCallback((value, windowDays) => {
    const date = getComparableDate(value);
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - windowDays);

    return date >= windowStart;
  }, [getComparableDate]);

  const metrics = useMemo(() => {
    const windowDays = getRecentWindowDays();

    const recentDevices = devices.filter((device) => {
      const createdLike = device.created_at || device.updated_at || device.install_date;
      return isWithinWindow(createdLike, windowDays);
    });

    const recentHardware = hardware.filter((item) => {
      const createdLike = item.created_at || item.updated_at || item.purchase_date;
      return isWithinWindow(createdLike, windowDays);
    });

    const recentSoftware = software.filter((item) => {
      const createdLike = item.created_at || item.updated_at || item.installation_date;
      return isWithinWindow(createdLike, windowDays);
    });

    const activeDevices = devices.filter((d) => getNormalizedStatus(d.status) === 'active').length;
    const inactiveDevices = devices.filter((d) => getNormalizedStatus(d.status) === 'inactive').length;
    const retiredDevices = devices.filter((d) => getNormalizedStatus(d.status) === 'retired').length;
    const unknownDevices = devices.length - activeDevices - inactiveDevices - retiredDevices;

    const licensesExpiringSoon = software.filter((s) => isExpiringInDays(s.license_expiry, 30)).length;
    const warrantiesExpiringSoon = [
      ...devices.filter((d) => isExpiringInDays(d.warranty_expiry, 60)),
      ...hardware.filter((h) => isExpiringInDays(h.warranty_expiry, 60)),
    ].length;

    const inactiveList = devices
      .filter((d) => getNormalizedStatus(d.status) === 'inactive')
      .slice(0, 6)
      .map((d) => ({
        id: `device-${d.id}`,
        type: 'Inactive Device',
        name: d.name || `Device #${d.id}`,
        detail: d.ip_address || 'No IP',
      }));

    const expiringLicenses = software
      .filter((s) => isExpiringInDays(s.license_expiry, 30))
      .slice(0, 6)
      .map((s) => ({
        id: `software-${s.id}`,
        type: 'License Expiring',
        name: s.name || `Software #${s.id}`,
        detail: `${daysUntil(s.license_expiry)} day(s) left`,
      }));

    const expiringWarranties = [
      ...devices
        .filter((d) => isExpiringInDays(d.warranty_expiry, 60))
        .map((d) => ({
          id: `device-warranty-${d.id}`,
          type: 'Warranty Expiring',
          name: d.name || `Device #${d.id}`,
          detail: `${daysUntil(d.warranty_expiry)} day(s) left`,
        })),
      ...hardware
        .filter((h) => isExpiringInDays(h.warranty_expiry, 60))
        .map((h) => ({
          id: `hardware-warranty-${h.id}`,
          type: 'Warranty Expiring',
          name: h.name || `Hardware #${h.id}`,
          detail: `${daysUntil(h.warranty_expiry)} day(s) left`,
        })),
    ]
      .slice(0, 6);

    const latestRecords = [
      ...devices.map((d) => ({ id: `device-${d.id}`, group: 'Device', name: d.name || `Device #${d.id}`, seq: Number(d.id) || 0 })),
      ...hardware.map((h) => ({ id: `hardware-${h.id}`, group: 'Hardware', name: h.name || `Hardware #${h.id}`, seq: Number(h.id) || 0 })),
      ...software.map((s) => ({ id: `software-${s.id}`, group: 'Software', name: s.name || `Software #${s.id}`, seq: Number(s.id) || 0 })),
    ]
      .sort((a, b) => b.seq - a.seq)
      .slice(0, 10);

    const latestActivity = [
      ...devices.slice(-4).map((device) => ({
        id: `recent-device-${device.id}`,
        kind: 'Device',
        name: device.name || `Device #${device.id}`,
        detail: device.ip_address || 'No IP assigned',
        stamp: formatDateLabel(device.install_date || device.updated_at || device.created_at),
      })),
      ...hardware.slice(-4).map((item) => ({
        id: `recent-hardware-${item.id}`,
        kind: 'Hardware',
        name: item.name || `Hardware #${item.id}`,
        detail: item.location || item.type || 'Asset record',
        stamp: formatDateLabel(item.purchase_date || item.updated_at || item.created_at),
      })),
      ...software.slice(-4).map((item) => ({
        id: `recent-software-${item.id}`,
        kind: 'Software',
        name: item.name || `Software #${item.id}`,
        detail: item.vendor || item.license_type || 'Software record',
        stamp: formatDateLabel(item.installation_date || item.updated_at || item.created_at),
      })),
    ]
      .filter((entry) => entry.name)
      .slice(-8)
      .reverse();

    const deviceTypeCounts = devices.reduce((counts, device) => {
      const key = String(device.type || 'Unspecified').trim() || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    const hardwareTypeCounts = hardware.reduce((counts, item) => {
      const key = String(item.type || 'Unspecified').trim() || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    const softwareVendorCounts = software.reduce((counts, item) => {
      const key = String(item.vendor || 'Unspecified').trim() || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    const topCategories = [
      ...Object.entries(deviceTypeCounts).map(([name, value]) => ({ group: 'Devices', name, value })),
      ...Object.entries(hardwareTypeCounts).map(([name, value]) => ({ group: 'Hardware', name, value })),
      ...Object.entries(softwareVendorCounts).map(([name, value]) => ({ group: 'Software', name, value })),
    ]
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const mappedDevices = devices.filter((device) => device.x_position !== null && device.x_position !== undefined && device.y_position !== null && device.y_position !== undefined).length;
    const licensedSoftware = software.filter((item) => item.license_expiry || item.installation_date).length;
    const documentedHardware = hardware.filter((item) => item.purchase_date || item.warranty_expiry).length;
    const recentActivityCount = recentDevices.length + recentHardware.length + recentSoftware.length;

    const softwareHealth = software.reduce((counts, item) => {
      const remaining = daysUntil(item.license_expiry);

      if (remaining === null) {
        counts.noExpiry += 1;
      } else if (remaining < 0) {
        counts.expired += 1;
      } else if (remaining <= 30) {
        counts.expiring += 1;
      } else {
        counts.valid += 1;
      }

      return counts;
    }, {
      valid: 0,
      expiring: 0,
      expired: 0,
      noExpiry: 0,
    });

    const hardwareHealth = hardware.reduce((counts, item) => {
      const remaining = daysUntil(item.warranty_expiry);

      if (remaining === null) {
        counts.noWarranty += 1;
      } else if (remaining < 0) {
        counts.expired += 1;
      } else if (remaining <= 60) {
        counts.expiring += 1;
      } else {
        counts.valid += 1;
      }

      return counts;
    }, {
      valid: 0,
      expiring: 0,
      expired: 0,
      noWarranty: 0,
    });

    return {
      totalDevices: devices.length,
      activeDevices,
      inactiveDevices,
      retiredDevices,
      unknownDevices,
      hardwareCount: hardware.length,
      softwareCount: software.length,
      licensesExpiringSoon,
      warrantiesExpiringSoon,
      mappedDevices,
      licensedSoftware,
      documentedHardware,
      recentActivityCount,
      recentWindowLabel: timeRange === '7d' ? 'Last 7 days' : timeRange === '90d' ? 'Last 90 days' : 'Last 30 days',
      attentionItems: [...inactiveList, ...expiringLicenses, ...expiringWarranties].slice(0, 10),
      latestRecords,
      latestActivity,
      topCategories,
      softwareHealth,
      hardwareHealth,
    };
  }, [daysUntil, devices, formatDateLabel, getNormalizedStatus, getRecentWindowDays, hardware, isExpiringInDays, isWithinWindow, software, timeRange]);

  const totalForChart = Math.max(1, metrics.activeDevices + metrics.inactiveDevices + metrics.retiredDevices + metrics.unknownDevices);
  const activePct = (metrics.activeDevices / totalForChart) * 100;
  const inactivePct = (metrics.inactiveDevices / totalForChart) * 100;
  const attentionCount = metrics.attentionItems.length;
  const softwareHealthTotal = Math.max(1, metrics.softwareHealth.valid + metrics.softwareHealth.expiring + metrics.softwareHealth.expired + metrics.softwareHealth.noExpiry);
  const hardwareHealthTotal = Math.max(1, metrics.hardwareHealth.valid + metrics.hardwareHealth.expiring + metrics.hardwareHealth.expired + metrics.hardwareHealth.noWarranty);

  if (loading) {
    return <div style={styles.page}><div style={styles.loading}>Loading dashboard...</div></div>;
  }

  if (error) {
    return <div style={styles.page}><div style={styles.error}>{error}</div></div>;
  }

  return (
    <div style={styles.pageShell}>
      <div style={styles.heroCard}>
        <div style={styles.heroContent}>
          <div style={styles.heroEyebrow}>Executive overview</div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>A single view of inventory health, risk, and recent activity across devices, hardware, and software.</p>
          <div style={styles.timeRangeRow}>
            <span style={styles.timeRangeLabel}>View</span>
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                style={{
                  ...styles.timeRangeButton,
                  ...(timeRange === range ? styles.timeRangeButtonActive : {}),
                }}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
          <div style={styles.quickActions}>
            <Link to="/devices?view=add" style={styles.actionLink}>Add Device</Link>
            <Link to="/software?view=add" style={styles.actionLink}>Add Software</Link>
            <Link to="/hardware?view=add" style={styles.actionLink}>Add Hardware</Link>
            <Link to="/floor" style={styles.actionLink}>Open Floor Map</Link>
            <Link to="/devices?view=list" style={styles.actionLink}>View Devices</Link>
          </div>
        </div>
        <div style={styles.heroMetricPanel}>
          <div style={styles.heroMetricLabel}>Total inventory</div>
          <div style={styles.heroMetricValue}>{metrics.totalDevices + metrics.hardwareCount + metrics.softwareCount}</div>
          <div style={styles.heroMetricHint}>{attentionCount} items need attention</div>
          <div style={styles.heroMetricPills}>
            <span style={styles.heroPill}>Devices {metrics.totalDevices}</span>
            <span style={styles.heroPill}>Hardware {metrics.hardwareCount}</span>
            <span style={styles.heroPill}>Software {metrics.softwareCount}</span>
            <span style={styles.heroPill}>{metrics.recentWindowLabel}</span>
          </div>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Active Devices</div><div style={{ ...styles.kpiValue, color: '#1f8f61' }}>{metrics.activeDevices}</div><div style={styles.kpiMeta}>{Math.round(activePct)}% of devices</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Inactive Devices</div><div style={{ ...styles.kpiValue, color: '#d64545' }}>{metrics.inactiveDevices}</div><div style={styles.kpiMeta}>{Math.round(inactivePct)}% of devices</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Mapped Devices</div><div style={styles.kpiValue}>{metrics.mappedDevices}</div><div style={styles.kpiMeta}>Visible on the floor map</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Hardware Assets</div><div style={styles.kpiValue}>{metrics.hardwareCount}</div><div style={styles.kpiMeta}>{metrics.documentedHardware} documented</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Software Assets</div><div style={styles.kpiValue}>{metrics.softwareCount}</div><div style={styles.kpiMeta}>{metrics.licensedSoftware} with license or install dates</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Expiring Soon</div><div style={{ ...styles.kpiValue, color: '#e67e22' }}>{metrics.licensesExpiringSoon + metrics.warrantiesExpiringSoon}</div><div style={styles.kpiMeta}>Licenses and warranties within range</div></div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardTitle}>Asset Health Donuts</h3>
            <span style={styles.cardBadge}>Unified view</span>
          </div>
          <div style={styles.healthDonutGrid}>
            <div style={styles.healthDonutCard}>
              <div style={styles.healthDonutTitle}>Device Status</div>
              <div style={styles.healthDonutRow}>
                <div
                  style={{
                    ...styles.smallDonut,
                    background: `conic-gradient(
                      #2ecc71 0% ${(metrics.activeDevices / totalForChart) * 100}%,
                      #e67e22 ${(metrics.activeDevices / totalForChart) * 100}% ${((metrics.activeDevices + metrics.inactiveDevices) / totalForChart) * 100}%,
                      #e74c3c ${((metrics.activeDevices + metrics.inactiveDevices) / totalForChart) * 100}% ${((metrics.activeDevices + metrics.inactiveDevices + metrics.retiredDevices) / totalForChart) * 100}%,
                      #95a5a6 ${((metrics.activeDevices + metrics.inactiveDevices + metrics.retiredDevices) / totalForChart) * 100}% 100%
                    )`,
                  }}
                >
                  <div style={styles.smallDonutInner}>{metrics.totalDevices}</div>
                </div>
                <div style={styles.legend}>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#2ecc71' }} /> Active: {metrics.activeDevices}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#e67e22' }} /> Inactive: {metrics.inactiveDevices}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#e74c3c' }} /> Retired: {metrics.retiredDevices}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#95a5a6' }} /> Unknown: {metrics.unknownDevices}</div>
                </div>
              </div>
            </div>

            <div style={styles.healthDonutCard}>
              <div style={styles.healthDonutTitle}>Software Licenses</div>
              <div style={styles.healthDonutRow}>
                <div
                  style={{
                    ...styles.smallDonut,
                    background: `conic-gradient(
                      #2ecc71 0% ${(metrics.softwareHealth.valid / softwareHealthTotal) * 100}%,
                      #e67e22 ${(metrics.softwareHealth.valid / softwareHealthTotal) * 100}% ${((metrics.softwareHealth.valid + metrics.softwareHealth.expiring) / softwareHealthTotal) * 100}%,
                      #e74c3c ${((metrics.softwareHealth.valid + metrics.softwareHealth.expiring) / softwareHealthTotal) * 100}% ${((metrics.softwareHealth.valid + metrics.softwareHealth.expiring + metrics.softwareHealth.expired) / softwareHealthTotal) * 100}%,
                      #95a5a6 ${((metrics.softwareHealth.valid + metrics.softwareHealth.expiring + metrics.softwareHealth.expired) / softwareHealthTotal) * 100}% 100%
                    )`,
                  }}
                >
                  <div style={styles.smallDonutInner}>{metrics.softwareCount}</div>
                </div>
                <div style={styles.legend}>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#2ecc71' }} /> Valid: {metrics.softwareHealth.valid}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#e67e22' }} /> Expiring: {metrics.softwareHealth.expiring}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#e74c3c' }} /> Expired: {metrics.softwareHealth.expired}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#95a5a6' }} /> No Expiry: {metrics.softwareHealth.noExpiry}</div>
                </div>
              </div>
            </div>

            <div style={styles.healthDonutCard}>
              <div style={styles.healthDonutTitle}>Hardware Warranties</div>
              <div style={styles.healthDonutRow}>
                <div
                  style={{
                    ...styles.smallDonut,
                    background: `conic-gradient(
                      #2ecc71 0% ${(metrics.hardwareHealth.valid / hardwareHealthTotal) * 100}%,
                      #e67e22 ${(metrics.hardwareHealth.valid / hardwareHealthTotal) * 100}% ${((metrics.hardwareHealth.valid + metrics.hardwareHealth.expiring) / hardwareHealthTotal) * 100}%,
                      #e74c3c ${((metrics.hardwareHealth.valid + metrics.hardwareHealth.expiring) / hardwareHealthTotal) * 100}% ${((metrics.hardwareHealth.valid + metrics.hardwareHealth.expiring + metrics.hardwareHealth.expired) / hardwareHealthTotal) * 100}%,
                      #95a5a6 ${((metrics.hardwareHealth.valid + metrics.hardwareHealth.expiring + metrics.hardwareHealth.expired) / hardwareHealthTotal) * 100}% 100%
                    )`,
                  }}
                >
                  <div style={styles.smallDonutInner}>{metrics.hardwareCount}</div>
                </div>
                <div style={styles.legend}>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#2ecc71' }} /> Valid: {metrics.hardwareHealth.valid}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#e67e22' }} /> Expiring: {metrics.hardwareHealth.expiring}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#e74c3c' }} /> Expired: {metrics.hardwareHealth.expired}</div>
                  <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#95a5a6' }} /> No Warranty: {metrics.hardwareHealth.noWarranty}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardTitle}>Attention Needed</h3>
            <span style={styles.cardBadgeDanger}>{attentionCount} items</span>
          </div>
          {metrics.attentionItems.length === 0 ? (
            <div style={styles.empty}>No urgent issues right now.</div>
          ) : (
            <div style={styles.list}>
              {metrics.attentionItems.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  <div style={styles.listType}>{item.type}</div>
                  <div style={styles.listName}>{item.name}</div>
                  <div style={styles.listDetail}>{item.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.secondaryGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardTitle}>Inventory Mix</h3>
            <span style={styles.cardBadge}>Top categories</span>
          </div>
          {metrics.topCategories.length === 0 ? (
            <div style={styles.empty}>No category data yet.</div>
          ) : (
            <div style={styles.barList}>
              {metrics.topCategories.map((entry) => {
                const maxValue = metrics.topCategories[0]?.value || 1;
                return (
                  <div key={`${entry.group}-${entry.name}`} style={styles.barRow}>
                    <div>
                      <div style={styles.barLabel}>{entry.name}</div>
                      <div style={styles.barSubLabel}>{entry.group}</div>
                    </div>
                    <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${(entry.value / maxValue) * 100}%` }} /></div>
                    <div style={styles.barValue}>{entry.value}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardTitle}>Recent Activity</h3>
            <span style={styles.cardBadge}>Latest updates</span>
          </div>
          {metrics.latestActivity.length === 0 ? (
            <div style={styles.empty}>No recent activity found.</div>
          ) : (
            <div style={styles.activityList}>
              {metrics.latestActivity.map((item) => (
                <div key={item.id} style={styles.activityItem}>
                  <div style={styles.activityIcon}>{item.kind.slice(0, 1)}</div>
                  <div style={styles.activityBody}>
                    <div style={styles.activityTopRow}>
                      <span style={styles.listType}>{item.kind}</span>
                      <span style={styles.activityStamp}>{item.stamp}</span>
                    </div>
                    <div style={styles.listName}>{item.name}</div>
                    <div style={styles.listDetail}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeaderRow}>
          <h3 style={styles.cardTitle}>Recent Records</h3>
          <span style={styles.cardBadge}>Newest first</span>
        </div>
        {metrics.latestRecords.length === 0 ? (
          <div style={styles.empty}>No records found.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>ID</th>
                </tr>
              </thead>
              <tbody>
                {metrics.latestRecords.map((row) => (
                  <tr key={row.id}>
                    <td style={styles.td}>{row.group}</td>
                    <td style={styles.td}>{row.name}</td>
                    <td style={styles.td}>{row.seq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    position: 'relative',
    paddingBottom: '10px',
  },
  pageShell: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    background: 'linear-gradient(180deg, #f6f8fc 0%, #eef3f8 100%)',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 18px 50px rgba(31, 45, 61, 0.08)',
    overflow: 'hidden',
  },
  heroCard: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.65fr)',
    gap: '16px',
    alignItems: 'stretch',
    background: 'linear-gradient(135deg, #0f766e 0%, #3ba57d 55%, #6cc3a0 100%)',
    borderRadius: '18px',
    padding: '20px',
    color: '#fff',
    boxShadow: '0 20px 40px rgba(59, 165, 125, 0.18)',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '14px',
  },
  heroEyebrow: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  loading: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '22px',
    color: '#425466',
    fontWeight: '600',
  },
  error: {
    backgroundColor: '#feecec',
    border: '1px solid #f2b8b8',
    borderRadius: '10px',
    padding: '14px',
    color: '#a83232',
    fontWeight: '600',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    color: '#ffffff',
    fontSize: '32px',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: 'rgba(255, 255, 255, 0.88)',
    maxWidth: '68ch',
  },
  quickActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  timeRangeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  timeRangeLabel: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.82)',
  },
  timeRangeButton: {
    padding: '8px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
  },
  timeRangeButtonActive: {
    backgroundColor: '#fff',
    color: '#145c49',
    border: '1px solid #fff',
  },
  actionLink: {
    textDecoration: 'none',
    backgroundColor: '#ffffff',
    color: '#145c49',
    padding: '10px 16px',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: '0 8px 20px rgba(15, 118, 110, 0.18)',
  },
  heroMetricPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '10px',
    backdropFilter: 'blur(10px)',
  },
  heroMetricLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255, 255, 255, 0.82)',
    fontWeight: '700',
  },
  heroMetricValue: {
    fontSize: '44px',
    lineHeight: 1,
    fontWeight: '800',
    letterSpacing: '-0.04em',
  },
  heroMetricHint: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.92)',
  },
  heroMetricPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '6px',
  },
  heroPill: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    fontSize: '12px',
    fontWeight: '700',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid #e9edf2',
    boxShadow: '0 10px 28px rgba(31, 45, 61, 0.05)',
  },
  kpiLabel: {
    color: '#6c7a89',
    fontSize: '12px',
    fontWeight: '600',
  },
  kpiValue: {
    color: '#1f2d3d',
    fontSize: '28px',
    fontWeight: '700',
    marginTop: '6px',
  },
  kpiMeta: {
    marginTop: '6px',
    color: '#6e7c8d',
    fontSize: '12px',
    fontWeight: '600',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
    gap: '12px',
  },
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(280px, 1.1fr)',
    gap: '12px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    border: '1px solid #e9edf2',
    padding: '14px',
    boxShadow: '0 10px 28px rgba(31, 45, 61, 0.05)',
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  cardTitle: {
    margin: 0,
    color: '#1f2d3d',
    fontSize: '16px',
  },
  cardBadge: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#eaf7f1',
    color: '#2b7a58',
    fontSize: '12px',
    fontWeight: '700',
  },
  cardBadgeDanger: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#fdecea',
    color: '#b23b3b',
    fontSize: '12px',
    fontWeight: '700',
  },
  statusWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  donut: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  donutInner: {
    width: '74px',
    height: '74px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#1f2d3d',
    border: '1px solid #e9edf2',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    color: '#334155',
    fontSize: '13px',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  legendHint: {
    color: '#7a8998',
    fontSize: '12px',
    marginTop: '2px',
  },
  progressBars: {
    marginTop: '12px',
    display: 'grid',
    gap: '6px',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#556273',
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: '#edf2f7',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
  },
  list: {
    display: 'grid',
    gap: '8px',
    maxHeight: '340px',
    overflowY: 'auto',
  },
  listItem: {
    border: '1px solid #e9edf2',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#fafcff',
  },
  listType: {
    color: '#64748b',
    fontSize: '11px',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  listName: {
    color: '#1f2d3d',
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '3px',
  },
  listDetail: {
    color: '#5f6c7b',
    fontSize: '12px',
    marginTop: '3px',
  },
  empty: {
    color: '#7d8a98',
    fontSize: '13px',
    fontWeight: '500',
    padding: '10px 0',
  },
  barList: {
    display: 'grid',
    gap: '12px',
  },
  barRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 170px) 1fr 34px',
    gap: '12px',
    alignItems: 'center',
  },
  barLabel: {
    color: '#1f2d3d',
    fontSize: '13px',
    fontWeight: '700',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  barSubLabel: {
    color: '#6c7a89',
    fontSize: '12px',
    marginTop: '2px',
  },
  barTrack: {
    height: '10px',
    borderRadius: '999px',
    backgroundColor: '#edf2f7',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #3ba57d, #6cc3a0)',
  },
  barValue: {
    textAlign: 'right',
    color: '#1f2d3d',
    fontWeight: '700',
  },
  healthDonutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '12px',
  },
  healthDonutCard: {
    border: '1px solid #e9edf2',
    borderRadius: '12px',
    padding: '12px',
    background: 'linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)',
  },
  healthDonutTitle: {
    color: '#1f2d3d',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '10px',
  },
  healthDonutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  smallDonut: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  smallDonutInner: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#1f2d3d',
    border: '1px solid #e9edf2',
  },
  activityList: {
    display: 'grid',
    gap: '10px',
  },
  activityItem: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr',
    gap: '10px',
    padding: '12px',
    border: '1px solid #e9edf2',
    borderRadius: '12px',
    background: 'linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)',
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #eef8f4 0%, #f7fbff 100%)',
    color: '#2b7a58',
    fontWeight: '800',
  },
  activityBody: {
    minWidth: 0,
  },
  activityTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '4px',
  },
  activityStamp: {
    color: '#7d8a98',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    fontSize: '12px',
    color: '#5f6c7b',
    borderBottom: '1px solid #e9edf2',
    padding: '8px',
  },
  td: {
    fontSize: '13px',
    color: '#1f2d3d',
    borderBottom: '1px solid #f0f3f7',
    padding: '8px',
  },
};

export default Dashboard;