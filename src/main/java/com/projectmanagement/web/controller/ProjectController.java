package com.projectmanagement.web.controller;

import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;
import com.projectmanagement.domain.port.in.ProjectUseCase;
import com.projectmanagement.web.dto.CreateProjectRequest;
import com.projectmanagement.web.dto.ProjectResponse;
import com.projectmanagement.web.dto.UpdateProjectRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST adapter — exposes the Project use cases over HTTP.
 */
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectUseCase projectUseCase;

    public ProjectController(ProjectUseCase projectUseCase) {
        this.projectUseCase = projectUseCase;
    }

    // ── Create ───────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request) {

        Project project = projectUseCase.createProject(
                request.getName(),
                request.getDescription(),
                request.getStartDate(),
                request.getEndDate(),
                request.getOwnerId());

        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectResponse.from(project));
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID id) {
        Project project = projectUseCase.getProjectById(id);
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> listProjects(
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String ownerId) {

        List<Project> projects;
        if (status != null) {
            projects = projectUseCase.getProjectsByStatus(status);
        } else if (ownerId != null) {
            projects = projectUseCase.getProjectsByOwner(ownerId);
        } else {
            projects = projectUseCase.getAllProjects();
        }

        List<ProjectResponse> response = projects.stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request) {

        Project project = projectUseCase.updateProject(
                id,
                request.getName(),
                request.getDescription(),
                request.getStartDate(),
                request.getEndDate());

        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    // ── Status transitions ───────────────────────────────────────────────────

    @PostMapping("/{id}/activate")
    public ResponseEntity<ProjectResponse> activateProject(@PathVariable UUID id) {
        return ResponseEntity.ok(ProjectResponse.from(projectUseCase.activateProject(id)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ProjectResponse> completeProject(@PathVariable UUID id) {
        return ResponseEntity.ok(ProjectResponse.from(projectUseCase.completeProject(id)));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<ProjectResponse> archiveProject(@PathVariable UUID id) {
        return ResponseEntity.ok(ProjectResponse.from(projectUseCase.archiveProject(id)));
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectUseCase.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
