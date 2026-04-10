import express from 'express';
import cors from 'cors';

import deviceRoutes from './routes/deviceRoutes.js';
import floorRoutes from './routes/floorRoutes.js';
import scanRoutes from './routes/scanRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/devices', deviceRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/scan', scanRoutes);

export default app;