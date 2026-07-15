import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import type { ResourceAllocationDashboard } from "./types";

const dashboard: ResourceAllocationDashboard = {
  totalResources: 2,
  allocatedHours: 76,
  capacityHours: 80,
  utilizationPercentage: 95,
  overAllocatedResources: 1,
  lastUpdated: "2026-07-15T08:00:00Z",
  allocations: [
    {
      id: "f55964ed-f915-4c04-aa14-73d76855fc1b",
      resourceName: "Alex Morgan",
      role: "Engineer",
      projectId: "01595998-a927-4a7b-b155-6e517fe78aa2",
      projectName: "Atlas",
      allocatedHours: 32,
      capacityHours: 40,
      utilizationPercentage: 80,
      utilizationStatus: "ALLOCATED",
      updatedAt: "2026-07-15T08:00:00Z"
    }
  ]
};

describe("resource allocation dashboard", () => {
  it("displays live allocation totals and assignments", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(dashboard), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    render(<App />);

    expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();
    expect(await screen.findByText("Alex Morgan")).toBeInTheDocument();
    expect(screen.getByText("76h")).toBeInTheDocument();
    expect(screen.getByText("95.0%")).toBeInTheDocument();
    expect(screen.getByText("allocated")).toBeInTheDocument();
  });

  it("shows an actionable error when live data cannot be loaded", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Live allocation data is temporarily unavailable."
      );
    });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
