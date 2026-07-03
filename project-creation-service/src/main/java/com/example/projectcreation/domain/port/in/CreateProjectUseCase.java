package com.example.projectcreation.domain.port.in;

import com.example.projectcreation.domain.model.Project;

/**
 * Inbound port — use-case for creating a new project.
 */
public interface CreateProjectUseCase {

    /**
     * Creates and persists a new project.
     *
     * @param command the creation command carrying validated input
     * @return the newly created {@link Project}
     */
    Project createProject(CreateProjectCommand command);
}
