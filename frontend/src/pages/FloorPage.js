// Import React and hooks
import React, { useEffect, useState } from 'react';

// Import Konva components
import { Stage, Layer, Image, Circle, Text } from 'react-konva';

// Import API
import { getDevices, updateDevice } from '../api/deviceApi';

// Import panel
import DevicePanel from '../components/DevicePanel';

const FloorPage = () => {
    // =========================
    // STATE
    // =========================

    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [floorImage, setFloorImage] = useState(null);

    // =========================
    // LOAD FLOOR IMAGE
    // =========================

    useEffect(() => {
        const image = new window.Image();
        image.src = '/floor.png';
        image.onload = () => setFloorImage(image);
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
    // HANDLE DRAG END (SAVE POSITION)
    // =========================

    const handleDragEnd = async (e, device) => {
        const newX = e.target.x();
        const newY = e.target.y();

        try {
            // Update backend with new coordinates
            await updateDevice(device.id, {
                ...device,
                x_position: newX,
                y_position: newY,
            });

            // Update local state instantly (no reload)
            setDevices((prev) =>
                prev.map((d) =>
                    d.id === device.id
                        ? { ...d, x_position: newX, y_position: newY }
                        : d
                )
            );
        } catch (err) {
            console.error(err);
        }
    };

    // =========================
    // RENDER
    // =========================

    return (
        <div>
            <h2>Floor Layout</h2>

            <Stage width={800} height={600}>
                <Layer>
                    {/* Floor Image */}
                    {floorImage && (
                        <Image
                            image={floorImage}
                            width={800}
                            height={600}
                        />
                    )}

                    {/* Devices */}
                    {devices.map((device) => (
                        <React.Fragment key={device.id}>

                            {/* Device Icon (circle for now) */}
                            <Circle
                                x={device.x_position || 100} // default position
                                y={device.y_position || 100}
                                radius={10}
                                fill={device.status === 'online' ? 'green' : 'red'}
                                draggable // enables drag
                                onDragEnd={(e) => handleDragEnd(e, device)}
                            />

                            {/* Device Label */}
                            <Text
                                x={(device.x_position || 100) + 12}
                                y={(device.y_position || 100) - 5}
                                text={device.name}
                                fontSize={12}
                            />

                            // Device icon (clickable + draggable)
                            <Circle
                                x={device.x_position || 100}
                                y={device.y_position || 100}
                                radius={10}
                                fill={device.status === 'online' ? 'green' : 'red'}
                                draggable

                                // =========================
                                // Select device on click
                                // =========================
                                onClick={() => setSelectedDevice(device)}

                                // =========================
                                // Save position on drag
                                // =========================
                                onDragEnd={(e) => handleDragEnd(e, device)}
                            />

                        </React.Fragment>
                    ))}
                </Layer>
            </Stage>
            // =========================
            // Show panel when device selected
            // =========================
            {selectedDevice && (
                <DevicePanel
                    device={selectedDevice}
                    onClose={() => setSelectedDevice(null)} // close panel
                    refreshDevices={fetchDevices} // reload devices
                />
            )}
        </div>
    );
};

export default FloorPage;