#!/usr/bin/env bash
# Run the Domolux Roles end-to-end verification against a real Home Assistant.
#
# Usage:
#   e2e/run_e2e.sh [HA_IMAGE]
#
# The script:
#   1. builds a disposable Home Assistant configuration (demo integration),
#   2. starts a container with the integration mounted from the repository,
#   3. runs the setup / enforce / revoke phases,
#   4. restarts Home Assistant and runs the persist phase,
#   5. writes every result to evidence/E2E/.
#
# The container is always removed at the end; nothing outside the repository
# is touched.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HA_IMAGE="${1:-ghcr.io/home-assistant/home-assistant:2026.8.3}"
CONTAINER_NAME="domolux-e2e-$$"
WORK_DIR="${REPO_ROOT}/evidence/E2E"
STATE_DIR="${WORK_DIR}/state"
LOG_DIR="${WORK_DIR}/logs"
RESULTS_FILE="${WORK_DIR}/results.txt"

rm -rf "${STATE_DIR}"
mkdir -p "${STATE_DIR}" "${LOG_DIR}"
# Start from a clean evidence file so the committed results match this run.
: > "${RESULTS_FILE}"

cleanup() {
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "== Domolux Roles E2E =="
echo "image:    ${HA_IMAGE}"
echo "results:  ${RESULTS_FILE}"
echo

# ---------------------------------------------------------------------------
# configuration
# ---------------------------------------------------------------------------
cat > "${STATE_DIR}/configuration.yaml" <<'YAML'
default_config:

logger:
  default: warning
  logs:
    homeassistant.components.domolux_roles: debug
    custom_components.domolux_roles: debug

demo:

http:
  server_port: 8123
  # The harness probes readiness unauthenticated; never IP-ban it.
  ip_ban_enabled: false
YAML

# ---------------------------------------------------------------------------
# start Home Assistant
# ---------------------------------------------------------------------------
start_ha() {
    docker run -d \
        --name "${CONTAINER_NAME}" \
        -v "${STATE_DIR}/configuration.yaml:/config/configuration.yaml" \
        -v "${REPO_ROOT}/custom_components:/config/custom_components" \
        -v "${REPO_ROOT}/e2e:/domolux-e2e:ro" \
        -v "${STATE_DIR}:/domolux-e2e-state" \
        -p 127.0.0.1:8123:8123 \
        "${HA_IMAGE}" >/dev/null
}

echo "-- starting Home Assistant --"
start_ha || { echo "failed to start container"; exit 1; }

# Wait for the API to answer.
for _ in $(seq 1 120); do
    STATUS_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8123/api/ 2>/dev/null || true)"
    if [ "${STATUS_CODE}" = "200" ] || [ "${STATUS_CODE}" = "401" ]; then
        break
    fi
    sleep 2
done

copy_auth() {
    docker cp "${CONTAINER_NAME}:/config/.storage/auth" "${LOG_DIR}/ha_auth_${1}.json" 2>/dev/null \
        || true
}

run_phase() {
    local phase="$1"
    echo "-- phase: ${phase} --"
    docker exec \
        -e DOMOLUX_E2E_STATE="/domolux-e2e-state/state.json" \
        "${CONTAINER_NAME}" \
        python3 /domolux-e2e/domolux_e2e.py "${phase}" 2>&1 | tee -a "${RESULTS_FILE}"
    return "${PIPESTATUS[0]}"
}

STATUS=0

run_phase setup   || STATUS=1
copy_auth "after-setup"
run_phase enforce || STATUS=1
copy_auth "after-enforce"
run_phase transitions || STATUS=1
copy_auth "after-transitions"
run_phase revoke  || STATUS=1

echo "-- restarting Home Assistant --"
docker restart "${CONTAINER_NAME}" >/dev/null || STATUS=1
for _ in $(seq 1 120); do
    STATUS_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8123/api/ 2>/dev/null || true)"
    if [ "${STATUS_CODE}" = "200" ] || [ "${STATUS_CODE}" = "401" ]; then
        break
    fi
    sleep 2
done
run_phase persist || STATUS=1

echo "-- collecting logs --"
docker logs "${CONTAINER_NAME}" > "${LOG_DIR}/home-assistant.log" 2>&1 || true
docker cp "${CONTAINER_NAME}:/config/.storage/domolux_auth" "${LOG_DIR}/domolux_auth.json" 2>/dev/null \
    || echo "(no domolux_auth storage file found)" > "${LOG_DIR}/domolux_auth.json"
docker cp "${CONTAINER_NAME}:/config/.storage/auth" "${LOG_DIR}/ha_auth.json" 2>/dev/null \
    || echo "(no ha auth storage file found)" > "${LOG_DIR}/ha_auth.json"

echo
echo "== summary =="
grep -c '^RESULT ' "${RESULTS_FILE}" | sed 's/^/checks: /'
grep '^SUMMARY' "${RESULTS_FILE}" || true
echo "logs: ${LOG_DIR}"

exit "${STATUS}"
