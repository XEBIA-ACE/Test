package com.projectmanagement.application.service;

import com.projectmanagement.domain.exception.ProjectNotFoundException;
import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;
import com.projectmanagement.domain.port.out.CalendarServicePort;
import com.projectmanagement.domain.port.out.ProjectRepository;
import com.projectmanagement.domain.port.out.ReportingServicePort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ProjectService}.
 *
 * All dependencies are mocked — no Spring context or database required.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService")
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private CalendarServicePort calendarServicePort;

    @Mock
    private ReportingServicePort reportingServicePort;

    @InjectMocks
    private ProjectService projectService;

    private UUID projectId;
    private Project planningProject;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        planningProject = Project.reconstitute(
                projectId,
                "Alpha Project",
                "Description",
                ProjectStatus.PLANNING,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 12, 31),
                "owner-42",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    // ── createProject ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createProject saves and returns a new project in PLANNING status")
    void createProject_savesAndReturnsProject() {
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.createProject(
                "Alpha Project", "Description",
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                "owner-42");

        assertThat(result.getName()).isEqualTo("Alpha Project");
        assertThat(result.getStatus()).isEqualTo(ProjectStatus.PLANNING);
        assertThat(result.getOwnerId()).isEqualTo("owner-42");
        verify(projectRepository).save(any(Project.class));
        verify(reportingServicePort).notifyProjectCreated(any(UUID.class));
    }

    // ── getProjectById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getProjectById returns project when it exists")
    void getProjectById_returnsProject() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(planningProject));

        Project result = projectService.getProjectById(projectId);

        assertThat(result.getId()).isEqualTo(projectId);
    }

    @Test
    @DisplayName("getProjectById throws ProjectNotFoundException when project does not exist")
    void getProjectById_throwsWhenNotFound() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getProjectById(projectId))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    // ── getAllProjects ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllProjects returns all projects from repository")
    void getAllProjects_returnsAll() {
        when(projectRepository.findAll()).thenReturn(List.of(planningProject));

        List<Project> results = projectService.getAllProjects();

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(projectId);
    }

    // ── activateProject ───────────────────────────────────────────────────────

    @Test
    @DisplayName("activateProject transitions project from PLANNING to ACTIVE")
    void activateProject_transitionsToActive() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(planningProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.activateProject(projectId);

        assertThat(result.getStatus()).isEqualTo(ProjectStatus.ACTIVE);
        verify(reportingServicePort).notifyProjectStatusChanged(eq(projectId), eq("ACTIVE"));
    }

    @Test
    @DisplayName("activateProject throws when project is not in PLANNING status")
    void activateProject_throwsWhenNotPlanning() {
        Project activeProject = Project.reconstitute(
                projectId, "Alpha", "desc", ProjectStatus.ACTIVE,
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                "owner-42", LocalDateTime.now(), LocalDateTime.now()
        );
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(activeProject));

        assertThatThrownBy(() -> projectService.activateProject(projectId))
                .isInstanceOf(RuntimeException.class);
    }

    // ── completeProject ───────────────────────────────────────────────────────

    @Test
    @DisplayName("completeProject transitions project from ACTIVE to COMPLETED")
    void completeProject_transitionsToCompleted() {
        Project activeProject = Project.reconstitute(
                projectId, "Alpha", "desc", ProjectStatus.ACTIVE,
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                "owner-42", LocalDateTime.now(), LocalDateTime.now()
        );
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(activeProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.completeProject(projectId);

        assertThat(result.getStatus()).isEqualTo(ProjectStatus.COMPLETED);
        verify(reportingServicePort).notifyProjectStatusChanged(eq(projectId), eq("COMPLETED"));
    }

    // ── deleteProject ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteProject calls repository deleteById")
    void deleteProject_callsRepository() {
        when(projectRepository.existsById(projectId)).thenReturn(true);

        projectService.deleteProject(projectId);

        verify(projectRepository).deleteById(projectId);
    }

    @Test
    @DisplayName("deleteProject throws ProjectNotFoundException when project does not exist")
    void deleteProject_throwsWhenNotFound() {
        when(projectRepository.existsById(projectId)).thenReturn(false);

        assertThatThrownBy(() -> projectService.deleteProject(projectId))
                .isInstanceOf(ProjectNotFoundException.class);
    }
}
