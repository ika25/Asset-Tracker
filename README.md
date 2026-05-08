# Asset Tracker

## Docker

This repository includes a complete Docker Compose setup for the frontend, backend, and PostgreSQL database.

### Prerequisites

- Docker Desktop

### Run the stack

1. Copy `.env.example` to `.env` in the repository root and adjust values if needed.
   If ports `3000`, `5000`, or `5432` are already in use, change `FRONTEND_PORT`, `BACKEND_PORT`, or `DB_PORT` in that file.
2. Start the containers:

   ```bash
   docker compose up --build
   ```

3. Open the app at `http://localhost:${FRONTEND_PORT}`.
4. The API is available at `http://localhost:${BACKEND_PORT}`.

### Stop the stack

```bash
docker compose down
```

To remove the PostgreSQL volume as well:

```bash
docker compose down -v
```

### Notes

- The backend container runs database migrations before starting the API server.
- A fresh Docker PostgreSQL volume is initialized automatically by the migration chain.
- PostgreSQL data is persisted in the `postgres-data` Docker volume.
- The frontend image is built with `REACT_APP_API_URL`, which defaults to `http://localhost:5000/api`.
- If you change `BACKEND_PORT`, update `REACT_APP_API_URL` to match before rebuilding the frontend image.

### Local development with Docker DB only

If you want to run frontend and backend locally, but keep PostgreSQL in Docker:

1. Start only the DB container:

   ```bash
   docker compose up -d db
   ```

2. Make sure Docker app containers are not still holding ports `3000` and `5000`:

   ```bash
   docker stop asset-tracker-frontend asset-tracker-backend
   ```

3. Start backend locally:

   ```bash
   cd backend
   npm run dev
   ```

4. Start frontend locally in a second terminal:

   ```bash
   cd frontend
   npm start
   ```

This avoids port conflicts between local servers and Docker-published app containers.

## Network Scan

- The backend exposes `GET /api/scan` for network discovery.
- Optional query parameter: `target` (IPv4 or CIDR), for example: `GET /api/scan?target=192.168.1.0/24`.
- Response includes `target`, `scannedAt`, `count`, and a `devices` list containing hostname/IP/MAC/vendor details.
- The backend host needs `nmap` installed to run scans.

### Network Scan (Easy version)

Think of your office network like a neighborhood with many houses.

- Each device (computer, printer, router) is like a house.
- The scan feature is like knocking on each door to see who is home.
- When a device answers, the app writes down what it found.

What you do:

1. Go to **Devices** -> **All Machines**.
2. In **Network Discovery**, type a network range (or keep the default one).
3. Click **Run Scan**.
4. Wait a few seconds.
5. You will see a list of devices that are "awake" on the network.
6. Click **Add to Inventory** for the ones you want to save.

After you add one:

- It is saved in your device list.
- It is placed in the center of the floor map, so it is easy to find.

Simple idea:

- **Run Scan** = "Who is here right now?"
- **Add to Inventory** = "Remember this device for later."

### How it is implemented in this project

This is the actual flow in our codebase when you use the scan feature.

1. Frontend button click

- In the Devices page, clicking **Run Scan** calls `handleRunScan`.
- That function calls `runNetworkScan(target)` from `frontend/src/api/scanApi.js`.

2. API request

- `runNetworkScan` sends a request to `GET /api/scan`.
- If you typed a target, it sends it as query param `target`.

3. Backend route -> controller

- Route is wired in `backend/src/routes/scanRoutes.js`.
- Controller is `runScan` in `backend/src/controllers/scanController.js`.
- Controller reads `req.query.target` and calls `scanNetwork(target)`.

4. Backend service runs nmap

- `scanNetwork` is in `backend/src/services/nmapService.js`.
- It validates the target format (IPv4/CIDR).
- It runs `nmap -sn <target>` using Node `spawn`.
- It parses nmap text output into structured device objects:
   - `ipAddress`
   - `hostname`
   - `macAddress`
   - `vendor`

5. Response back to UI

- Controller returns JSON:
   - `target`
   - `scannedAt`
   - `count`
   - `devices[]`
- Devices page stores that in `scanResults` and shows it in the Network Discovery table.

6. Add discovered device to inventory

- Clicking **Add to Inventory** calls `handleAddScannedDevice` in `frontend/src/pages/DevicesPage.js`.
- It prevents duplicates by checking existing IPs.
- It builds a normal device payload and saves it using existing `createItem` CRUD flow.
- New scanned devices are auto-placed at map center (`x=600`, `y=350`) so they are visible on Floor Map immediately.

7. Error handling

- If nmap is missing, backend returns a clear error message.
- If target format is invalid, backend returns `400` with validation message.
- Frontend shows scan/import errors in the page banner.

## Troubleshooting: PostgreSQL port 5432 timeouts (Windows)

### Problem we hit

- Backend and migration commands failed with errors like `ETIMEDOUT ::1:5432` and `ETIMEDOUT 127.0.0.1:5432`.
- pgAdmin could also show `connection timeout expired`.
- This happened even when PostgreSQL service looked "Running".

### Why it happened

- The machine had unstable local loopback/port forwarding behavior for PostgreSQL on `localhost:5432`.
- In this setup, Docker DB connectivity from the Windows host was reliable through the WSL network IP.

### Fix we used

1. Start only the DB container:

   ```bash
   docker compose up -d db
   ```

2. Find current WSL IP (example output: `172.29.x.x`):

   ```powershell
   wsl -- ip addr show eth0
   ```

3. Update `backend/.env` `DB_HOST` from `localhost` to that IP.
4. Run migrations again:

   ```bash
   cd backend
   node scripts/migrate.js
   ```

5. Start backend as normal.

### Important note

- WSL IP can change after reboot. If timeouts return, repeat steps 2-3.

### Automatic fallback now included

- Backend scripts now run `scripts/resolveDbHost.js` before `start`, `dev`, and `migrate`.
- It keeps your current `DB_HOST` if reachable.
- If unreachable on Windows, it auto-detects WSL IP and updates `backend/.env` `DB_HOST` to a reachable value.
- To disable this behavior, set `DB_HOST_AUTO_WSL=false` in `backend/.env`.