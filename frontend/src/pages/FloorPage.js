// Import React and hooks
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Konva canvas components
import { Stage, Layer, Group, Image, Text, Line, Circle, Rect } from 'react-konva';

// API functions
import { createDevice, getDevices, updateDevice } from '../api/deviceApi';
import { getApiErrorMessage } from '../api/client';
import { useCrudResource } from '../hooks/useCrudResource';
import {
  DEVICE_STATUS_OPTIONS,
  DEVICE_TYPE_OPTIONS,
  getCategoryLabel,
  getVisibleDeviceFields,
  sanitizeDevicePayload,
} from '../utils/deviceFormConfig';

// Panels
import DevicePanel from '../components/DevicePanel';

const ICON_OPTIONS = ['💻', '🖥️', '🖨️', '🛜', '📡', '🗄️', '📱', '📷'];
const FLOOR_IMAGE_STORAGE_KEY = 'asset-tracker.floor-map-image';
const FLOOR_LAYOUTS_STORAGE_KEY = 'asset-tracker.floor-map-layouts';
const ACTIVE_LAYOUT_STORAGE_KEY = 'asset-tracker.floor-map-active-layout';
const FLOOR_ZONES_STORAGE_KEY = 'asset-tracker.floor-map-zones';

const ZONE_COLORS = [
  { fill: 'rgba(52,152,219,0.15)', stroke: '#3498db', label: 'Blue' },
  { fill: 'rgba(46,204,113,0.15)', stroke: '#2ecc71', label: 'Green' },
  { fill: 'rgba(155,89,182,0.15)', stroke: '#9b59b6', label: 'Purple' },
  { fill: 'rgba(230,126,34,0.15)', stroke: '#e67e22', label: 'Orange' },
  { fill: 'rgba(231,76,60,0.15)', stroke: '#e74c3c', label: 'Red' },
  { fill: 'rgba(241,196,15,0.15)', stroke: '#f1c40f', label: 'Yellow' },
  { fill: 'rgba(26,188,156,0.15)', stroke: '#1abc9c', label: 'Teal' },
];
const DEFAULT_FLOOR_IMAGE_PATH = '/floor.png';
const DEFAULT_LAYOUT_ID = 'default-layout';
const EMPTY_DEVICE = {
  name: '',
  manufacturer: '',
  user_name: '',
  ip_address: '',
  type: '',
  icon: '💻',
  includeOnMap: true,
  os: '',
  ram: '',
  disk_space: '',
  device_age: '',
  serial_number: '',
  install_date: '',
  location: '',
  status: 'Active',
};

// Important: x/y positions are saved in logical map coordinates (BASE_MAP_* scale),
// not screen pixels. This keeps placement stable across zoom levels and screen sizes.

