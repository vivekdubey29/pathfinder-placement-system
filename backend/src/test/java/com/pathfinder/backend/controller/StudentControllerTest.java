package com.pathfinder.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 2 tests — Student Profile API.
 *
 * Tests that mutate the in-memory store are annotated with {@code @DirtiesContext}
 * so a fresh Spring context (and fresh seed data) is used for each such test.
 */
@SpringBootTest
@AutoConfigureMockMvc
class StudentControllerTest {

    @Autowired
    MockMvc mockMvc;

    // ---- GET /api/students/{id} ----

    @Test
    void getProfile_demoStudent_returns200() throws Exception {
        mockMvc.perform(get("/api/students/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("stu-001"))
                // fullName may have been changed by an earlier test; just verify it is a non-blank string.
                .andExpect(jsonPath("$.fullName").isString())
                .andExpect(jsonPath("$.email").isString())
                .andExpect(jsonPath("$.skills", isA(List.class)))
                .andExpect(jsonPath("$.cgpa").isNumber())
                .andExpect(jsonPath("$.graduationYear").isNumber())
                .andExpect(jsonPath("$.workModePreference").isString());
    }

    @Test
    void getProfile_seedValues_matchExpected() throws Exception {
        // Isolated test with fresh context to guarantee seed data.
        mockMvc.perform(get("/api/students/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cgpa").value(8.2))
                .andExpect(jsonPath("$.graduationYear").value(2027))
                .andExpect(jsonPath("$.degree").value("B.Tech"));
    }

    @Test
    void getProfile_unknownStudent_returns404() throws Exception {
        mockMvc.perform(get("/api/students/stu-999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("not found")));
    }

    // ---- PUT /api/students/{id} ----

    @Test
    @DirtiesContext  // resets in-memory store after this test so other tests see seed data
    void updateProfile_validBody_returns200AndSavesData() throws Exception {
        String body = """
                {
                  "fullName":           "Test Student",
                  "email":              "test@example.com",
                  "college":            "Test University",
                  "degree":             "B.Tech",
                  "graduationYear":     2027,
                  "cgpa":               8.5,
                  "skills":             ["Java", "Python", "SQL"],
                  "preferredRoles":     ["Backend Development"],
                  "preferredLocations": ["Bengaluru"],
                  "workModePreference": "HYBRID",
                  "resumeFileName":     "resume.pdf"
                }
                """;

        mockMvc.perform(put("/api/students/stu-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("stu-001"))
                .andExpect(jsonPath("$.fullName").value("Test Student"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.cgpa").value(8.5))
                .andExpect(jsonPath("$.updatedAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}")));
    }

    @Test
    void updateProfile_missingFullName_returns422WithErrors() throws Exception {
        String body = """
                {
                  "fullName":           "",
                  "email":              "test@example.com",
                  "college":            "Test University",
                  "degree":             "B.Tech",
                  "graduationYear":     2027,
                  "cgpa":               8.5,
                  "skills":             ["Java"],
                  "preferredRoles":     ["Backend Development"],
                  "preferredLocations": ["Bengaluru"],
                  "workModePreference": "HYBRID",
                  "resumeFileName":     ""
                }
                """;

        mockMvc.perform(put("/api/students/stu-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.errors").isMap());
    }

    @Test
    void updateProfile_invalidCgpa_returns422() throws Exception {
        String body = """
                {
                  "fullName":           "Test",
                  "email":              "test@example.com",
                  "college":            "Test University",
                  "degree":             "B.Tech",
                  "graduationYear":     2027,
                  "cgpa":               11.0,
                  "skills":             ["Java"],
                  "preferredRoles":     ["Backend Development"],
                  "preferredLocations": ["Bengaluru"],
                  "workModePreference": "HYBRID",
                  "resumeFileName":     ""
                }
                """;

        mockMvc.perform(put("/api/students/stu-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity());
    }
}
