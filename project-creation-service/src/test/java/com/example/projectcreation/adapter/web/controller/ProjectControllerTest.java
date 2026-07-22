package com.example.projectcreation.adapter.web.controller;

import com.example.projectcreation.adapter.web.dto.CreateProjectRequest;
import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.model.ProjectStatus;
import com.example.projectcreation.domain.port.in.CreateProjectCommand;
import com.example.projectcreation.domain.port.in.CreateProjectUseCase;
import com.example.projectcreation.domain.port.in.GetProjectUseCase;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit-level slice test for {@link ProjectController}.
 */
@WebMvcTest(ProjectController.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CreateProjectUseCase createProjectUseCase;

    @MockBean
    private GetProjectUseCase getProjectUseCase;

    // ── Fixtures ──────────────────────────────────────────────────────────────

    private static final UUID PROJECT_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
    private static final Instant NOW = Instant.parse("2024-01-01T00:00:00Z");

    private Project sampleProject() {
        return new Project(PROJECT_ID, "Test Project", "A description",
                ProjectStatus.PENDING, NOW, NOW);
    }

    // ── POST /api/v1/projects ─────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/projects returns 201 with created project")
    void createProject_returnsCreated() throws Exception {
        when(createProjectUseCase.createProject(any(CreateProjectCommand.class)))
                .thenReturn(sampleProject());

        CreateProjectRequest request = new CreateProjectRequest("Test Project", "A description");

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(PROJECT_ID.toString()))
                .andExpect(jsonPath("$.name").value("Test Project"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/v1/projects with blank name returns 400")
    void createProject_blankName_returnsBadRequest() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("", "A description");

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ── GET /api/v1/projects/{id} ─────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/projects/{id} returns 200 with project")
    void getProject_returnsOk() throws Exception {
        when(getProjectUseCase.getProjectById(PROJECT_ID)).thenReturn(sampleProject());

        mockMvc.perform(get("/api/v1/projects/{id}", PROJECT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(PROJECT_ID.toString()))
                .andExpect(jsonPath("$.name").value("Test Project"));
    }

    // ── GET /api/v1/projects ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/projects returns 200 with list of projects")
    void getAllProjects_returnsOk() throws Exception {
        when(getProjectUseCase.getAllProjects()).thenReturn(List.of(sampleProject()));

        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(PROJECT_ID.toString()));
    }
}
