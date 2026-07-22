package com.example.projectcreation.domain.port.in;

import com.example.projectcreation.domain.model.Project;

import java.util.List;
import java.util.UUID;

/**
 * Inbound port — use-case for querying projects.
 */
public interface GetProjectUseCase {

    /**
     * Retrieves a single project by its identifier.
     *
     * @param id the project UUID
     * @return the matching {@link Project}
     */
    Project getProjectById(UUID id);

    /**
     * Returns all projects.
     *
     * @return list of all {@link Project} instances
     */
    List<Project> getAllProjects();
}
