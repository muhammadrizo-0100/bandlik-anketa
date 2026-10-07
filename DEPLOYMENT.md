# VPS deployment

Production: https://bandlik.technova-it.uz
Server checkout: `/srv/apps/bandlik-monitoring`
Nginx proxies to `127.0.0.1:3404`; PostgreSQL and the API have no public ports.

The root server `.env` is private (mode 600), ignored by Git, and preserved by deployments.
Use `.env.example` for variable names. Never put application secrets in frontend build variables.

GitHub Actions builds both applications, lints changed backend lines, runs deployment safety tests, then invokes the restricted SSH command `bandlik-production`. Existing lint errors on unrelated lines do not block a release. The backend and CI use Node 24 for the installed ESM dependencies; Jest also enables VM modules.
Required Actions secrets: `VPS_HOST`, `VPS_SSH_KEY`. The dedicated key can only invoke this project's deployment script; the VPS host key is pinned.

Manual deployment:

```bash
ssh golden-group-vps
cd /srv/apps/bandlik-monitoring
bash deploy.sh
```

Deployments back up the existing database to `/srv/backups/bandlik-monitoring` before replacing containers. Backups are not automatically deleted. Failed health checks fail the deployment; there is no automatic rollback.

Production demo seeding is disabled, so there are no default demo accounts. Schema synchronization defaults to disabled. For initial creation of an empty database only, temporarily set `DB_SYNCHRONIZE=true`, start the services, then set it back to `false` and recreate the backend. Future schema changes require an explicit reviewed migration before deployment.

## Replace the JWT secret

Edit `JWT_SECRET` in the server's root `.env` without committing it, then:

```bash
docker compose -p bandlik-monitoring -f docker-compose.production.yml up -d --no-deps backend
```

Changing this value invalidates existing login tokens.

## Import existing data

Keep `DB_SYNCHRONIZE=false` and production seeding disabled. Before importing, identify whether the file is plain SQL, a PostgreSQL custom dump, or data-only; compare its schema and ownership with this project. Stop the backend and back up the destination database before restoring. Use `psql -v ON_ERROR_STOP=1` for SQL or `pg_restore --exit-on-error --no-owner --no-acl` for custom dumps. Full-schema dumps require a reviewed clean target; do not blindly append them to the initialized schema. Restart the backend after import and verify table counts and login with an imported account.
