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