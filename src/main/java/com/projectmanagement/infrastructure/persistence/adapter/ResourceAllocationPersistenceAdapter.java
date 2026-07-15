package com.projectmanagement.infrastructure.persistence.adapter;

import com.projectmanagement.domain.model.ResourceAllocation;
import com.projectmanagement.domain.port.out.ResourceAllocationRepository;
import com.projectmanagement.infrastructure.persistence.entity.ResourceAllocationJpaEntity;
import com.projectmanagement.infrastructure.persistence.repository.SpringDataResourceAllocationRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA-backed resource allocation repository adapter.
 */
@Repository
public class ResourceAllocationPersistenceAdapter implements ResourceAllocationRepository {

    private final SpringDataResourceAllocationRepository repository;

    /**
     * Creates a persistence adapter backed by Spring Data.
     *
     * @param repository resource allocation JPA repository
     */
    public ResourceAllocationPersistenceAdapter(SpringDataResourceAllocationRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<ResourceAllocation> findAll() {
        return repository.findAllByOrderByResourceNameAscProjectNameAsc().stream()
                .map(ResourceAllocationPersistenceAdapter::toDomain)
                .toList();
    }

    private static ResourceAllocation toDomain(ResourceAllocationJpaEntity entity) {
        return new ResourceAllocation(
                entity.getId(),
                entity.getResourceName(),
                entity.getRole(),
                entity.getProjectId(),
                entity.getProjectName(),
                entity.getAllocatedHours(),
                entity.getCapacityHours(),
                entity.getUpdatedAt());
    }
}
