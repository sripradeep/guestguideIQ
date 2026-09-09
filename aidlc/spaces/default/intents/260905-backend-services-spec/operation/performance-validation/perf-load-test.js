// Performance Validation load test — backend-services-spec / u1-backend-api
// Scope (per human decisions recorded in performance-validation-questions.md):
//   - Only /health, /health/ready, and POST /v1/leads/waitlist are reachable
//     in production today (no locality/account/property data exists, and
//     admin-api — the only way to create one — is not deployed).
//   - Synthetic lead rows are tagged and left in place (human: do not delete).
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = 'https://api.guestguideiq.com';

export const healthErrors = new Rate('health_errors');
export const readyErrors = new Rate('ready_errors');
export const leadErrors = new Rate('lead_errors');
export const leadDuration = new Trend('lead_duration', true);

export const options = {
  scenarios: {
    health_ramp: {
      executor: 'ramping-arrival-rate',
      exec: 'healthCheck',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 80,
      stages: [
        { target: 30, duration: '3m' },   // ramp-up
        { target: 30, duration: '10m' },  // steady-state @ ~30 RPS combined (health+ready)
        { target: 0, duration: '2m' },    // ramp-down
      ],
    },
    lead_burst: {
      executor: 'shared-iterations',
      exec: 'leadSubmit',
      vus: 1,
      iterations: 10,
      maxDuration: '2m',
      startTime: '1m', // begin shortly after health_ramp starts
    },
  },
  thresholds: {
    health_errors: ['rate<0.01'],
    ready_errors: ['rate<0.01'],
    lead_errors: ['rate<0.01'],
  },
};

export function healthCheck() {
  // Alternate between /health (shallow) and /health/ready (DB SELECT 1)
  const useReady = Math.random() < 0.5;
  const url = useReady ? `${BASE}/health/ready` : `${BASE}/health`;
  const res = http.get(url, { tags: { name: useReady ? 'health_ready' : 'health' } });
  const ok = check(res, { 'status is 200': (r) => r.status === 200 });
  if (useReady) readyErrors.add(!ok);
  else healthErrors.add(!ok);
}

export function leadSubmit() {
  const tag = `loadtest+${__ENV.RUN_ID || 'run'}-${__VU}-${__ITER}-${Date.now()}@example.invalid`;
  const payload = JSON.stringify({ email: tag });
  const res = http.post(`${BASE}/v1/leads/waitlist`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'lead_waitlist' },
  });
  leadDuration.add(res.timings.duration);
  const ok = check(res, { 'status is 201': (r) => r.status === 201 });
  leadErrors.add(!ok);
  sleep(6); // stay well under the 15/min per-IP rate limit (10/min here)
}
