#!/usr/bin/env bash
# Browser end-to-end verification for Domolux Roles (TASKS.md §14.3).
#
# Usage:
#   e2e/run_browser_e2e.sh [HA_IMAGE]
#
# The script:
#   1. builds a disposable Home Assistant configuration (demo integration),
#   2. starts a container with the integration mounted,
#   3. runs the REST/WebSocket `setup` phase (Father + two Children + rules),
#   4. drives real Chrome sessions as Father, Child A and Child B,
#   5. writes every result, screenshot and log to evidence/E2E/.
#
# Requires: docker, node >= 22, Google Chrome (or CHROME_BIN).
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HA_IMAGE="${1:-ghcr.io/home-assistant/home-assistant:2026.2.3}"
CONTAINER_NAME="domolux-browser-e2e-$$"
WORK_DIR="${REPO_ROOT}/evidence/E2E"
STATE_DIR="${WORK_DIR}/browser-state"
LOG_DIR="${WORK_DIR}/logs"
SHOTS_DIR="${WORK_DIR}/screenshots"
RESULTS_FILE="${WORK_DIR}/browser_results.txt"

rm -rf "${STATE_DIR}" "${SHOTS_DIR}"
mkdir -p "${STATE_DIR}" "${LOG_DIR}" "${SHOTS_DIR}"
: > "${RESULTS_FILE}"

cleanup() {
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "== Domolux Roles browser E2E =="
echo "image:    ${HA_IMAGE}"
echo "results:  ${RESULTS_FILE}"
echo "shots:    ${SHOTS_DIR}"
echo

cat > "${STATE_DIR}/configuration.yaml" <<'YAML'
default_config:

logger:
  default: warning
  logs:
    custom_components.domolux_roles: debug

demo:

http:
  server_port: 8123
YAML

echo "-- starting Home Assistant --"
docker run -d \
    --name "${CONTAINER_NAME}" \
    -v "${STATE_DIR}/configuration.yaml:/config/configuration.yaml" \
    -v "${REPO_ROOT}/custom_components:/config/custom_components" \
    -v "${REPO_ROOT}/e2e:/domolux-e2e:ro" \
    -v "${STATE_DIR}:/domolux-e2e-state" \
    -p 127.0.0.1:8123:8123 \
    "${HA_IMAGE}" >/dev/null || { echo "failed to start container"; exit 1; }

for _ in $(seq 1 120); do
    if curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:8123/api/ 2>/dev/null | grep -qE '^(200|401)$'; then
        break
    fi
    sleep 2
done

echo "-- phase: setup --"
docker exec \
    -e DOMOLUX_E2E_STATE="/domolux-e2e-state/state.json" \
    "${CONTAINER_NAME}" \
    python3 /domolux-e2e/domolux_e2e.py setup 2>&1 | tee -a "${RESULTS_FILE}"

if [ ! -f "${STATE_DIR}/state.json" ]; then
    echo "setup phase did not produce a state file" >&2
    exit 1
fi

echo "-- phase: browser --"
node "${REPO_ROOT}/e2e/browser_e2e.mjs" \
    --state "${STATE_DIR}/state.json" \
    --origin "http://127.0.0.1:8123" \
    --shots "${SHOTS_DIR}" 2>&1 | tee -a "${RESULTS_FILE}"
BROWSER_STATUS="${PIPESTATUS[0]}"

echo "-- collecting logs --"
docker logs "${CONTAINER_NAME}" > "${WORK_DIR}/browser_home-assistant.log" 2>&1 || true
docker cp "${CONTAINER_NAME}:/config/.storage/auth" "${LOG_DIR}/browser_ha_auth.json" 2>/dev/null \
    || true
docker cp "${CONTAINER_NAME}:/config/.storage/domolux_auth" "${LOG_DIR}/browser_domolux_auth.json" 2>/dev/null \
    || true

echo
echo "== summary =="
grep -c '^RESULT ' "${RESULTS_FILE}" | sed 's/^/checks: /'
grep '^SUMMARY' "${RESULTS_FILE}" || true
echo "screenshots: ${SHOTS_DIR}"
echo "logs: ${LOG_DIR}"

exit "${BROWSER_STATUS}"
