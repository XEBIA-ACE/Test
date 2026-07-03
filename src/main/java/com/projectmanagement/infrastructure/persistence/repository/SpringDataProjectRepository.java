package com.projectmanagement.infrastructure.persistence.repository;

import com.projectmanagement.domain.model.ProjectStatus;
import com.projectmanagement.infrastructure.persistence.entity.ProjectJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link ProjectJpaEntity}.
 */
@Repository
public interface SpringDataProjectRepository extends JpaRepository<ProjectJpaEntity, UUID> {

    List<ProjectJpaEntity> findByStatus(ProjectStatus status);

    List<ProjectJpaEntity> findByOwnerId(String ownerId);
}
