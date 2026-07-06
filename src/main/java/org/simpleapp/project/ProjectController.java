package org.simpleapp.project;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST endpoints for viewing and navigating projects (US-003, SVC-PROJ-01).
 *
 * <p>Per A-001 the caller identity is resolved upstream and provided to the
 * service; here it is carried in the {@code X-User-Id} header. A missing or
 * malformed identity is treated as unauthenticated (FR-009).
 */
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectSummary> listProjects(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return projectService.listAccessibleProjects(resolveCaller(userId));
    }

    @GetMapping("/{id}")
    public Project getProject(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable("id") String id) {
        return projectService.getProject(resolveCaller(userId), parseProjectId(id));
    }

    private UUID resolveCaller(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new UnauthenticatedException("Missing authentication identity");
        }
        try {
            return UUID.fromString(userId.trim());
        } catch (IllegalArgumentException e) {
            throw new UnauthenticatedException("Invalid authentication identity");
        }
    }

    private UUID parseProjectId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            // A syntactically invalid identifier cannot match any record (FR-007).
            throw new ProjectNotFoundException("Project not found: " + id);
        }
    }
}
