package com.projectmanagement.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanagement.application.service.ProjectService;
import com.projectmanagement.domain.exception.ProjectNotFoundException;
import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;
import com.projectmanagement.domain.port.in.ProjectUseCase;
import com.projectmanagement.web.dto.CreateProjectRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link ProjectController}.
 */
@WebMvcTest(ProjectController.class)
@DisplayName("ProjectController")
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectUseCase projectUseCase;

    private Project sampleProject;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        sampleProject = Project.reconstitute(
                projectId,
                "Test Project",
                "A test project description",
                ProjectStatus.PLANNING,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 12, 31),
                "owner-001",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    // ── GET /api/v1/projects ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/projects returns 200 with list of projects")
    void getAllProjects_returns200() throws Exception {
        when(projectUseCase.getAllProjects()).thenReturn(List.of(sampleProject));

        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(projectId.toString())))
                .andExpect(jsonPath("$[0].name", is("Test Project")));
    }

    @Test
    @DisplayName("GET /api/v1/projects?status=PLANNING filters by status")
    void getAllProjects_filterByStatus() throws Exception {
        when(projectUseCase.getProjectsByStatus(ProjectStatus.PLANNING))
                .thenReturn(List.of(sampleProject));

        mockMvc.perform(get("/api/v1/projects").param("status", "PLANNING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status", is("PLANNING")));
    }

    // ── GET /api/v1/projects/{id} ─────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/projects/{id} returns 200 when project exists")
    void getProjectById_returns200() throws Exception {
        when(projectUseCase.getProjectById(projectId)).thenReturn(sampleProject);

        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(projectId.toString())))
                .andExpect(jsonPath("$.name", is("Test Project")));
    }

    @Test
    @DisplayName("GET /api/v1/projects/{id} returns 404 when project not found")
    void getProjectById_returns404WhenNotFound() throws Exception {
        when(projectUseCase.getProjectById(projectId))
                .thenThrow(new ProjectNotFoundException(projectId));

        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/v1/projects ─────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/projects returns 201 with created project")
    void createProject_returns201() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("Test Project");
        request.setDescription("A test project description");
        request.setStartDate(LocalDate.of(2025, 1, 1));
        request.setEndDate(LocalDate.of(2025, 12, 31));
        request.setOwnerId("owner-001");

        when(projectUseCase.createProject(
                eq("Test Project"),
                eq("A test project description"),
                eq(LocalDate.of(2025, 1, 1)),
                eq(LocalDate.of(2025, 12, 31)),
                eq("owner-001")
        )).thenReturn(sampleProject);

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(projectId.toString())))
                .andExpect(jsonPath("$.name", is("Test Project")));
    }

    @Test
    @DisplayName("POST /api/v1/projects returns 400 when name is blank")
    void createProject_returns400WhenNameBlank() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("");
        request.setOwnerId("owner-001");

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/v1/projects/{id}/activate ──────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/projects/{id}/activate returns 200 with activated project")
    void activateProject_returns200() throws Exception {
        Project activeProject = Project.reconstitute(
                projectId, "Test Project", "desc",
                ProjectStatus.ACTIVE,
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                "owner-001", LocalDateTime.now(), LocalDateTime.now()
        );
        when(projectUseCase.activateProject(projectId)).thenReturn(activeProject);

        mockMvc.perform(post("/api/v1/projects/{id}/activate", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    // ── DELETE /api/v1/projects/{id} ──────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/v1/projects/{id} returns 204")
    void deleteProject_returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/{id}", projectId))
                .andExpect(status().isNoContent());
    }
}
