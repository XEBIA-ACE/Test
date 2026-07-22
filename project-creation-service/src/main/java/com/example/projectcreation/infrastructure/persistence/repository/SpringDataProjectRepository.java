package com.example.projectcreation.infrastructure.persistence.repository;

import com.example.projectcreation.infrastructure.persistence.entity.ProjectJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Spring Data JPA repository for {@link ProjectJpaEntity}.
 */
public interface SpringDataProjectRepository extends JpaRepository<ProjectJpaEntity, UUID> {
}
