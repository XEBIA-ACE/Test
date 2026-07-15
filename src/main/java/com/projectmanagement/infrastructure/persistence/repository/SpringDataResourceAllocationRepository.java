package com.projectmanagement.infrastructure.persistence.repository;

import com.projectmanagement.infrastructure.persistence.entity.ResourceAllocationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data access for resource allocations.
 */
public interface SpringDataResourceAllocationRepository
        extends JpaRepository<ResourceAllocationJpaEntity, UUID> {

    List<ResourceAllocationJpaEntity> findAllByOrderByResourceNameAscProjectNameAsc();
}
