package com.example.projectcreation.application.service;

import com.example.projectcreation.domain.exception.ProjectValidationException;
import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.port.in.CreateProjectCommand;
import com.example.projectcreation.domain.port.in.CreateProjectUseCase;
import com.example.projectcreation.domain.port.out.ProjectEventPublisher;
import com.example.projectcreation.domain.port.out.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service that orchestrates project creation.
 * Implements the {@link CreateProjectUseCase} inbound port.
 */
@Service
@Transactional
public class CreateProjectService implements CreateProjectUseCase {

    private final ProjectRepository projectRepository;
    private final ProjectEventPublisher eventPublisher;

    public CreateProjectService(ProjectRepository projectRepository,
                                ProjectEventPublisher eventPublisher) {
        this.projectRepository = projectRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public Project createProject(CreateProjectCommand command) {
        validate(command);

        Project project = Project.create(command.name(), command.description());
        Project saved = projectRepository.save(project);

        // Trigger event processing (outbound port)
        eventPublisher.publishProjectCreated(saved);

        return saved;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void validate(CreateProjectCommand command) {
        if (command.name() == null || command.name().isBlank()) {
            throw new ProjectValidationException("Project name must not be blank");
        }
        if (command.name().length() > 255) {
            throw new ProjectValidationException("Project name must not exceed 255 characters");
        }
        if (command.description() != null && command.description().length() > 1000) {
            throw new ProjectValidationException("Description must not exceed 1000 characters");
        }
    }
}
