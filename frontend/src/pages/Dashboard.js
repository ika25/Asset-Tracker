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

    return 'unknown';
  }, []);

  const metrics = useMemo(() => {
    const activeDevices = devices.filter((d) => getNormalizedStatus(d.status) === 'active').length;
    const inactiveDevices = devices.filter((d) => getNormalizedStatus(d.status) === 'inactive').length;
    const unknownDevices = devices.length - activeDevices - inactiveDevices;

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

    return {
      totalDevices: devices.length,
      activeDevices,
      inactiveDevices,
      unknownDevices,
      hardwareCount: hardware.length,
      softwareCount: software.length,
      licensesExpiringSoon,
      warrantiesExpiringSoon,
      attentionItems: [...inactiveList, ...expiringLicenses, ...expiringWarranties].slice(0, 10),
      latestRecords,
    };
  }, [daysUntil, devices, getNormalizedStatus, hardware, isExpiringInDays, software]);

  const totalForChart = Math.max(1, metrics.activeDevices + metrics.inactiveDevices + metrics.unknownDevices);
  const activePct = (metrics.activeDevices / totalForChart) * 100;
  const inactivePct = (metrics.inactiveDevices / totalForChart) * 100;
  const unknownPct = 100 - activePct - inactivePct;

  if (loading) {
    return <div style={styles.page}><div style={styles.loading}>Loading dashboard...</div></div>;
  }

  if (error) {
    return <div style={styles.page}><div style={styles.error}>{error}</div></div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Asset health and inventory overview</p>
        </div>
        <div style={styles.quickActions}>
          <Link to="/devices?view=add" style={styles.actionLink}>Add Device</Link>
          <Link to="/floor" style={styles.actionLink}>Open Floor Map</Link>
          <Link to="/devices?view=list" style={styles.actionLink}>View Devices</Link>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Total Devices</div><div style={styles.kpiValue}>{metrics.totalDevices}</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Active Devices</div><div style={{ ...styles.kpiValue, color: '#1f8f61' }}>{metrics.activeDevices}</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Inactive Devices</div><div style={{ ...styles.kpiValue, color: '#d64545' }}>{metrics.inactiveDevices}</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Hardware Assets</div><div style={styles.kpiValue}>{metrics.hardwareCount}</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Software Assets</div><div style={styles.kpiValue}>{metrics.softwareCount}</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Licenses Expiring (30d)</div><div style={styles.kpiValue}>{metrics.licensesExpiringSoon}</div></div>
        <div style={styles.kpiCard}><div style={styles.kpiLabel}>Warranties Expiring (60d)</div><div style={styles.kpiValue}>{metrics.warrantiesExpiringSoon}</div></div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Status Breakdown</h3>
          <div style={styles.statusWrap}>
            <div
              style={{
                ...styles.donut,
                background: `conic-gradient(#2ecc71 0% ${activePct}%, #e74c3c ${activePct}% ${activePct + inactivePct}%, #95a5a6 ${activePct + inactivePct}% 100%)`,
              }}
            >
              <div style={styles.donutInner}>{metrics.totalDevices}</div>
            </div>
            <div style={styles.legend}>
              <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#2ecc71' }} /> Active: {metrics.activeDevices}</div>
              <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#e74c3c' }} /> Inactive: {metrics.inactiveDevices}</div>
              <div style={styles.legendRow}><span style={{ ...styles.legendDot, backgroundColor: '#95a5a6' }} /> Unknown: {metrics.unknownDevices}</div>
              <div style={styles.legendHint}>Unknown includes devices without active/inactive status.</div>
            </div>
          </div>
          <div style={styles.progressBars}>
            <div style={styles.progressLabel}>Active {Math.round(activePct)}%</div>
            <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${activePct}%`, backgroundColor: '#2ecc71' }} /></div>
            <div style={styles.progressLabel}>Inactive {Math.round(inactivePct)}%</div>
            <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${inactivePct}%`, backgroundColor: '#e74c3c' }} /></div>
            <div style={styles.progressLabel}>Unknown {Math.round(unknownPct)}%</div>
            <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${unknownPct}%`, backgroundColor: '#95a5a6' }} /></div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Attention Needed</h3>
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

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent Records</h3>
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
    color: '#1f2d3d',
    fontSize: '28px',
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#6b7b8d',
  },
  quickActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionLink: {
    textDecoration: 'none',
    backgroundColor: '#3ba57d',
    color: '#fff',
    padding: '9px 14px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '14px',
    border: '1px solid #e9edf2',
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
    gap: '12px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e9edf2',
    padding: '14px',
  },
  cardTitle: {
    margin: '0 0 12px 0',
    color: '#1f2d3d',
    fontSize: '16px',
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