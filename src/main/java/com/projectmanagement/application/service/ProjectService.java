package com.projectmanagement.application.service;

import com.projectmanagement.domain.exception.ProjectNotFoundException;
import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;
import com.projectmanagement.domain.port.in.ProjectUseCase;
import com.projectmanagement.domain.port.out.CalendarServicePort;
import com.projectmanagement.domain.port.out.ProjectRepository;
import com.projectmanagement.domain.port.out.ReportingServicePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Application service that orchestrates project lifecycle use cases.
 * Implements the {@link ProjectUseCase} input port.
 */
@Service
@Transactional
public class ProjectService implements ProjectUseCase {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private final CalendarServicePort calendarServicePort;
    private final ReportingServicePort reportingServicePort;

    public ProjectService(
            ProjectRepository projectRepository,
            CalendarServicePort calendarServicePort,
            ReportingServicePort reportingServicePort) {
        this.projectRepository = projectRepository;
        this.calendarServicePort = calendarServicePort;
        this.reportingServicePort = reportingServicePort;
    }

    @Override
    public Project createProject(
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            String ownerId) {

        log.info("Creating project '{}' for owner '{}'", name, ownerId);
        Project project = Project.create(name, description, startDate, endDate, ownerId);
        Project saved = projectRepository.save(project);

        try {
            calendarServicePort.createProjectEvent(
                    saved.getId(), saved.getName(), saved.getStartDate(), saved.getEndDate());
        } catch (Exception e) {
            log.warn("Failed to create calendar event for project {}: {}", saved.getId(), e.getMessage());
        }

        try {
            reportingServicePort.notifyProjectCreated(saved.getId());
        } catch (Exception e) {
            log.warn("Failed to notify reporting service for project {}: {}", saved.getId(), e.getMessage());
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Project getProjectById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getProjectsByStatus(ProjectStatus status) {
        return projectRepository.findByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getProjectsByOwner(String ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    @Override
    public Project updateProject(
            UUID id,
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate) {

        log.info("Updating project '{}'", id);
        Project project = getProjectById(id);
        project.updateDetails(name, description, startDate, endDate);
        return projectRepository.save(project);
    }

    @Override
    public Project activateProject(UUID id) {
        log.info("Activating project '{}'", id);
        Project project = getProjectById(id);
        project.activate();
        Project saved = projectRepository.save(project);
        notifyStatusChange(saved);
        return saved;
    }

    @Override
    public Project completeProject(UUID id) {
        log.info("Completing project '{}'", id);
        Project project = getProjectById(id);
        project.complete();
        Project saved = projectRepository.save(project);
        notifyStatusChange(saved);
        return saved;
    }

    @Override
    public Project archiveProject(UUID id) {
        log.info("Archiving project '{}'", id);
        Project project = getProjectById(id);
        project.archive();
        Project saved = projectRepository.save(project);
        notifyStatusChange(saved);
        return saved;
    }

    @Override
    public void deleteProject(UUID id) {
        log.info("Deleting project '{}'", id);
        if (!projectRepository.existsById(id)) {
            throw new ProjectNotFoundException(id);
        }
        projectRepository.deleteById(id);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void notifyStatusChange(Project project) {
        try {
            reportingServicePort.notifyProjectStatusChanged(
                    project.getId(), project.getStatus().name());
        } catch (Exception e) {
            log.warn("Failed to notify reporting service of status change for project {}: {}",
                    project.getId(), e.getMessage());
        }
    }
}
