// Import React and hooks
import React, { useEffect, useState } from 'react';

// Import Konva components
import { Stage, Layer, Image, Circle, Text } from 'react-konva';

// Import API functions
import { getDevices, updateDevice } from '../api/deviceApi';

// Import panels
import DevicePanel from '../components/DevicePanel';
import AddDevicePanel from '../components/AddDevicePanel';

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
        const image = new window.Image();
        image.src = '/floor.png'; // must be in /public folder
        image.onload = () => setFloorImage(image);
    }, []);

    // =========================
    // FETCH DEVICES FROM BACKEND
    // =========================
    const fetchDevices = async () => {
        try {
            const res = await getDevices();
            setDevices(res.data);
        } catch (err) {
            console.error('Error fetching devices:', err);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    // =========================
    // HANDLE DEVICE DRAG (SAVE POSITION)
    // =========================
    const handleDragEnd = async (e, device) => {
        const newX = e.target.x();
        const newY = e.target.y();

        try {
            // Update backend
            await updateDevice(device.id, {
                x_position: newX,
                y_position: newY,
            });

            // Update UI instantly
            setDevices((prev) =>
                prev.map((d) =>
                    d.id === device.id
                        ? { ...d, x_position: newX, y_position: newY }
                        : d
                )
            );
        } catch (err) {
            console.error('Error updating position:', err);
        }
    };

    // =========================
    // HANDLE CLICK ON FLOOR (ADD DEVICE)
    // =========================
    const handleStageClick = (e) => {
        // If clicking on a device (Circle), ignore
        if (e.target.getClassName() === 'Circle') return;

        // Get stage reference
        const stage = e.target.getStage();

        // Get mouse position
        const pointerPosition = stage.getPointerPosition();

        // Open add device panel at clicked position
        setNewDevicePos({
            x: pointerPosition.x,
            y: pointerPosition.y,
        });

        // Close edit panel if open
        setSelectedDevice(null);
    };

    // =========================
    // RENDER
    // =========================
    return (
        <div>
            <h2>Floor Layout</h2>

            <Stage
                width={1400}
                height={900}
                onClick={handleStageClick}
            >
                <Layer>
                    {/* Floor Image */}
                    {floorImage && (
                        <Image
                            image={floorImage}
                            width={1400}
                            height={900}
                        />
                    )}

                    {/* Devices */}
                    {devices.map((device) => (
                        <React.Fragment key={device.id}>
                            {/* Device Circle */}
                            <Circle
                                x={device.x_position || 100}
                                y={device.y_position || 100}
                                radius={10}
                                fill={device.status === 'online' ? 'green' : 'red'}
                                draggable
                                onClick={() => {
                                    setSelectedDevice(device);
                                    setNewDevicePos(null);
                                }}
                                onDragEnd={(e) => handleDragEnd(e, device)}
                            />

                            {/* Device Label */}
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

            {/* =========================
          Device Info Panel
      ========================= */}
            {selectedDevice && (
                <DevicePanel
                    device={selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                    refreshDevices={fetchDevices}
                />
            )}

            {/* =========================
          Add Device Panel
      ========================= */}
            {newDevicePos && (
                <AddDevicePanel
                    position={newDevicePos}
                    onClose={() => setNewDevicePos(null)}
                    refreshDevices={fetchDevices}
                />
            )}
        </div>
    );
};

export default FloorPage;