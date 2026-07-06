package org.simpleapp.project;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Web-layer tests for the project read endpoints (US-003).
 *
 * <p>Uses the real (in-memory) {@link ProjectRepository} seed: Apollo is owned
 * by Alice with Bob as collaborator; Gemini is owned by Bob with Alice as
 * collaborator.
 */
@RunWith(SpringRunner.class)
@WebMvcTest(controllers = ProjectController.class)
@org.springframework.context.annotation.Import({ProjectService.class, ProjectRepository.class})
public class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String ALICE = "11111111-1111-1111-1111-111111111111";
    private static final String APOLLO = "aaaaaaaa-0000-0000-0000-000000000001";
    private static final String GEMINI = "aaaaaaaa-0000-0000-0000-000000000002";

    private String stranger;

    @Before
    public void setUp() {
        stranger = UUID.randomUUID().toString();
    }

    @Test
    public void listRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void listReturnsAccessibleProjectsWithNameAndOwner() throws Exception {
        mockMvc.perform(get("/api/v1/projects").header("X-User-Id", ALICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Apollo"))
                .andExpect(jsonPath("$[0].ownerId").exists());
    }

    @Test
    public void listReturnsEmptyArrayForUserWithNoProjects() throws Exception {
        mockMvc.perform(get("/api/v1/projects").header("X-User-Id", stranger))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    public void getProjectReturnsAllConfigurationAttributes() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + APOLLO).header("X-User-Id", ALICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Apollo"))
                .andExpect(jsonPath("$.description").exists())
                .andExpect(jsonPath("$.type").value("internal"))
                .andExpect(jsonPath("$.ownerId").exists());
    }

    @Test
    public void getProjectReturnsNotFoundForUnknownId() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + UUID.randomUUID()).header("X-User-Id", ALICE))
                .andExpect(status().isNotFound());
    }

    @Test
    public void getProjectReturnsForbiddenForUnauthorizedUser() throws Exception {
        // Gemini is owned by Bob; a stranger is neither owner nor member.
        mockMvc.perform(get("/api/v1/projects/" + GEMINI).header("X-User-Id", stranger))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.name").doesNotExist());
    }

    @Test
    public void getProjectRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + APOLLO))
                .andExpect(status().isUnauthorized());
    }
}
