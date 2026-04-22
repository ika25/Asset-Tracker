import express from 'express';
import cors from 'cors';
// Register all API route groups in one place so app wiring is easy to scan.
import deviceRoutes from './routes/deviceRoutes.js';
import floorRoutes from './routes/floorRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import deviceSoftwareRoutes from './routes/deviceSoftwareRoutes.js';
import softwareRoutes from './routes/softwareRoutes.js';
import hardwareRoutes from './routes/hardwareRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Asset Tracker API', version: '1.0.0' });
});

// API namespace mounting.
app.use('/api/devices', deviceRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/device-software', deviceSoftwareRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/hardware', hardwareRoutes);

// Keep these last so unmatched routes and thrown errors are handled consistently.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;