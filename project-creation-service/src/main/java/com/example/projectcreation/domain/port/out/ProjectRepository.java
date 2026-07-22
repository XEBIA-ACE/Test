package com.example.projectcreation.domain.port.out;

import com.example.projectcreation.domain.model.Project;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Outbound port — persistence contract for projects.
 * Implemented by the infrastructure layer.
 */
public interface ProjectRepository {

    /**
     * Persists a project (insert or update).
     *
     * @param project the project to save
     * @return the saved project
     */
    Project save(Project project);

    /**
     * Finds a project by its unique identifier.
     *
     * @param id the project UUID
     * @return an {@link Optional} containing the project, or empty if not found
     */
    Optional<Project> findById(UUID id);

    /**
     * Returns all persisted projects.
     *
     * @return list of all projects
     */
    List<Project> findAll();
}
