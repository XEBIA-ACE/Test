import { useCallback, useEffect, useState } from "react";
import { getResourceAllocationDashboard } from "./api";
import type {
  ResourceAllocation,
  ResourceAllocationDashboard
} from "./types";

const REFRESH_INTERVAL_MS = 5_000;

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date(timestamp));
}

function statusLabel(status: ResourceAllocation["utilizationStatus"]): string {
  return status.toLowerCase().replace("_", " ");
}

function AllocationRow({ allocation }: { allocation: ResourceAllocation }) {
  const meterValue = Math.min(allocation.utilizationPercentage, 100);

  return (
    <tr>
      <td data-label="Resource">
        <strong>{allocation.resourceName}</strong>
        <span className="muted">{allocation.role}</span>
      </td>
      <td data-label="Project">{allocation.projectName}</td>
      <td data-label="Hours">
        {allocation.allocatedHours} / {allocation.capacityHours}h
      </td>
      <td data-label="Utilization">
        <div className="utilization">
          <span>{allocation.utilizationPercentage.toFixed(1)}%</span>
          <progress
            aria-label={`${allocation.resourceName} utilization`}
            max="100"
            value={meterValue}
          />
        </div>
      </td>
      <td data-label="Status">
        <span
          className={`status status--${allocation.utilizationStatus.toLowerCase()}`}
        >
          {statusLabel(allocation.utilizationStatus)}
        </span>
      </td>
    </tr>
  );
}

export default function App() {
  const [dashboard, setDashboard] =
    useState<ResourceAllocationDashboard | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setRefreshing(true);
    try {
      const nextDashboard = await getResourceAllocationDashboard(signal);
      setDashboard(nextDashboard);
      setError("");
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }
      setError("Live allocation data is temporarily unavailable.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const refreshTimer = window.setInterval(
      () => void refresh(controller.signal),
      REFRESH_INTERVAL_MS
    );

    return () => {
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, [refresh]);

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="eyebrow">Project Management</p>
          <h1>Resource allocation</h1>
          <p className="subtitle">
            Current capacity across active project assignments
          </p>
        </div>
        <div className="live-status" aria-live="polite">
          <span className={refreshing ? "live-dot live-dot--refreshing" : "live-dot"} />
          {refreshing ? "Refreshing" : "Live"}
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      )}

      {!dashboard ? (
        <section className="loading-panel" aria-label="Loading dashboard">
          Loading current allocations…
        </section>
      ) : (
        <>
          <section className="summary-grid" aria-label="Allocation summary">
            <article className="summary-card">
              <span>Total resources</span>
              <strong>{dashboard.totalResources}</strong>
              <small>Across all projects</small>
            </article>
            <article className="summary-card">
              <span>Allocated hours</span>
              <strong>{dashboard.allocatedHours}h</strong>
              <small>of {dashboard.capacityHours}h capacity</small>
            </article>
            <article className="summary-card">
              <span>Utilization</span>
              <strong>{dashboard.utilizationPercentage.toFixed(1)}%</strong>
              <small>Current portfolio average</small>
            </article>
            <article className="summary-card summary-card--attention">
              <span>Over allocated</span>
              <strong>{dashboard.overAllocatedResources}</strong>
              <small>Resources needing attention</small>
            </article>
          </section>

          <section className="allocation-panel">
            <div className="section-heading">
              <div>
                <h2>Current assignments</h2>
                <p>Automatically refreshed every five seconds</p>
              </div>
              <time dateTime={dashboard.lastUpdated}>
                Updated {formatTimestamp(dashboard.lastUpdated)}
              </time>
            </div>

            {dashboard.allocations.length === 0 ? (
              <div className="empty-state">
                No resource allocations are available yet.
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Project</th>
                      <th>Hours</th>
                      <th>Utilization</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.allocations.map((allocation) => (
                      <AllocationRow key={allocation.id} allocation={allocation} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
