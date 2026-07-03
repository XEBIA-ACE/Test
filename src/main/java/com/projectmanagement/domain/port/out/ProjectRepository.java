package com.projectmanagement.domain.port.out;

import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Output port — defines how the domain persists and retrieves Projects.
 * Implemented by the infrastructure (JPA) adapter.
 */
public interface ProjectRepository {

    Project save(Project project);

    Optional<Project> findById(UUID id);

    List<Project> findAll();

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByOwnerId(String ownerId);

    void deleteById(UUID id);

    boolean existsById(UUID id);
}
