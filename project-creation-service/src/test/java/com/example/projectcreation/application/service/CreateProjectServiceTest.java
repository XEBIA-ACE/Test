package com.example.projectcreation.application.service;

import com.example.projectcreation.domain.exception.ProjectValidationException;
import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.model.ProjectStatus;
import com.example.projectcreation.domain.port.in.CreateProjectCommand;
import com.example.projectcreation.domain.port.out.ProjectEventPublisher;
import com.example.projectcreation.domain.port.out.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CreateProjectService}.
 * All dependencies are mocked — no Spring context needed.
 */
@ExtendWith(MockitoExtension.class)
class CreateProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectEventPublisher eventPublisher;

    private CreateProjectService service;

    @BeforeEach
    void setUp() {
        service = new CreateProjectService(projectRepository, eventPublisher);
    }

    @Test
    @DisplayName("createProject saves the project and publishes an event")
    void createProject_savesAndPublishesEvent() {
        // Arrange
        CreateProjectCommand command = new CreateProjectCommand("My Project", "desc");
        Project saved = new Project(UUID.randomUUID(), "My Project", "desc",
                ProjectStatus.PENDING, Instant.now(), Instant.now());
        when(projectRepository.save(any(Project.class))).thenReturn(saved);

        // Act
        Project result = service.createProject(command);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("My Project");

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(eventPublisher).publishProjectCreated(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("My Project");
    }

    @Test
    @DisplayName("createProject throws ProjectValidationException for blank name")
    void createProject_blankName_throwsValidationException() {
        CreateProjectCommand command = new CreateProjectCommand("", "desc");

        assertThatThrownBy(() -> service.createProject(command))
                .isInstanceOf(ProjectValidationException.class)
                .hasMessageContaining("name");
    }

    @Test
    @DisplayName("createProject throws ProjectValidationException for null name")
    void createProject_nullName_throwsValidationException() {
        CreateProjectCommand command = new CreateProjectCommand(null, "desc");

        assertThatThrownBy(() -> service.createProject(command))
                .isInstanceOf(ProjectValidationException.class);
    }

    @Test
    @DisplayName("createProject throws ProjectValidationException when description exceeds 1000 chars")
    void createProject_longDescription_throwsValidationException() {
        String longDesc = "x".repeat(1001);
        CreateProjectCommand command = new CreateProjectCommand("Valid Name", longDesc);

        assertThatThrownBy(() -> service.createProject(command))
                .isInstanceOf(ProjectValidationException.class)
                .hasMessageContaining("Description");
    }
}
