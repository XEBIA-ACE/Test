package org.simpleapp.controller;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
public class ProjectUpdateControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void viewerReceives403OnPut() throws Exception {
        String body = "{\"name\":\"Hacked\"}";

        mockMvc.perform(put("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-003")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    public void editorCanUpdateProjectSuccessfully() throws Exception {
        String body = "{\"name\":\"Updated by Editor\",\"description\":\"New desc\"}";

        mockMvc.perform(put("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-002")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", equalTo("Updated by Editor")))
                .andExpect(jsonPath("$.description", equalTo("New desc")))
                .andExpect(jsonPath("$.updatedAt", notNullValue()));
    }

    @Test
    public void emptyNameReturns422WithErrorArray() throws Exception {
        String body = "{\"name\":\"\"}";

        mockMvc.perform(put("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors", hasSize(1)))
                .andExpect(jsonPath("$.errors[0].field", equalTo("name")));
    }

    @Test
    public void getAfterPutReflectsUpdatedValues() throws Exception {
        String body = "{\"name\":\"After Update\"}";

        mockMvc.perform(put("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", equalTo("After Update")));
    }

    @Test
    public void ownerCanGetProject() throws Exception {
        mockMvc.perform(get("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", equalTo("proj-001")))
                .andExpect(jsonPath("$.name", notNullValue()))
                .andExpect(jsonPath("$.type", notNullValue()))
                .andExpect(jsonPath("$.ownerId", equalTo("user-001")))
                .andExpect(jsonPath("$.updatedAt", notNullValue()));
    }

    @Test
    public void invalidTypeReturns422() throws Exception {
        String body = "{\"type\":\"NONEXISTENT_TYPE\"}";

        mockMvc.perform(put("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].field", equalTo("type")));
    }

    @Test
    public void invalidOwnerIdReturns422() throws Exception {
        String body = "{\"ownerId\":\"nonexistent-user-id\"}";

        mockMvc.perform(put("/api/v1/projects/proj-001")
                .header("X-User-Id", "user-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].field", equalTo("owner_id")));
    }

    @Test
    public void nonExistentProjectReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/projects/nonexistent")
                .header("X-User-Id", "user-001"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }
}
