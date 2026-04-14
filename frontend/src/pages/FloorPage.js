// Import React and hooks
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Konva canvas components
import { Stage, Layer, Group, Image, Text, Line, Circle } from 'react-konva';

// API functions
import { getDevices, updateDevice } from '../api/deviceApi';

// Panels
import DevicePanel from '../components/DevicePanel';

const FloorPage = () => {
  const BASE_MAP_WIDTH = 1200;
  const BASE_MAP_HEIGHT = 700;

  // =========================
  // STATE
  // =========================
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [floorImage, setFloorImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 700 });
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredDevice, setHoveredDevice] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState({
    width: BASE_MAP_WIDTH,
    height: BASE_MAP_HEIGHT,
  });
  const [contentBounds, setContentBounds] = useState({
    x: 0,
    y: 0,
    width: BASE_MAP_WIDTH,
    height: BASE_MAP_HEIGHT,
  });
  const stageRef = useRef(null);
  const mapViewportRef = useRef(null);
  const hasAutoFittedRef = useRef(false);

  const GRID_SIZE = 20; // pixels
  const SNAP_SIZE = 1; // near pixel-level placement accuracy
  const ICON_SIZE = 45;
  const ICON_HALF = Math.round(ICON_SIZE / 2);

  const mapScaleX = mapSize.width / BASE_MAP_WIDTH;
  const mapScaleY = mapSize.height / BASE_MAP_HEIGHT;

  const detectContentBounds = (img) => {
    try {
      const w = img.naturalWidth || img.width || BASE_MAP_WIDTH;
      const h = img.naturalHeight || img.height || BASE_MAP_HEIGHT;
      const sampleMax = 900;
      const scale = Math.min(1, sampleMax / Math.max(w, h));
      const sw = Math.max(1, Math.floor(w * scale));
      const sh = Math.max(1, Math.floor(h * scale));

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return { x: 0, y: 0, width: w, height: h };
      }

      ctx.drawImage(img, 0, 0, sw, sh);
      const data = ctx.getImageData(0, 0, sw, sh).data;

      let minX = sw;
      let minY = sh;
      let maxX = -1;
      let maxY = -1;

      const step = 2;
      for (let y = 0; y < sh; y += step) {
        for (let x = 0; x < sw; x += step) {
          const i = (y * sw + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Consider non-white and non-transparent pixels as content.
          const isContent = a > 12 && !(r > 245 && g > 245 && b > 245);
          if (!isContent) continue;

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      if (maxX < 0 || maxY < 0) {
        return { x: 0, y: 0, width: w, height: h };
      }

      const padding = 20;
      const bx = Math.max(0, Math.floor(minX / scale) - padding);
      const by = Math.max(0, Math.floor(minY / scale) - padding);
      const bw = Math.min(w - bx, Math.ceil((maxX - minX) / scale) + padding * 2);
      const bh = Math.min(h - by, Math.ceil((maxY - minY) / scale) + padding * 2);

      return { x: bx, y: by, width: Math.max(1, bw), height: Math.max(1, bh) };
    } catch (err) {
      return {
        x: 0,
        y: 0,
        width: img.naturalWidth || img.width || BASE_MAP_WIDTH,
        height: img.naturalHeight || img.height || BASE_MAP_HEIGHT,
      };
    }
  };

  const fitToView = useCallback(() => {
    const safeWidth = Math.max(200, viewportSize.width);
    const safeHeight = Math.max(200, viewportSize.height);
    const fitZoom = Math.min(
      safeWidth / contentBounds.width,
      safeHeight / contentBounds.height
    );
    const nextZoom = Math.max(0.2, Math.min(6, fitZoom));

    const contentCenterX = contentBounds.x + contentBounds.width / 2;
    const contentCenterY = contentBounds.y + contentBounds.height / 2;

    setZoom(nextZoom);
    setPosition({
      x: safeWidth / 2 - contentCenterX * nextZoom,
      y: safeHeight / 2 - contentCenterY * nextZoom,
    });
  }, [viewportSize.width, viewportSize.height, contentBounds.width, contentBounds.height, contentBounds.x, contentBounds.y]);

  // =========================
  // LOAD FLOOR IMAGE
  // =========================
  useEffect(() => {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = '/floor.png'; // must be in public/
    img.onload = () => {
      setFloorImage(img);
      setMapSize({
        width: img.naturalWidth || img.width || BASE_MAP_WIDTH,
        height: img.naturalHeight || img.height || BASE_MAP_HEIGHT,
      });
      setContentBounds(detectContentBounds(img));
    };
  }, []);

  useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;

    const resize = () => {
      setViewportSize({
        width: Math.max(400, Math.floor(el.clientWidth)),
        height: Math.max(300, Math.floor(el.clientHeight)),
      });
    };

    resize();

    const observer = new window.ResizeObserver(resize);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!floorImage || hasAutoFittedRef.current) return;
    fitToView();
    hasAutoFittedRef.current = true;
  }, [floorImage, fitToView]);

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
    const nodePos = e.target.position();

    let x = nodePos.x / mapScaleX;
    let y = nodePos.y / mapScaleY;

    // Snap to grid
    x = Math.round(x / SNAP_SIZE) * SNAP_SIZE;
    y = Math.round(y / SNAP_SIZE) * SNAP_SIZE;

    x = Math.max(0, Math.min(x, BASE_MAP_WIDTH));
    y = Math.max(0, Math.min(y, BASE_MAP_HEIGHT));

    // Keep dropped node visually aligned with snapped/persisted coords.
    e.target.position({
      x: x * mapScaleX,
      y: y * mapScaleY,
    });

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

  const updateTooltipPosition = (e) => {
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    setTooltipPos({ x: pointer.x + 14, y: pointer.y + 14 });
  };

  // =========================
  // HANDLE CLICK (DESELECT DEVICE)
  // =========================
  const handleStageClick = (e) => {
    if (e.target.draggable()) return;
    setSelectedDevice(null);
  };

  // =========================
  // Handle mouse wheel zoom (zooms to cursor position)
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.2, Math.min(newScale, 6));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setZoom(newScale);
    setPosition(newPos);
  };

  // =========================
  // DRAG MAP PANNING
  // =========================
  const handleMouseDown = (e) => {
    const t = e.target;
    if (typeof t.draggable === 'function' && (t.draggable() || t.getParent()?.draggable())) return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    setIsPanning(true);
    setPanStart(pointer);
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const dx = pointer.x - panStart.x;
    const dy = pointer.y - panStart.y;

    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setPanStart(pointer);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // =========================
  // GRID AND RULER RENDERING
  // =========================
  const generateGridLines = () => {
    const lines = [];
    const mapWidth = mapSize.width;
    const mapHeight = mapSize.height;

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
    for (let i = 0; i <= mapSize.width; i += 100) {
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
    for (let i = 0; i <= mapSize.height; i += 100) {
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

          <button
            onClick={fitToView}
            style={styles.toolButton}
            title="Fit map to screen"
          >
            Fit Map
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
          <div ref={mapViewportRef} style={styles.stageViewport}>
          <Stage
            ref={stageRef}
            width={viewportSize.width}
            height={viewportSize.height}
            onClick={handleStageClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            <Layer>
              <Group x={position.x} y={position.y} scaleX={zoom} scaleY={zoom}>
              {/* Grid Background */}
              {showGrid && generateGridLines()}

              {/* Ruler Labels */}
              {showGrid && generateRulerLabels()}

              {/* Floor Image */}
              {floorImage && (
                <Image
                  image={floorImage}
                  width={mapSize.width}
                  height={mapSize.height}
                  imageSmoothingEnabled={true}
                />
              )}

              {/* Devices */}
              {filteredDevices.filter((device) => {
                const hasX = device.x_position !== null && device.x_position !== undefined && device.x_position !== '';
                const hasY = device.y_position !== null && device.y_position !== undefined && device.y_position !== '';
                return hasX && hasY;
              }).map((device) => {
                const hasX = device.x_position !== null && device.x_position !== undefined && device.x_position !== '';
                const hasY = device.y_position !== null && device.y_position !== undefined && device.y_position !== '';
                const rawX = hasX ? Number(device.x_position) : NaN;
                const rawY = hasY ? Number(device.y_position) : NaN;
                const logicalX = Number.isFinite(rawX) ? rawX : 0;
                const logicalY = Number.isFinite(rawY) ? rawY : 0;
                const x = logicalX * mapScaleX;
                const y = logicalY * mapScaleY;
                const icon = device.icon || '💻';

                const status = (device.status || '').toLowerCase();
                const dotColor = status === 'online' ? '#2ecc71' : status === 'offline' ? '#e74c3c' : '#95a5a6';

                return (
                  <Group
                    key={device.id}
                    x={x}
                    y={y}
                    draggable
                    onClick={() => setSelectedDevice(device)}
                    onMouseEnter={(e) => {
                      setHoveredDevice(device);
                      updateTooltipPosition(e);
                    }}
                    onMouseMove={updateTooltipPosition}
                    onMouseLeave={() => setHoveredDevice(null)}
                    onDragStart={() => setHoveredDevice(null)}
                    onDragEnd={(e) => handleDragEnd(e, device)}
                  >
                    <Text
                      x={-ICON_HALF}
                      y={-ICON_HALF}
                      text={icon}
                      fontSize={ICON_SIZE}
                      stroke={selectedDevice?.id === device.id ? 'yellow' : undefined}
                      strokeWidth={selectedDevice?.id === device.id ? 1 : 0}
                    />
                    {/* Status dot badge */}
                    <Circle
                      x={8}
                      y={-ICON_HALF - 8}
                      radius={6}
                      fill={dotColor}
                      stroke="white"
                      strokeWidth={1}
                      listening={false}
                    />
                    <Text
                      x={ICON_HALF + 8}
                      y={-8}
                      text={device.name}
                      fontSize={12}
                      fill="black"
                      listening={false}
                    />
                  </Group>
                );
              })}
              </Group>
            </Layer>
          </Stage>

          {hoveredDevice && (
            <div
              style={{
                ...styles.tooltip,
                left: tooltipPos.x,
                top: tooltipPos.y,
              }}
            >
              <div style={styles.tooltipTitle}>{hoveredDevice.name || 'Unnamed Device'}</div>
              <div>IP: {hoveredDevice.ip_address || 'N/A'}</div>
              <div>Type: {hoveredDevice.type || 'N/A'}</div>
              <div>Status: {hoveredDevice.status || 'N/A'}</div>
              <div>Location: {hoveredDevice.location || 'N/A'}</div>
            </div>
          )}
          </div>

          {/* Instruction Text */}
          <div style={styles.instruction}>
            💡 Drag to pan • Scroll to zoom • Click device to edit • Drag device to move (snaps to grid)
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
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  stageViewport: {
    width: '100%',
    height: '100%',
    minHeight: '420px',
    position: 'relative',
    border: '1px solid #dfe6e9',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  tooltip: {
    position: 'absolute',
    transform: 'translate(0, 0)',
    pointerEvents: 'none',
    backgroundColor: 'rgba(24, 32, 43, 0.94)',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    lineHeight: '1.4',
    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
    maxWidth: '240px',
    zIndex: 10,
  },
  tooltipTitle: {
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '4px',
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


};

export default FloorPage;