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

## Network Scan

- The backend exposes `GET /api/scan` for network discovery.
- Optional query parameter: `target` (IPv4 or CIDR), for example: `GET /api/scan?target=192.168.1.0/24`.
- Response includes `target`, `scannedAt`, `count`, and a `devices` list containing hostname/IP/MAC/vendor details.
- The backend host needs `nmap` installed to run scans.

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