const FloorPage = () => {
  const BASE_MAP_WIDTH = 1200;
  const BASE_MAP_HEIGHT = 700;

  // =========================
  // STATE
  // =========================
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
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState(EMPTY_DEVICE);
  const [isPlacingDevice, setIsPlacingDevice] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState(null);
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
  const floorImageInputRef = useRef(null);
  const eraseCanvasRef = useRef(null);       // offscreen canvas for erase operations
  const konvaFloorImageRef = useRef(null);   // direct ref to Konva Image node
  const isEraserActiveRef = useRef(false);   // mouse-held state (avoids stale closure)
  const [layoutOptions, setLayoutOptions] = useState([
    { id: DEFAULT_LAYOUT_ID, name: 'Default Layout', src: DEFAULT_FLOOR_IMAGE_PATH },
  ]);
  const [activeLayoutId, setActiveLayoutId] = useState(DEFAULT_LAYOUT_ID);

  // Zones: { [layoutId]: Zone[] }  where Zone = { id, label, x, y, w, h, colorIndex }
  const [zonesByLayout, setZonesByLayout] = useState({});
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [zoneDrawStart, setZoneDrawStart] = useState(null);
  const [zoneDrawCurrent, setZoneDrawCurrent] = useState(null);
  const [showZonePanel, setShowZonePanel] = useState(false);
  const [nextZoneColorIndex, setNextZoneColorIndex] = useState(0);

  // Eraser
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(20);
  const {
    items: devices,
    setItems: setDevices,
    loading,
    saving,
    error,
    setError,
    refresh,
    createItem,
  } = useCrudResource({
    listFn: getDevices,
    createFn: createDevice,
    updateFn: updateDevice,
    deleteFn: async () => ({ data: null }),
    loadErrorMessage: 'Failed to fetch devices for the floor map.',
    createErrorMessage: 'Unable to create devices from the floor map.',
    updateErrorMessage: 'Failed to update device position.',
    deleteErrorMessage: 'Unable to delete devices from the floor map.',
  });

  const GRID_SIZE = 20; // pixels
  const SNAP_SIZE = 1; // near pixel-level placement accuracy
  const ICON_SIZE = 45;
  const ICON_HALF = Math.round(ICON_SIZE / 2);

  const mapScaleX = mapSize.width / BASE_MAP_WIDTH;
  const mapScaleY = mapSize.height / BASE_MAP_HEIGHT;
  const newDeviceFields = getVisibleDeviceFields(newDevice);

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

  const persistLayouts = useCallback((layouts, activeId) => {
    const customLayouts = layouts.filter((layout) => layout.id !== DEFAULT_LAYOUT_ID);
    window.localStorage.setItem(FLOOR_LAYOUTS_STORAGE_KEY, JSON.stringify(customLayouts));
    window.localStorage.setItem(ACTIVE_LAYOUT_STORAGE_KEY, activeId);
  }, []);

  const persistZones = useCallback((zonesMap) => {
    window.localStorage.setItem(FLOOR_ZONES_STORAGE_KEY, JSON.stringify(zonesMap));
  }, []);

  // Zones for the currently active layout
  const activeZones = zonesByLayout[activeLayoutId] || [];

  const updateActiveZones = useCallback((updater) => {
    setZonesByLayout((prev) => {
      const current = prev[activeLayoutId] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      const newMap = { ...prev, [activeLayoutId]: next };
      persistZones(newMap);
      return newMap;
    });
  }, [activeLayoutId, persistZones]);

  const applyFloorImage = useCallback((src) => {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = src;
    img.onload = () => {
      setFloorImage(img);
      setMapSize({
        width: img.naturalWidth || img.width || BASE_MAP_WIDTH,
        height: img.naturalHeight || img.height || BASE_MAP_HEIGHT,
      });
      setContentBounds(detectContentBounds(img));
      hasAutoFittedRef.current = false;
      setError('');
    };
    img.onerror = () => {
      setError('Could not load floor image. Please choose a valid image file.');
    };
  }, [setError]);

  // =========================
  // LOAD ZONES FROM STORAGE
  // =========================
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(FLOOR_ZONES_STORAGE_KEY) || '{}');
      if (saved && typeof saved === 'object') {
        setZonesByLayout(saved);
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  // =========================
  // LOAD FLOOR IMAGE
  // =========================
  useEffect(() => {
    const defaultLayout = {
      id: DEFAULT_LAYOUT_ID,
      name: 'Default Layout',
      src: DEFAULT_FLOOR_IMAGE_PATH,
    };

    let customLayouts = [];

    try {
      const parsed = JSON.parse(window.localStorage.getItem(FLOOR_LAYOUTS_STORAGE_KEY) || '[]');
      customLayouts = Array.isArray(parsed)
        ? parsed.filter((layout) => layout && layout.id && layout.name && layout.src)
        : [];
    } catch {
      customLayouts = [];
    }

    // Migrate legacy single-layout storage to multi-layout list.
    const legacySrc = window.localStorage.getItem(FLOOR_IMAGE_STORAGE_KEY);
    if (legacySrc && !customLayouts.some((layout) => layout.src === legacySrc)) {
      customLayouts.unshift({
        id: `layout-${Date.now()}`,
        name: 'Uploaded Layout',
        src: legacySrc,
      });
      window.localStorage.removeItem(FLOOR_IMAGE_STORAGE_KEY);
    }

    const nextLayouts = [defaultLayout, ...customLayouts];
    const preferredActiveId = window.localStorage.getItem(ACTIVE_LAYOUT_STORAGE_KEY) || defaultLayout.id;
    const activeLayout = nextLayouts.find((layout) => layout.id === preferredActiveId) || defaultLayout;

    setLayoutOptions(nextLayouts);
    setActiveLayoutId(activeLayout.id);
    applyFloorImage(activeLayout.src);
    persistLayouts(nextLayouts, activeLayout.id);
  }, [applyFloorImage, persistLayouts]);

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
      setError('');
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
      setError(getApiErrorMessage(err, 'Failed to update device position.'));
    }
  };

  const updateTooltipPosition = (e) => {
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    setTooltipPos({ x: pointer.x + 14, y: pointer.y + 14 });
  };

  const formatTooltipValue = (value) => {
    return value === null || value === undefined || value === '' ? 'N/A' : value;
  };

  const formatTooltipDate = (value) => {
    if (!value) return 'N/A';
    return String(value).split('T')[0];
  };

  const handleNewDeviceChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setNewDevice((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleOpenAddDevice = () => {
    setError('');
    setSelectedDevice(null);
    setShowAddDeviceModal(false);
    setPendingPlacement(null);
    setIsPlacingDevice(true);
  };

  const handleCloseAddDevice = () => {
    setShowAddDeviceModal(false);
    setIsPlacingDevice(false);
    setPendingPlacement(null);
    setNewDevice(EMPTY_DEVICE);
  };

  const openAddModalAtPlacement = (x, y) => {
    // Clamp placement to map bounds and snap to grid before opening the add form.
    // This prevents out-of-bounds or awkward fractional positions from being saved.
    const snappedX = Math.round(Math.max(0, Math.min(x, BASE_MAP_WIDTH)) / SNAP_SIZE) * SNAP_SIZE;
    const snappedY = Math.round(Math.max(0, Math.min(y, BASE_MAP_HEIGHT)) / SNAP_SIZE) * SNAP_SIZE;

    setPendingPlacement({ x: snappedX, y: snappedY });
    setNewDevice({
      ...EMPTY_DEVICE,
      includeOnMap: true,
      x_position: snappedX,
      y_position: snappedY,
    });
    setIsPlacingDevice(false);
    setShowAddDeviceModal(true);
  };

  const handleAddDevice = async () => {
    const payload = sanitizeDevicePayload({
      ...newDevice,
      x_position: newDevice.includeOnMap ? (newDevice.x_position ?? pendingPlacement?.x ?? 100) : null,
      y_position: newDevice.includeOnMap ? (newDevice.y_position ?? pendingPlacement?.y ?? 100) : null,
    });

    delete payload.includeOnMap;

    const created = await createItem(payload);
    if (created) {
      handleCloseAddDevice();
    }
  };

  const handleSelectFloorImage = () => {
    floorImageInputRef.current?.click();
  };

  const handleFloorImageUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG/JPG/WebP).');
      return;
    }

    const reader = new window.FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) {
        setError('Unable to read the selected image.');
        return;
      }

      const suggestedName = file.name.replace(/\.[^/.]+$/, '') || 'Custom Layout';
      const enteredName = window.prompt('Name this layout:', suggestedName);
      if (enteredName === null) {
        return;
      }

      const layoutName = enteredName.trim() || suggestedName;
      const nextLayout = {
        id: `layout-${Date.now()}`,
        name: layoutName,
        src: dataUrl,
      };

      const nextLayouts = [...layoutOptions, nextLayout];
      setLayoutOptions(nextLayouts);
      setActiveLayoutId(nextLayout.id);
      persistLayouts(nextLayouts, nextLayout.id);
      applyFloorImage(dataUrl);
    };
    reader.onerror = () => {
      setError('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleResetFloorImage = () => {
    setActiveLayoutId(DEFAULT_LAYOUT_ID);
    persistLayouts(layoutOptions, DEFAULT_LAYOUT_ID);
    applyFloorImage(DEFAULT_FLOOR_IMAGE_PATH);
  };

  const handleLayoutChange = (e) => {
    const nextLayoutId = e.target.value;
    const selectedLayout = layoutOptions.find((layout) => layout.id === nextLayoutId);
    if (!selectedLayout) {
      return;
    }

    setActiveLayoutId(nextLayoutId);
    persistLayouts(layoutOptions, nextLayoutId);
    applyFloorImage(selectedLayout.src);
  };

  // =========================
  // ERASER HELPERS
  // =========================
  // Initialise offscreen canvas from the current floor image (once per erase session).
  const initEraseCanvas = useCallback(() => {
    if (eraseCanvasRef.current) return eraseCanvasRef.current;
    if (!floorImage) return null;
    const canvas = document.createElement('canvas');
    canvas.width = mapSize.width;
    canvas.height = mapSize.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(floorImage, 0, 0, mapSize.width, mapSize.height);
    eraseCanvasRef.current = canvas;
    return canvas;
  }, [floorImage, mapSize]);

  // Paint a transparent circle at canvas-pixel coords and refresh the Konva node.
  const applyEraseStroke = useCallback((canvasX, canvasY, size) => {
    const canvas = eraseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Update Konva directly — no React re-render needed during the stroke
    if (konvaFloorImageRef.current) {
      konvaFloorImageRef.current.image(canvas);
      konvaFloorImageRef.current.getLayer()?.batchDraw();
    }
  }, []);

  // On mouse-up: persist the edited image back into the layouts store.
  const commitErase = useCallback(() => {
    const canvas = eraseCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    // Reload into React state so Konva Image prop stays in sync
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => setFloorImage(img);
    // Update the active layout's src in state and localStorage
    setLayoutOptions((prev) => {
      const next = prev.map((l) =>
        l.id === activeLayoutId ? { ...l, src: dataUrl } : l
      );
      persistLayouts(next, activeLayoutId);
      return next;
    });
  }, [activeLayoutId, persistLayouts]);

  // Reset the erase canvas when the layout changes (new image must be re-drawn).
  useEffect(() => {
    eraseCanvasRef.current = null;
  }, [activeLayoutId]);

  // =========================
  // ZONE HANDLERS
  // =========================
  const handleAddZone = () => {
    setIsDrawingZone(true);
    setShowZonePanel(false);
    setIsPlacingDevice(false);
    setSelectedDevice(null);
  };

  const handleCancelZoneDraw = () => {
    setIsDrawingZone(false);
    setZoneDrawStart(null);
    setZoneDrawCurrent(null);
  };

  const handleZoneMouseDown = (e) => {
    if (!isDrawingZone) return;
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    // Convert to logical map space
    const mapX = (pointer.x - position.x) / zoom / mapScaleX;
    const mapY = (pointer.y - position.y) / zoom / mapScaleY;
    setZoneDrawStart({ x: mapX, y: mapY });
    setZoneDrawCurrent({ x: mapX, y: mapY });
  };

  const handleZoneMouseMove = (e) => {
    if (!isDrawingZone || !zoneDrawStart) return;
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const mapX = (pointer.x - position.x) / zoom / mapScaleX;
    const mapY = (pointer.y - position.y) / zoom / mapScaleY;
    setZoneDrawCurrent({ x: mapX, y: mapY });
  };

  const handleZoneMouseUp = () => {
    if (!isDrawingZone || !zoneDrawStart || !zoneDrawCurrent) return;

    const rx = Math.min(zoneDrawStart.x, zoneDrawCurrent.x);
    const ry = Math.min(zoneDrawStart.y, zoneDrawCurrent.y);
    const rw = Math.abs(zoneDrawCurrent.x - zoneDrawStart.x);
    const rh = Math.abs(zoneDrawCurrent.y - zoneDrawStart.y);

    // Ignore tiny accidental drags
    if (rw < 10 || rh < 10) {
      setZoneDrawStart(null);
      setZoneDrawCurrent(null);
      return;
    }

    const label = window.prompt('Zone label (e.g. "Server Room", "HR Dept"):', 'New Zone');
    if (label === null) {
      setZoneDrawStart(null);
      setZoneDrawCurrent(null);
      return;
    }

    const zone = {
      id: `zone-${Date.now()}`,
      label: label.trim() || 'Zone',
      x: rx,
      y: ry,
      w: rw,
      h: rh,
      colorIndex: nextZoneColorIndex % ZONE_COLORS.length,
    };

    updateActiveZones((prev) => [...prev, zone]);
    setNextZoneColorIndex((i) => i + 1);
    setZoneDrawStart(null);
    setZoneDrawCurrent(null);
    setIsDrawingZone(false);
    setShowZonePanel(true);
  };

  const handleRenameZone = (zoneId) => {
    const zone = activeZones.find((z) => z.id === zoneId);
    if (!zone) return;
    const newLabel = window.prompt('Rename zone:', zone.label);
    if (newLabel === null) return;
    updateActiveZones((prev) =>
      prev.map((z) => z.id === zoneId ? { ...z, label: newLabel.trim() || z.label } : z)
    );
  };

  const handleDeleteZone = (zoneId) => {
    const zone = activeZones.find((z) => z.id === zoneId);
    if (!zone) return;
    const confirmed = window.confirm(`Delete zone "${zone.label}"?`);
    if (!confirmed) return;
    updateActiveZones((prev) => prev.filter((z) => z.id !== zoneId));
  };

  const handleCycleZoneColor = (zoneId) => {
    updateActiveZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? { ...z, colorIndex: ((z.colorIndex || 0) + 1) % ZONE_COLORS.length }
          : z
      )
    );
  };

  const handleDeleteActiveLayout = () => {
    if (activeLayoutId === DEFAULT_LAYOUT_ID) {
      setError('Default layout cannot be deleted.');
      return;
    }

    const selectedLayout = layoutOptions.find((layout) => layout.id === activeLayoutId);
    if (!selectedLayout) {
      return;
    }

    const confirmed = window.confirm(`Delete layout "${selectedLayout.name}"?`);
    if (!confirmed) {
      return;
    }

    const nextLayouts = layoutOptions.filter((layout) => layout.id !== activeLayoutId);
    setLayoutOptions(nextLayouts);
    setActiveLayoutId(DEFAULT_LAYOUT_ID);
    persistLayouts(nextLayouts, DEFAULT_LAYOUT_ID);
    applyFloorImage(DEFAULT_FLOOR_IMAGE_PATH);
    setError('');
  };

  // =========================
  // HANDLE CLICK (DESELECT DEVICE)
  // =========================
  const handleStageClick = (e) => {
    if (e.target.draggable()) return;
    if (isDrawingZone) return;

    if (isPlacingDevice) {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;

      // Translate click position from screen space back into map space:
      // 1) remove pan offset, 2) undo zoom, 3) convert scaled image coords to logical coords.
      const mapX = (pointer.x - position.x) / zoom;
      const mapY = (pointer.y - position.y) / zoom;
      const logicalX = mapX / mapScaleX;
      const logicalY = mapY / mapScaleY;

      openAddModalAtPlacement(logicalX, logicalY);
      return;
    }

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

    if (isDrawingZone) {
      handleZoneMouseDown(e);
      return;
    }

    if (isErasing) {
      isEraserActiveRef.current = true;
      const canvasX = (pointer.x - position.x) / zoom;
      const canvasY = (pointer.y - position.y) / zoom;
      initEraseCanvas();
      applyEraseStroke(canvasX, canvasY, eraserSize);
      return;
    }

    setIsPanning(true);
    setPanStart(pointer);
  };

  const handleMouseMove = (e) => {
    if (isDrawingZone && zoneDrawStart) {
      handleZoneMouseMove(e);
      return;
    }

    if (isErasing && isEraserActiveRef.current) {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      const canvasX = (pointer.x - position.x) / zoom;
      const canvasY = (pointer.y - position.y) / zoom;
      applyEraseStroke(canvasX, canvasY, eraserSize);
      return;
    }

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
    if (isDrawingZone && zoneDrawStart) {
      handleZoneMouseUp();
      return;
    }
    if (isErasing && isEraserActiveRef.current) {
      isEraserActiveRef.current = false;
      commitErase();
      return;
    }
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
  const searchQuery = searchFilter.trim().toLowerCase();
  const isSearchActive = searchQuery.length > 0;

  const matchesSearch = (device) => {
    if (!isSearchActive) return true;

    return (
      (device.name || '').toLowerCase().includes(searchQuery) ||
      (device.manufacturer || '').toLowerCase().includes(searchQuery) ||
      (device.ip_address || '').toLowerCase().includes(searchQuery) ||
      (device.type || '').toLowerCase().includes(searchQuery) ||
      (device.user_name || '').toLowerCase().includes(searchQuery) ||
      (device.location || '').toLowerCase().includes(searchQuery)
    );
  };

  const filteredDevices = devices.filter((device) => {
    // Type filter
    const typeMatch = !typeFilter || (device.type || '').toLowerCase() === typeFilter.toLowerCase();

    // Status filter
    const statusMatch = !statusFilter || device.status === statusFilter;

    // We intentionally do NOT filter by search here.
    // Instead, search is visual (glow + dim), so users still see map context while locating matches.
    return typeMatch && statusMatch;
  });

  const highlightedMatches = filteredDevices.filter((device) => matchesSearch(device)).length;

  // Get unique device types
  const deviceTypes = [...new Set([...DEVICE_TYPE_OPTIONS, ...devices.map((d) => d.type).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
  const deviceStatuses = [
    ...DEVICE_STATUS_OPTIONS,
    ...devices
      .map((device) => device.status)
      .filter((status) => status && !DEVICE_STATUS_OPTIONS.includes(status)),
  ];

  // =========================
  // CALCULATE STATS
  // =========================
  const stats = {
    total: devices.length,
    active: devices.filter((d) => d.status === 'Active').length,
    inactive: devices.filter((d) => d.status === 'Inactive').length,
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
          <span style={styles.statLabel}>Active:</span>
          <span style={{ ...styles.statValue, color: '#27ae60' }}>
            {stats.active}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Inactive:</span>
          <span style={{ ...styles.statValue, color: '#e74c3c' }}>
            {stats.inactive}
          </span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        {error && <div style={styles.errorBanner}>{error}</div>}
        <input
          ref={floorImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFloorImageUpload}
        />
        <div style={styles.toolbarGroup}>
          <button
            onClick={handleOpenAddDevice}
            style={styles.toolButton}
            title="Click and then place the device on the map"
          >
            {isPlacingDevice ? 'Click Map to Place' : 'Add Device'}
          </button>

          {isPlacingDevice && (
            <button
              onClick={() => setIsPlacingDevice(false)}
              style={styles.cancelPlacementButton}
              title="Cancel map placement mode"
            >
              Cancel Placement
            </button>
          )}

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

          <button
            onClick={handleSelectFloorImage}
            style={styles.toolButton}
            title="Upload and replace the current floor layout image"
          >
            Update Layout
          </button>

          <button
            onClick={() => {
              if (isDrawingZone) {
                handleCancelZoneDraw();
              } else {
                handleAddZone();
              }
            }}
            style={{
              ...styles.toolButton,
              backgroundColor: isDrawingZone ? '#e74c3c' : '#8e44ad',
            }}
            title={isDrawingZone ? 'Cancel zone drawing' : 'Draw a new zone on the map'}
          >
            {isDrawingZone ? 'Cancel Zone' : '⬜ Add Zone'}
          </button>

          <button
            onClick={() => setShowZonePanel((v) => !v)}
            style={{
              ...styles.toolButton,
              backgroundColor: showZonePanel ? '#6c3483' : '#9b59b6',
              position: 'relative',
            }}
            title="Manage zones"
          >
            Zones{activeZones.length > 0 ? ` (${activeZones.length})` : ''}
          </button>

          {/* Eraser */}
          <button
            onClick={() => {
              setIsErasing((v) => !v);
              setIsPlacingDevice(false);
              setIsDrawingZone(false);
            }}
            style={{
              ...styles.toolButton,
              backgroundColor: isErasing ? '#e74c3c' : '#7f8c8d',
            }}
            title={isErasing ? 'Exit eraser mode' : 'Erase parts of the floor image'}
          >
            {isErasing ? '🧹 Erasing…' : '🧹 Erase'}
          </button>

          {isErasing && (
            <div style={styles.eraserSizeRow}>
              <span style={styles.eraserSizeLabel}>Size:</span>
              {[8, 20, 40, 70].map((s) => (
                <button
                  key={s}
                  onClick={() => setEraserSize(s)}
                  style={{
                    ...styles.eraserSizeBtn,
                    backgroundColor: eraserSize === s ? '#e74c3c' : '#ecf0f1',
                    color: eraserSize === s ? '#fff' : '#2c3e50',
                  }}
                  title={`Eraser size ${s}px`}
                >
                  {s === 8 ? 'XS' : s === 20 ? 'S' : s === 40 ? 'M' : 'L'}
                </button>
              ))}
            </div>
          )}

          <select
            value={activeLayoutId}
            onChange={handleLayoutChange}
            style={styles.filterSelect}
            title="Select a saved floor layout"
          >
            {layoutOptions.map((layout) => (
              <option key={layout.id} value={layout.id}>{layout.name}</option>
            ))}
          </select>

          <button
            onClick={handleResetFloorImage}
            style={styles.secondaryToolButton}
            title="Revert to default floor.png layout"
          >
            Use Default Layout
          </button>

          <button
            onClick={handleDeleteActiveLayout}
            style={{
              ...styles.deleteToolButton,
              opacity: activeLayoutId === DEFAULT_LAYOUT_ID ? 0.6 : 1,
              cursor: activeLayoutId === DEFAULT_LAYOUT_ID ? 'not-allowed' : 'pointer',
            }}
            disabled={activeLayoutId === DEFAULT_LAYOUT_ID}
            title={activeLayoutId === DEFAULT_LAYOUT_ID ? 'Default layout cannot be deleted' : 'Delete selected custom layout'}
          >
            Delete Layout
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
            {deviceStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search devices by name, maker, IP, type, user, or location (matches glow)..."
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

        {isSearchActive && (
          <div style={styles.matchInfo}>
            {highlightedMatches} match{highlightedMatches === 1 ? '' : 'es'} highlighted on map
          </div>
        )}

        {isPlacingDevice && (
          <div style={styles.placementInfo}>
            Click on the map to choose where the new device should be placed.
          </div>
        )}

        {isDrawingZone && (
          <div style={{ ...styles.placementInfo, backgroundColor: '#f3e5f5', color: '#6c3483', borderColor: '#9b59b6' }}>
            Click and drag on the map to draw a zone rectangle.
          </div>
        )}

        {isErasing && (
          <div style={{ ...styles.placementInfo, backgroundColor: '#fdecea', color: '#c0392b', borderColor: '#e74c3c' }}>
            🧹 Erase mode — click or drag to erase parts of the floor image. Changes are saved automatically on release.
          </div>
        )}
      </div>

      {/* ZONE PANEL */}
      {showZonePanel && (
        <div style={styles.zonePanel}>
          <div style={styles.zonePanelHeader}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Zones — {activeZones.length} defined</span>
            <button onClick={() => setShowZonePanel(false)} style={styles.zonePanelClose}>✕</button>
          </div>
          {activeZones.length === 0 && (
            <div style={styles.zoneEmpty}>No zones yet. Click "⬜ Add Zone" to draw one on the map.</div>
          )}
          {activeZones.map((zone) => {
            const color = ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length];
            return (
              <div key={zone.id} style={styles.zoneRow}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: color.stroke,
                    marginRight: 8,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {zone.label}
                </span>
                <span style={{ fontSize: '11px', color: '#7f8c8d', marginRight: 8 }}>
                  {Math.round(zone.w)}×{Math.round(zone.h)}
                </span>
                <button
                  onClick={() => handleCycleZoneColor(zone.id)}
                  style={styles.zoneAction}
                  title="Change color"
                >
                  🎨
                </button>
                <button
                  onClick={() => handleRenameZone(zone.id)}
                  style={styles.zoneAction}
                  title="Rename zone"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  style={{ ...styles.zoneAction, color: '#e74c3c' }}
                  title="Delete zone"
                >
                  🗑
                </button>
              </div>
            );
          })}
          <button
            onClick={handleAddZone}
            style={styles.zoneAddButton}
          >
            + Draw New Zone
          </button>
        </div>
      )}

      {/* MAP AREA */}
      <div style={styles.mapAreaWrapper}>
        <div style={styles.mapContainer}>
          {loading && <div style={styles.mapStatus}>Loading floor devices...</div>}
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
            style={{ cursor: isErasing ? 'crosshair' : (isDrawingZone ? 'crosshair' : (isPlacingDevice ? 'crosshair' : (isPanning ? 'grabbing' : 'grab'))) }}
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
                  ref={konvaFloorImageRef}
                  image={floorImage}
                  width={mapSize.width}
                  height={mapSize.height}
                  imageSmoothingEnabled={true}
                />
              )}

              {/* Zones - rendered on top of floor image, below devices */}
              {activeZones.map((zone) => {
                const color = ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length];
                return (
                  <Group key={zone.id}>
                    <Rect
                      x={zone.x * mapScaleX}
                      y={zone.y * mapScaleY}
                      width={zone.w * mapScaleX}
                      height={zone.h * mapScaleY}
                      fill={color.fill}
                      stroke={color.stroke}
                      strokeWidth={1.5}
                      dash={[8, 4]}
                      listening={false}
                    />
                    <Text
                      x={zone.x * mapScaleX + 6}
                      y={zone.y * mapScaleY + 4}
                      text={zone.label}
                      fontSize={13}
                      fontStyle="bold"
                      fill={color.stroke}
                      listening={false}
                    />
                  </Group>
                );
              })}

              {/* Zone being drawn (preview rect) */}
              {isDrawingZone && zoneDrawStart && zoneDrawCurrent && (() => {
                const rx = Math.min(zoneDrawStart.x, zoneDrawCurrent.x);
                const ry = Math.min(zoneDrawStart.y, zoneDrawCurrent.y);
                const rw = Math.abs(zoneDrawCurrent.x - zoneDrawStart.x);
                const rh = Math.abs(zoneDrawCurrent.y - zoneDrawStart.y);
                const color = ZONE_COLORS[nextZoneColorIndex % ZONE_COLORS.length];
                return (
                  <Rect
                    x={rx * mapScaleX}
                    y={ry * mapScaleY}
                    width={rw * mapScaleX}
                    height={rh * mapScaleY}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={2}
                    dash={[6, 3]}
                    listening={false}
                  />
                );
              })()}

              {/* Devices */}
              {filteredDevices.filter((device) => {
                const hasX = device.x_position !== null && device.x_position !== undefined && device.x_position !== '';
                const hasY = device.y_position !== null && device.y_position !== undefined && device.y_position !== '';
                return hasX && hasY;
              }).map((device) => {
                const isSearchMatch = matchesSearch(device);
                const hasX = device.x_position !== null && device.x_position !== undefined && device.x_position !== '';
                const hasY = device.y_position !== null && device.y_position !== undefined && device.y_position !== '';
                const rawX = hasX ? Number(device.x_position) : NaN;
                const rawY = hasY ? Number(device.y_position) : NaN;
                const logicalX = Number.isFinite(rawX) ? rawX : 0;
                const logicalY = Number.isFinite(rawY) ? rawY : 0;
                const x = logicalX * mapScaleX;
                const y = logicalY * mapScaleY;
                const icon = device.icon || '💻';

                const status = device.status || '';
                const dotColor =
                  status === 'Active'
                    ? '#2ecc71'
                    : status === 'Inactive'
                    ? '#e74c3c'
                    : status === 'In Repair'
                    ? '#f39c12'
                    : status === 'For Sale'
                    ? '#3498db'
                    : '#95a5a6';

                return (
                  <Group
                    key={device.id}
                    x={x}
                    y={y}
                    draggable
                    opacity={isSearchActive && !isSearchMatch ? 0.28 : 1}
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
                    {isSearchActive && isSearchMatch && (
                      <Circle
                        x={10}
                        y={0}
                        radius={ICON_HALF + 30}
                        fill="rgba(59, 165, 125, 0.22)"
                        shadowColor="#3ba57d"
                        shadowBlur={24}
                        listening={false}
                      />
                    )}
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
                      fill={isSearchActive && !isSearchMatch ? '#7f8c8d' : '#000000'}
                      fontStyle={isSearchActive && isSearchMatch ? 'bold' : 'normal'}
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
              <div style={styles.tooltipHeaderRow}>
                <div style={styles.tooltipTitle}>{hoveredDevice.name || 'Unnamed Device'}</div>
                <div style={styles.tooltipStatusBadge}>{formatTooltipValue(hoveredDevice.status)}</div>
              </div>
              <div style={styles.tooltipGrid}>
                <div style={styles.tooltipLabel}>IP</div>
                <div>{formatTooltipValue(hoveredDevice.ip_address)}</div>
                <div style={styles.tooltipLabel}>Type</div>
                <div>{formatTooltipValue(hoveredDevice.type)}</div>
                <div style={styles.tooltipLabel}>Maker</div>
                <div>{formatTooltipValue(hoveredDevice.manufacturer)}</div>
                <div style={styles.tooltipLabel}>User</div>
                <div>{formatTooltipValue(hoveredDevice.user_name)}</div>
                <div style={styles.tooltipLabel}>Location</div>
                <div>{formatTooltipValue(hoveredDevice.location)}</div>
                <div style={styles.tooltipLabel}>OS</div>
                <div>{formatTooltipValue(hoveredDevice.os)}</div>
                <div style={styles.tooltipLabel}>RAM</div>
                <div>{formatTooltipValue(hoveredDevice.ram)}</div>
                <div style={styles.tooltipLabel}>Disk</div>
                <div>{formatTooltipValue(hoveredDevice.disk_space)}</div>
                <div style={styles.tooltipLabel}>Serial</div>
                <div>{formatTooltipValue(hoveredDevice.serial_number)}</div>
                <div style={styles.tooltipLabel}>Installed</div>
                <div>{formatTooltipDate(hoveredDevice.install_date)}</div>
                <div style={styles.tooltipLabel}>Age</div>
                <div>{formatTooltipValue(hoveredDevice.device_age)}</div>
                <div style={styles.tooltipLabel}>Map X,Y</div>
                <div>{`${formatTooltipValue(hoveredDevice.x_position)}, ${formatTooltipValue(hoveredDevice.y_position)}`}</div>
              </div>
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
      {showAddDeviceModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.addDeviceModal}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Add Device</h3>
                <div style={styles.modalSubtitle}>Create a device without leaving the floor map.</div>
              </div>
              <button onClick={handleCloseAddDevice} style={styles.modalCloseButton} disabled={saving}>
                ✕
              </button>
            </div>

            {error && <div style={styles.modalError}>{error}</div>}

            {pendingPlacement && (
              <div style={styles.placementSummary}>
                Selected map position: X {pendingPlacement.x}, Y {pendingPlacement.y}
              </div>
            )}

            <div style={styles.addDeviceForm}>
              <input
                name="name"
                placeholder="Device Name"
                value={newDevice.name}
                onChange={handleNewDeviceChange}
                style={styles.modalInput}
              />
              <select
                name="type"
                value={newDevice.type}
                onChange={handleNewDeviceChange}
                style={styles.modalInput}
              >
                <option value="">Select device type</option>
                {DEVICE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                name="icon"
                value={newDevice.icon}
                onChange={handleNewDeviceChange}
                style={styles.modalInput}
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>

              <div style={styles.modalSectionLabel}>{getCategoryLabel(newDevice)}</div>

              {newDeviceFields.has('manufacturer') && (
                <input
                  name="manufacturer"
                  placeholder="Device Maker / Brand"
                  value={newDevice.manufacturer}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('user_name') && (
                <input
                  name="user_name"
                  placeholder="User Name"
                  value={newDevice.user_name}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('ip_address') && (
                <input
                  name="ip_address"
                  placeholder="IP Address"
                  value={newDevice.ip_address}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('os') && (
                <input
                  name="os"
                  placeholder="Operating System"
                  value={newDevice.os}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('ram') && (
                <input
                  name="ram"
                  placeholder="RAM"
                  value={newDevice.ram}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('disk_space') && (
                <input
                  name="disk_space"
                  placeholder="Disk Space"
                  value={newDevice.disk_space}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('device_age') && (
                <input
                  name="device_age"
                  placeholder="Device Age"
                  value={newDevice.device_age}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('serial_number') && (
                <input
                  name="serial_number"
                  placeholder="Serial Number"
                  value={newDevice.serial_number}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('install_date') && (
                <input
                  name="install_date"
                  type="date"
                  value={newDevice.install_date}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              {newDeviceFields.has('location') && (
                <input
                  name="location"
                  placeholder="Location / Department"
                  value={newDevice.location}
                  onChange={handleNewDeviceChange}
                  style={styles.modalInput}
                />
              )}
              <select
                name="status"
                value={newDevice.status}
                onChange={handleNewDeviceChange}
                style={styles.modalInput}
              >
                {DEVICE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <label style={styles.modalCheckboxLabel}>
                <input
                  type="checkbox"
                  name="includeOnMap"
                  checked={newDevice.includeOnMap}
                  onChange={handleNewDeviceChange}
                />
                Place this device on the floor map immediately
              </label>

              {newDevice.includeOnMap && pendingPlacement && (
                <div style={styles.placementHint}>Coordinates will be saved as X {pendingPlacement.x}, Y {pendingPlacement.y}.</div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAddDeviceModal(false);
                  setIsPlacingDevice(true);
                }}
                style={styles.secondaryButton}
                disabled={saving}
              >
                Pick Different Spot
              </button>
              <button onClick={handleCloseAddDevice} style={styles.secondaryButton} disabled={saving}>
                Cancel
              </button>
              <button onClick={handleAddDevice} style={styles.primaryButton} disabled={saving || loading}>
                {saving ? 'Adding...' : 'Add Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDevice && (
        <DevicePanel
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          refreshDevices={refresh}
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
  errorBanner: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#fdecea',
    color: '#b23b3b',
    fontWeight: '600',
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
  secondaryToolButton: {
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    color: '#34495e',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  deleteToolButton: {
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    color: '#b23b3b',
    border: '1px solid #efc2c2',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
  },
  cancelPlacementButton: {
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    color: '#b23b3b',
    border: '1px solid #efc2c2',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
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
  matchInfo: {
    padding: '8px 12px',
    borderRadius: '999px',
    backgroundColor: '#ecf9f3',
    color: '#1f7a59',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  placementInfo: {
    padding: '8px 12px',
    borderRadius: '999px',
    backgroundColor: '#fff8e6',
    color: '#8a6d1e',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
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
  mapStatus: {
    marginBottom: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#ecf4ff',
    color: '#2c5282',
    fontWeight: '600',
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
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    lineHeight: '1.4',
    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
    minWidth: '250px',
    maxWidth: '320px',
    zIndex: 10,
  },
  tooltipHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '8px',
  },
  tooltipTitle: {
    fontSize: '13px',
    fontWeight: '700',
  },
  tooltipStatusBadge: {
    padding: '3px 8px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.14)',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  tooltipGrid: {
    display: 'grid',
    gridTemplateColumns: '72px 1fr',
    gap: '4px 10px',
    alignItems: 'start',
  },
  tooltipLabel: {
    color: '#9fb3c8',
    fontWeight: '600',
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
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 30,
  },
  addDeviceModal: {
    width: 'min(680px, 100%)',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
    padding: '22px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#1f2937',
  },
  modalSubtitle: {
    marginTop: '4px',
    color: '#6b7280',
    fontSize: '14px',
  },
  modalCloseButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  modalError: {
    marginBottom: '14px',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#fdecea',
    color: '#b23b3b',
    fontWeight: '600',
  },
  placementSummary: {
    marginBottom: '14px',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: '#eef6ff',
    color: '#2c5282',
    fontWeight: '600',
  },
  addDeviceForm: {
    display: 'grid',
    gap: '12px',
  },
  modalInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalSectionLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#64748b',
    marginTop: '2px',
  },
  modalCheckboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#334155',
    fontWeight: '500',
  },
  placementHint: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '18px',
  },
  secondaryButton: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontWeight: '600',
    cursor: 'pointer',
  },
  primaryButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#3ba57d',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer',
  },
  zonePanel: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e1d5f0',
    padding: '12px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '260px',
    overflowY: 'auto',
  },
  zonePanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  zonePanelClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#7f8c8d',
    padding: '2px 6px',
  },
  zoneEmpty: {
    fontSize: '13px',
    color: '#95a5a6',
    fontStyle: 'italic',
    padding: '4px 0',
  },
  zoneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 8px',
    borderRadius: '6px',
    backgroundColor: '#faf5ff',
    border: '1px solid #e9d8fd',
  },
  zoneAction: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 4px',
    borderRadius: '3px',
  },
  zoneAddButton: {
    marginTop: '4px',
    padding: '8px 14px',
    backgroundColor: '#8e44ad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  eraserSizeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginLeft: '4px',
  },
  eraserSizeLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    fontWeight: 600,
  },
  eraserSizeBtn: {
    padding: '4px 9px',
    border: '1px solid #bdc3c7',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },

};

export default FloorPage;