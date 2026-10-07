# Project map

- `backend/src/main.ts`: NestJS entry point, API prefix and CORS.
- `backend/src/config/`: app, PostgreSQL and JWT configuration.
- `backend/src/database/`: entities, TypeORM setup and development seeding.
- `backend/src/modules/`: feature APIs, including authentication and dashboard.
- `frontend/src/api/client.ts`: frontend API client.
- `frontend/Dockerfile`, `frontend/nginx.conf`: frontend image and same-origin API proxy.
- `docker-compose.dev.yml`: local development.
- `docker-compose.production.yml`: VPS services; localhost web port 3404, private PostgreSQL/API.
- `deploy.sh`, `.github/workflows/deploy.yml`: verified main-branch deployment.
- `scripts/lint-changed.mjs`: CI lint gate for changed backend TypeScript lines.
