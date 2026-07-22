package com.example.projectcreation.application.service;

import com.example.projectcreation.domain.exception.ProjectNotFoundException;
import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.port.in.GetProjectUseCase;
import com.example.projectcreation.domain.port.out.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Application service for querying projects.
 * Implements the {@link GetProjectUseCase} inbound port.
 */
@Service
@Transactional(readOnly = true)
public class GetProjectService implements GetProjectUseCase {

    private final ProjectRepository projectRepository;

    public GetProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Override
    public Project getProjectById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(
                        "Project not found with id: " + id));
    }

    @Override
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
}
