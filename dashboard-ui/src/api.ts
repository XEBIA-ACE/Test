import type { ResourceAllocationDashboard } from "./types";

export async function getResourceAllocationDashboard(
  signal?: AbortSignal
): Promise<ResourceAllocationDashboard> {
  const response = await fetch("/api/v1/dashboard/resource-allocation", {
    headers: {
      Accept: "application/json"
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`Dashboard request failed with status ${response.status}`);
  }

  return response.json() as Promise<ResourceAllocationDashboard>;
}
