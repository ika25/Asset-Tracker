// Import React and hooks
import React, { useEffect, useState } from 'react';

// Konva canvas components
import { Stage, Layer, Image, Circle, Text, Line, Rect } from 'react-konva';

// API functions
import { getDevices, updateDevice } from '../api/deviceApi';

// Panels
import DevicePanel from '../components/DevicePanel';

const FloorPage = () => {
  // =========================
  // STATE
  // =========================
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [floorImage, setFloorImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const stageRef = React.useRef(null);

  const GRID_SIZE = 20; // pixels
  const SNAP_SIZE = 20; // snap to grid

  // =========================
  // LOAD FLOOR IMAGE
  // =========================
  useEffect(() => {
    const img = new window.Image();
    img.src = '/floor.png'; // must be in public/
    img.onload = () => setFloorImage(img);
  }, []);

  // =========================
  // FETCH DEVICES
  // =========================
  const fetchDevices = async () => {
    try {
      const res = await getDevices();
      setDevices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // =========================
  // HANDLE DRAG
  // =========================
  const handleDragEnd = async (e, device) => {
    let x = e.target.x();
    let y = e.target.y();

    // Snap to grid
    x = Math.round(x / SNAP_SIZE) * SNAP_SIZE;
    y = Math.round(y / SNAP_SIZE) * SNAP_SIZE;

    try {
      await updateDevice(device.id, {
        x_position: x,
        y_position: y,
      });

      // Update UI instantly
      setDevices((prev) =>
        prev.map((d) =>
          d.id === device.id ? { ...d, x_position: x, y_position: y } : d
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // HANDLE CLICK (DESELECT DEVICE)
  // =========================
  const handleStageClick = (e) => {
    if (e.target.getClassName() === 'Circle') return;
    setSelectedDevice(null);
  };

  // =========================
  // GET DEVICE COLOR BY TYPE
  // =========================
  const getDeviceColor = (type) => {
    if (!type) return '#95a5a6'; // Gray for unknown
    const t = type.toLowerCase();
    if (t.includes('pc') || t.includes('laptop')) return '#3498db'; // Blue
    if (t.includes('printer') || t.includes('scanner')) return '#e67e22'; // Orange
    if (t.includes('server')) return '#e74c3c'; // Red
    if (t.includes('switch') || t.includes('router')) return '#9b59b6'; // Purple
    return '#95a5a6'; // Gray default
  };

  // =========================
  // ZOOM CONTROLS WITH MOUSE POSITION
  // =========================
  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.2, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle mouse wheel zoom (zooms to cursor position)
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const mousePointTo = {
      x: e.evt.offsetX / oldScale - position.x / oldScale,
      y: e.evt.offsetY / oldScale - position.y / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.5, Math.min(newScale, 3));

    const newPos = {
      x: -(mousePointTo.x - e.evt.offsetX / newScale) * newScale,
      y: -(mousePointTo.y - e.evt.offsetY / newScale) * newScale,
    };

    setZoom(newScale);
    setPosition(newPos);
  };

  // =========================
  // DRAG MAP PANNING
  // =========================
  const handleMouseDown = (e) => {
    // Don't drag if clicking on a device
    if (e.target.getClassName() === 'Circle') return;
    
    setIsDragging(true);
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setDragStart(pos);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    setPosition((prev) => ({
      x: prev.x + dx / zoom,
      y: prev.y + dy / zoom,
    }));

    setDragStart(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // =========================
  // GRID AND RULER RENDERING
  // =========================
  const generateGridLines = () => {
    const lines = [];
    const mapWidth = 1200;
    const mapHeight = 700;

    for (let i = 0; i <= mapWidth; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`v${i}`}
          points={[i, 0, i, mapHeight]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }
    for (let i = 0; i <= mapHeight; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, i, mapWidth, i]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }
    return lines;
  };

  const generateRulerLabels = () => {
    const labels = [];
    for (let i = 0; i <= 1200; i += 100) {
      labels.push(
        <Text
          key={`x${i}`}
          x={i}
          y={-15}
          text={i}
          fontSize={10}
          fill="#666"
          align="center"
        />
      );
    }
    for (let i = 0; i <= 700; i += 100) {
      labels.push(
        <Text
          key={`y${i}`}
          x={-30}
          y={i}
          text={i}
          fontSize={10}
          fill="#666"
          align="right"
        />
      );
    }
    return labels;
  };

  // =========================
  // FILTER DEVICES
  // =========================
  const filteredDevices = devices.filter((device) => {
    // Search filter
    const searchMatch =
      device.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      device.ip_address?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      device.type?.toLowerCase().includes(searchFilter.toLowerCase());

    // Type filter
    const typeMatch = !typeFilter || device.type?.toLowerCase().includes(typeFilter.toLowerCase());

    // Status filter
    const statusMatch = !statusFilter || device.status === statusFilter;

    return searchMatch && typeMatch && statusMatch;
  });

  // Get unique device types
  const deviceTypes = [...new Set(devices.map((d) => d.type).filter(Boolean))].sort();

  // =========================
  // CALCULATE STATS
  // =========================
  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
  };

  return (
    <div style={styles.container}>
      {/* STATS BAR */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Devices:</span>
          <span style={styles.statValue}>{stats.total}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Online:</span>
          <span style={{ ...styles.statValue, color: '#27ae60' }}>
            {stats.online}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Offline:</span>
          <span style={{ ...styles.statValue, color: '#e74c3c' }}>
            {stats.offline}
          </span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarGroup}>
          <button
            onClick={handleZoomIn}
            style={styles.toolButton}
            title="Zoom In"
          >
            🔍+ (Zoom In)
          </button>
          <button
            onClick={handleZoomOut}
            style={styles.toolButton}
            title="Zoom Out"
          >
            🔍- (Zoom Out)
          </button>
          <button
            onClick={handleResetView}
            style={styles.toolButton}
            title="Reset View"
          >
            ⟲ Reset
          </button>
          <span style={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            style={{
              ...styles.toolButton,
              backgroundColor: showGrid ? '#3ba57d' : '#95a5a6',
            }}
            title="Toggle Grid"
          >
            ⊞ Grid
          </button>
        </div>

        <div style={styles.filterGroup}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={styles.filterSelect}
            title="Filter by device type"
          >
            <option value="">All Types</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
            title="Filter by status"
          >
            <option value="">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search devices by name, IP, or type..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={styles.searchInput}
          />
          {(searchFilter || typeFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchFilter('');
                setTypeFilter('');
                setStatusFilter('');
              }}
              style={styles.clearButton}
              title="Clear all filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* MAP AREA */}
      <div style={styles.mapAreaWrapper}>
        <div style={styles.mapContainer}>
          <Stage
            ref={stageRef}
            width={1200}
            height={700}
            onClick={handleStageClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
            scaleX={zoom}
            scaleY={zoom}
            offsetX={-position.x}
            offsetY={-position.y}
          >
            <Layer>
              {/* Grid Background */}
              {showGrid && generateGridLines()}

              {/* Ruler Labels */}
              {showGrid && generateRulerLabels()}

              {/* Floor Image */}
              {floorImage && (
                <Image image={floorImage} width={1200} height={700} />
              )}

              {/* Devices */}
              {filteredDevices.map((device) => (
                <React.Fragment key={device.id}>
                  <Circle
                    x={device.x_position || 100}
                    y={device.y_position || 100}
                    radius={10}
                    fill={getDeviceColor(device.type)}
                    draggable

                    // Select device
                    onClick={() => {
                      setSelectedDevice(device);
                    }}

                    // Save drag
                    onDragEnd={(e) => handleDragEnd(e, device)}

                    // Highlight selected
                    stroke={
                      selectedDevice?.id === device.id ? 'yellow' : null
                    }
                    strokeWidth={2}
                  />

                  <Text
                    x={(device.x_position || 100) + 12}
                    y={(device.y_position || 100) - 5}
                    text={device.name}
                    fontSize={12}
                    fill="black"
                  />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>

          {/* Instruction Text */}
          <div style={styles.instruction}>
            💡 Drag to pan • Scroll to zoom • Click device to edit • Drag device to move (snaps to grid)
          </div>

          {/* MINIMAP */}
          <div style={styles.minimapContainer}>
            <div style={styles.minimapTitle}>Minimap</div>
            <svg
              width="120"
              height="70"
              style={styles.minimapSvg}
              viewBox="0 0 1200 700"
            >
              {/* Background */}
              <rect width="1200" height="700" fill="#f0f0f0" stroke="#999" strokeWidth="1" />

              {/* Current viewport indicator */}
              <rect
                x={position.x}
                y={position.y}
                width={1200 / zoom}
                height={700 / zoom}
                fill="none"
                stroke="#3ba57d"
                strokeWidth="8"
              />

              {/* Device dots */}
              {filteredDevices.map((device) => (
                <circle
                  key={device.id}
                  cx={device.x_position || 100}
                  cy={device.y_position || 100}
                  r="2"
                  fill={getDeviceColor(device.type)}
                />
              ))}
            </svg>
          </div>
        </div>


      </div>

      {/* MODALS */}
      {selectedDevice && (
        <DevicePanel
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          refreshDevices={fetchDevices}
        />
      )}


    </div>
  );
};

// =========================
// STYLES
// =========================
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: '#f5f6fa',
  },
  statsBar: {
    backgroundColor: '#fff',
    padding: '12px 20px',
    borderBottom: '2px solid #ecf0f1',
    display: 'flex',
    gap: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#34495e',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  toolbar: {
    backgroundColor: '#fff',
    padding: '15px 20px',
    borderBottom: '1px solid #ecf0f1',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  toolbarGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  filterGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    backgroundColor: '#fff',
  },
  toolButton: {
    padding: '8px 16px',
    backgroundColor: '#3ba57d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  zoomLevel: {
    marginLeft: '10px',
    padding: '6px 12px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#34495e',
  },
  searchContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    minWidth: '250px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 35px 10px 15px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'inherit',
  },
  clearButton: {
    position: 'absolute',
    right: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#7f8c8d',
    padding: '5px 10px',
  },
  mapAreaWrapper: {
    flex: 1,
    display: 'flex',
    gap: '0',
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'auto',
    backgroundColor: '#f9f9f9',
  },
  instruction: {
    marginTop: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },

  minimapContainer: {
    position: 'absolute',
    bottom: '30px',
    right: '30px',
    backgroundColor: '#fff',
    border: '2px solid #3ba57d',
    borderRadius: '6px',
    padding: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 100,
  },
  minimapTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px',
    textAlign: 'center',
  },
  minimapSvg: {
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
};

export default FloorPage;