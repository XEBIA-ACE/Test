export type UtilizationStatus = "AVAILABLE" | "ALLOCATED" | "OVER_ALLOCATED";

export interface ResourceAllocation {
  id: string;
  resourceName: string;
  role: string;
  projectId: string;
  projectName: string;
  allocatedHours: number;
  capacityHours: number;
  utilizationPercentage: number;
  utilizationStatus: UtilizationStatus;
  updatedAt: string;
}

export interface ResourceAllocationDashboard {
  totalResources: number;
  allocatedHours: number;
  capacityHours: number;
  utilizationPercentage: number;
  overAllocatedResources: number;
  lastUpdated: string;
  allocations: ResourceAllocation[];
}
