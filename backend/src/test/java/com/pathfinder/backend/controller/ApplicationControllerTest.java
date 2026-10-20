package com.pathfinder.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 3 tests — Application Tracker API.
 *
 * Note: the in-memory store is shared across tests within the same Spring
 * context, so tests must use unique internship IDs to avoid 409 conflicts.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApplicationControllerTest {

    @Autowired
    MockMvc mockMvc;

    // ---- GET /api/applications/{studentId} ----

    @Test
    void listByStudent_demoStudent_returns8SeedRecords() throws Exception {
        mockMvc.perform(get("/api/applications/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8)));
    }

    @Test
    void listByStudent_unknownStudent_returnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/applications/stu-999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void listByStudent_recordsHaveRequiredFields() throws Exception {
        mockMvc.perform(get("/api/applications/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id",           notNullValue()))
                .andExpect(jsonPath("$[0].studentId",    notNullValue()))
                .andExpect(jsonPath("$[0].internshipId", notNullValue()))
                .andExpect(jsonPath("$[0].status",       notNullValue()))
                .andExpect(jsonPath("$[0].trackedAt",    matchesPattern("\\d{4}-\\d{2}-\\d{2}")))
                .andExpect(jsonPath("$[0].updatedAt",    matchesPattern("\\d{4}-\\d{2}-\\d{2}")));
    }

    // ---- POST /api/applications ----

    @Test
    void create_validRequest_returns201() throws Exception {
        // int-004 is not in the seed data so no conflict.
        String body = """
                { "studentId": "stu-001", "internshipId": "int-004", "status": "SAVED", "notes": "" }
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id",           notNullValue()))
                .andExpect(jsonPath("$.internshipId").value("int-004"))
                .andExpect(jsonPath("$.status").value("SAVED"))
                .andExpect(jsonPath("$.appliedAt").value(nullValue()));
    }

    @Test
    void create_appliedStatus_setsAppliedAt() throws Exception {
        String body = """
                { "studentId": "stu-001", "internshipId": "int-005", "status": "APPLIED", "notes": "" }
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.appliedAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}")));
    }

    @Test
    void create_unknownInternship_returns404() throws Exception {
        String body = """
                { "studentId": "stu-001", "internshipId": "int-999", "status": "SAVED", "notes": "" }
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_duplicate_returns409() throws Exception {
        // int-001 is already in the seed for stu-001.
        String body = """
                { "studentId": "stu-001", "internshipId": "int-001", "status": "SAVED", "notes": "" }
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already in your tracker")));
    }

    @Test
    void create_invalidStatus_returns422() throws Exception {
        String body = """
                { "studentId": "stu-001", "internshipId": "int-007", "status": "PENDING", "notes": "" }
                """;

        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---- PUT /api/applications/{id} ----

    @Test
    void update_knownId_changesStatus() throws Exception {
        mockMvc.perform(put("/api/applications/app-0006")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"APPLIED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.appliedAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}")));
    }

    @Test
    void update_unknownId_returns404() throws Exception {
        mockMvc.perform(put("/api/applications/app-9999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"SAVED\"}"))
                .andExpect(status().isNotFound());
    }

    // ---- DELETE /api/applications/{id} ----

    @Test
    void delete_knownId_returns204() throws Exception {
        // Create first so we don't deplete seed records for other tests.
        String createBody = """
                { "studentId": "stu-001", "internshipId": "int-009", "status": "SAVED", "notes": "" }
                """;
        var createResult = mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = createResult.getResponse().getContentAsString();
        // Extract id from response JSON without a JSON library in tests.
        String id = responseBody.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(delete("/api/applications/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_unknownId_returns404() throws Exception {
        mockMvc.perform(delete("/api/applications/app-9999"))
                .andExpect(status().isNotFound());
    }
}
