package org.simpleapp.project;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

/**
 * Read-side use cases for viewing and navigating projects (US-003, SVC-PROJ-01).
 *
 * <p>Enforces access scoping on the listing (FR-001/FR-003) and orders
 * existence before authorization on the detail path so that a missing project
 * yields 404 regardless of the caller's authorization (FR-007/EC-002), while an
 * existing but inaccessible project yields 403 (FR-006/EC-003).
 */
@Service
public class ProjectService {

    private final ProjectRepository repository;

    public ProjectService(ProjectRepository repository) {
        this.repository = repository;
    }

    /** Returns the access-scoped listing for a user; empty when none accessible (FR-008). */
    public List<ProjectSummary> listAccessibleProjects(UUID userId) {
        return repository.findAccessibleByUser(userId).stream()
                .map(ProjectSummary::new)
                .collect(Collectors.toList());
    }

    /** Returns the full project detail, enforcing existence then authorization. */
    public Project getProject(UUID userId, UUID projectId) {
        Project project = repository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + projectId));

        if (!repository.isMember(projectId, userId)) {
            throw new AccessDeniedException("User is not authorized to access project: " + projectId);
        }
        return project;
    }
}
