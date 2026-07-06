package org.simpleapp.controller;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
public class RegistrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void shouldReturn201WhenRegistrationIsSuccessful() throws Exception {
        String requestBody = "{\"emailAddress\":\"test@example.com\",\"password\":\"StrongP@ss1\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountId", notNullValue()))
                .andExpect(jsonPath("$.accountStatus", is("active")))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.createdAt", notNullValue()));
    }

    @Test
    public void shouldReturn422WhenPasswordTooShort() throws Exception {
        String requestBody = "{\"emailAddress\":\"user@example.com\",\"password\":\"Ab1!\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors[0].field", is("password")))
                .andExpect(jsonPath("$.errors[0].code", is("password_too_short")));
    }

    @Test
    public void shouldReturn422WhenPasswordMissingUppercase() throws Exception {
        String requestBody = "{\"emailAddress\":\"user@example.com\",\"password\":\"abcdefg1!\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    public void shouldReturn422WhenEmailInvalid() throws Exception {
        String requestBody = "{\"emailAddress\":\"invalid-email\",\"password\":\"StrongP@ss1\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].field", is("email_address")))
                .andExpect(jsonPath("$.errors[0].code", is("email_invalid")));
    }

    @Test
    public void shouldReturn409WhenEmailAlreadyExists() throws Exception {
        String requestBody = "{\"emailAddress\":\"duplicate@example.com\",\"password\":\"StrongP@ss1\",\"consentFlag\":true}";

        // First registration should succeed
        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated());

        // Second registration with same email should fail
        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].field", is("email_address")))
                .andExpect(jsonPath("$.errors[0].code", is("email_taken")));
    }

    @Test
    public void shouldReturn422WhenPasswordOnBlocklist() throws Exception {
        // "password" is seeded in the blocklist via data.sql
        String requestBody = "{\"emailAddress\":\"blocklist@example.com\",\"password\":\"Password1!\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].field", is("password")))
                .andExpect(jsonPath("$.errors[0].code", is("password_blocked")));
    }

    @Test
    public void shouldReturn422WhenNoTokenIssuedOnValidationFailure() throws Exception {
        String requestBody = "{\"emailAddress\":\"user@example.com\",\"password\":\"weak\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    public void shouldReturn422WhenMissingRequiredFields() throws Exception {
        String requestBody = "{}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    public void shouldAcceptPasswordWithExactly8Characters() throws Exception {
        // EC-001: boundary test
        String requestBody = "{\"emailAddress\":\"boundary8@example.com\",\"password\":\"Ab1!xyzw\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    @Test
    public void shouldRejectPasswordWithExactly65Characters() throws Exception {
        // EC-002: boundary test
        String password = "Ab1!" + "a".repeat(61); // 65 chars total
        String requestBody = "{\"emailAddress\":\"boundary65@example.com\",\"password\":\"" + password + "\",\"consentFlag\":true}";

        mockMvc.perform(post("/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].code", is("password_too_long")));
    }
}
