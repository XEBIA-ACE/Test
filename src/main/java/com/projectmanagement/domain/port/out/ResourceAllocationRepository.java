package com.projectmanagement.domain.port.out;

import com.projectmanagement.domain.model.ResourceAllocation;

import java.util.List;

/**
 * Persistence contract for resource allocation data.
 */
public interface ResourceAllocationRepository {

    List<ResourceAllocation> findAll();
}
