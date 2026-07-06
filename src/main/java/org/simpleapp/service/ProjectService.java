package org.simpleapp.service;

import org.simpleapp.dto.ProjectResponse;
import org.simpleapp.dto.ProjectUpdateRequest;
import org.simpleapp.dto.ValidationError;
import org.simpleapp.exception.AccessDeniedException;
import org.simpleapp.exception.ProjectNotFoundException;
import org.simpleapp.exception.ValidationException;
import org.simpleapp.model.PermissionLevel;
import org.simpleapp.model.Project;
import org.simpleapp.model.ProjectType;
import org.simpleapp.repository.ProjectPermissionRepository;
import org.simpleapp.repository.ProjectRepository;
import org.simpleapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectPermissionRepository permissionRepository;

    public ProjectService(ProjectRepository projectRepository,
                          UserRepository userRepository,
                          ProjectPermissionRepository permissionRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(String projectId, String userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        checkReadAccess(projectId, userId);

        return ProjectResponse.fromEntity(project);
    }

    @Transactional
    public ProjectResponse updateProject(String projectId, ProjectUpdateRequest request, String userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        checkEditAccess(projectId, userId);

        List<ValidationError> errors = validate(request, project);
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        applyUpdates(project, request);
        project.setUpdatedAt(Instant.now());

        Project saved = projectRepository.save(project);
        return ProjectResponse.fromEntity(saved);
    }

    private void checkReadAccess(String projectId, String userId) {
        boolean hasAccess = permissionRepository.existsByProjectIdAndUserIdAndPermissionLevelIn(
                projectId, userId,
                Arrays.asList(PermissionLevel.OWNER, PermissionLevel.EDITOR, PermissionLevel.VIEWER));
        if (!hasAccess) {
            throw new AccessDeniedException("Access denied to project " + projectId);
        }
    }

    private void checkEditAccess(String projectId, String userId) {
        boolean hasEditAccess = permissionRepository.existsByProjectIdAndUserIdAndPermissionLevelIn(
                projectId, userId,
                Arrays.asList(PermissionLevel.OWNER, PermissionLevel.EDITOR));
        if (!hasEditAccess) {
            throw new AccessDeniedException("You do not have permission to edit this project");
        }
    }

    List<ValidationError> validate(ProjectUpdateRequest request, Project existing) {
        List<ValidationError> errors = new ArrayList<>();

        if (request.getName() != null && request.getName().trim().isEmpty()) {
            errors.add(new ValidationError("name", "Name must not be empty"));
        }

        if (request.getType() != null && !ProjectType.isValid(request.getType())) {
            errors.add(new ValidationError("type", "Invalid project type: " + request.getType()));
        }

        if (request.getOwnerId() != null && !userRepository.existsById(request.getOwnerId())) {
            errors.add(new ValidationError("owner_id", "User not found: " + request.getOwnerId()));
        }

        return errors;
    }

    private void applyUpdates(Project project, ProjectUpdateRequest request) {
        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        } else {
            // FR-011: preserve previous value when field is absent
        }
        if (request.getType() != null) {
            project.setType(ProjectType.valueOf(request.getType()));
        }
        if (request.getOwnerId() != null) {
            project.setOwnerId(request.getOwnerId());
        }
    }
}
