package com.projectmanagement.domain.port.in;

import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Input port — defines the use cases exposed by the domain to driving adapters (e.g. REST).
 */
public interface ProjectUseCase {

    /**
     * Creates a new project in PLANNING status.
     */
    Project createProject(
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            String ownerId);

    /**
     * Retrieves a project by its identifier.
     */
    Project getProjectById(UUID id);

    /**
     * Returns all projects.
     */
    List<Project> getAllProjects();

    /**
     * Returns all projects filtered by status.
     */
    List<Project> getProjectsByStatus(ProjectStatus status);

    /**
     * Returns all projects owned by the given owner.
     */
    List<Project> getProjectsByOwner(String ownerId);

    /**
     * Updates mutable project details.
     */
    Project updateProject(
            UUID id,
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate);

    /**
     * Transitions a project from PLANNING → ACTIVE.
     */
    Project activateProject(UUID id);

    /**
     * Transitions a project from ACTIVE → COMPLETED.
     */
    Project completeProject(UUID id);

    /**
     * Archives a project regardless of current status.
     */
    Project archiveProject(UUID id);

    /**
     * Deletes a project permanently.
     */
    void deleteProject(UUID id);
}
