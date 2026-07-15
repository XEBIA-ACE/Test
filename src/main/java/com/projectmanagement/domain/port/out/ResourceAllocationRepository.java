package com.projectmanagement.domain.port.out;

import com.projectmanagement.domain.model.ResourceAllocation;

import java.util.List;

/**
 * Persistence contract for resource allocation data.
 */
public interface ResourceAllocationRepository {

    /**
     * Finds current allocations ordered for dashboard display.
     *
     * @return current resource allocations
     */
    List<ResourceAllocation> findAll();
}
