package com.example.projectcreation.adapter.web.controller;

import com.example.projectcreation.adapter.web.dto.CreateProjectRequest;
import com.example.projectcreation.adapter.web.dto.ProjectResponse;
import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.port.in.CreateProjectCommand;
import com.example.projectcreation.domain.port.in.CreateProjectUseCase;
import com.example.projectcreation.domain.port.in.GetProjectUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST adapter for project-related operations.
 * Translates HTTP requests into use-case calls and maps results back to DTOs.
 */
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final CreateProjectUseCase createProjectUseCase;
    private final GetProjectUseCase getProjectUseCase;

    public ProjectController(CreateProjectUseCase createProjectUseCase,
                             GetProjectUseCase getProjectUseCase) {
        this.createProjectUseCase = createProjectUseCase;
        this.getProjectUseCase = getProjectUseCase;
    }

    /**
     * POST /api/v1/projects — create a new project.
     */
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request) {

        CreateProjectCommand command = new CreateProjectCommand(
                request.name(), request.description());

        Project project = createProjectUseCase.createProject(command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ProjectResponse.from(project));
    }

    /**
     * GET /api/v1/projects/{id} — retrieve a project by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID id) {
        Project project = getProjectUseCase.getProjectById(id);
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    /**
     * GET /api/v1/projects — list all projects.
     */
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        List<ProjectResponse> projects = getProjectUseCase.getAllProjects()
                .stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(projects);
    }
}
