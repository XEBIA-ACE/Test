# US-001 Implementation Tasks

- [ ] **T-01 — Model resource allocation data.** Add domain and persistence types plus a Flyway migration for resource allocation records. Acceptance: allocations can be queried with project and capacity details.
- [ ] **T-02 — Expose the dashboard API.** Add repository, service, DTO, and controller components for a real-time resource allocation snapshot. Acceptance: `GET /api/v1/dashboard/resource-allocation` returns totals, utilization, allocation rows, and a server timestamp.
- [ ] **T-03 — Build the device-responsive dashboard.** Add a React and TypeScript UI that refreshes resource allocation data automatically. Acceptance: summary cards and allocation details are usable on mobile, tablet, and desktop viewports.
- [ ] **T-04 — Cover dashboard behavior.** Add backend and frontend tests for aggregation, API responses, loading, failure, and populated dashboard states. Acceptance: automated tests pass.
- [ ] **T-05 — Document and validate the feature.** Update service documentation and run the applicable build, lint, and test commands. Acceptance: documented local usage and clean validation results.
