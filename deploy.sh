#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")"
exec 9>.deploy.lock
flock 9

git fetch origin main
git merge --ff-only origin/main
test -f .env || { echo 'Missing server .env' >&2; exit 1; }
chmod 600 .env
COMPOSE=(docker compose -p bandlik-monitoring -f docker-compose.production.yml)
"${COMPOSE[@]}" config --quiet
"${COMPOSE[@]}" build --pull

# Keep a database snapshot before replacing running application containers.
if [[ -n "$("${COMPOSE[@]}" ps --status running -q postgres)" ]]; then
  install -d -m 700 /srv/backups/bandlik-monitoring
  "${COMPOSE[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
    > "/srv/backups/bandlik-monitoring/$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD).dump"
fi

"${COMPOSE[@]}" up -d --wait --wait-timeout 180 --remove-orphans
curl --fail --silent --show-error http://127.0.0.1:3404/ >/dev/null
status=$(curl --silent --show-error -o /dev/null -w '%{http_code}' http://127.0.0.1:3404/api/v1/dashboard/summary)
[[ "$status" == 401 ]] || { echo "API smoke check failed: $status" >&2; exit 1; }
"${COMPOSE[@]}" ps
echo "Bandlik deployed: $(git rev-parse HEAD)"
