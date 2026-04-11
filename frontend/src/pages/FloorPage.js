// Import React and hooks
import React, { useEffect, useState } from 'react';

// Konva canvas components
import { Stage, Layer, Image, Circle, Text } from 'react-konva';

// API functions
import { getDevices, updateDevice } from '../api/deviceApi';

// Panels
import DevicePanel from '../components/DevicePanel';
import AddDevicePanel from '../components/AddDevicePanel';

// Import sidebar
import Sidebar from '../components/Sidebar';

const FloorPage = () => {
  // =========================
  // STATE
  // =========================
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newDevicePos, setNewDevicePos] = useState(null);
  const [floorImage, setFloorImage] = useState(null);

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
    const x = e.target.x();
    const y = e.target.y();

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
  // HANDLE CLICK (ADD DEVICE)
  // =========================
  const handleStageClick = (e) => {
    // Ignore clicks on devices
    if (e.target.getClassName() === 'Circle') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    setNewDevicePos({
      x: pos.x,
      y: pos.y,
    });

    setSelectedDevice(null); // close edit panel
  };

  return (
    <div style={styles.container}>
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAP AREA */}
      <div style={styles.map}>
        <Stage width={900} height={600} onClick={handleStageClick}>
          <Layer>
            {/* Floor Image */}
            {floorImage && (
              <Image image={floorImage} width={900} height={600} />
            )}

            {/* Devices */}
            {devices.map((device) => (
              <React.Fragment key={device.id}>
                <Circle
                  x={device.x_position || 100}
                  y={device.y_position || 100}
                  radius={10}
                  fill={device.status === 'online' ? 'green' : 'red'}
                  draggable

                  // Select device
                  onClick={() => {
                    setSelectedDevice(device);
                    setNewDevicePos(null);
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
                />
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.panel}>
        {selectedDevice && (
          <DevicePanel
            device={selectedDevice}
            onClose={() => setSelectedDevice(null)}
            refreshDevices={fetchDevices}
          />
        )}

        {newDevicePos && !selectedDevice && (
          <AddDevicePanel
            position={newDevicePos}
            onClose={() => setNewDevicePos(null)}
            refreshDevices={fetchDevices}
          />
        )}

        {!selectedDevice && !newDevicePos && (
          <p>Select or click map to add device</p>
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
    height: '100vh',
  },
  sidebar: {
    width: '200px',
    background: '#2c3e50',
    color: 'white',
    padding: '15px',
  },
  map: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f5f6fa',
  },
  panel: {
    width: '300px',
    background: '#ecf0f1',
    padding: '15px',
    borderLeft: '1px solid #ccc',
  },
};

export default FloorPage;