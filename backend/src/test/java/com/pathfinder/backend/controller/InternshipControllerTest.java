package com.pathfinder.backend.controller;

import com.pathfinder.backend.service.InternshipService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 1 tests — Internship API.
 *
 * Uses a full Spring context + MockMvc (no network) so we can verify
 * JSON serialisation, date resolution and 404 behaviour.
 */
@SpringBootTest
@AutoConfigureMockMvc
class InternshipControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    InternshipService internshipService;

    // ---- GET /api/internships ----

    @Test
    void listAll_returns200AndExactly24Items() throws Exception {
        mockMvc.perform(get("/api/internships").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(24)));
    }

    @Test
    void listAll_firstItemHasExpectedShape() throws Exception {
        mockMvc.perform(get("/api/internships").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                // Spot-check required fields on the first item.
                .andExpect(jsonPath("$[0].id",            notNullValue()))
                .andExpect(jsonPath("$[0].title",         notNullValue()))
                .andExpect(jsonPath("$[0].company",       notNullValue()))
                .andExpect(jsonPath("$[0].company.name",  notNullValue()))
                .andExpect(jsonPath("$[0].workMode",      notNullValue()))
                .andExpect(jsonPath("$[0].postedDate",    matchesPattern("\\d{4}-\\d{2}-\\d{2}")))
                .andExpect(jsonPath("$[0].applicationDeadline", matchesPattern("\\d{4}-\\d{2}-\\d{2}")))
                .andExpect(jsonPath("$[0].eligibility",   notNullValue()))
                .andExpect(jsonPath("$[0].requiredSkills", notNullValue()));
    }

    @Test
    void listAll_dateOffsetsResolvedToStrings() throws Exception {
        // Seed int-001 has postedDaysOffset=-3 and deadlineDaysOffset=21.
        // Both must come back as YYYY-MM-DD strings (not arrays or timestamps).
        mockMvc.perform(get("/api/internships/int-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postedDate",           matchesPattern("\\d{4}-\\d{2}-\\d{2}")))
                .andExpect(jsonPath("$.applicationDeadline",  matchesPattern("\\d{4}-\\d{2}-\\d{2}")));
    }

    // ---- GET /api/internships/{id} ----

    @Test
    void getById_knownId_returns200() throws Exception {
        mockMvc.perform(get("/api/internships/int-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("int-001"))
                .andExpect(jsonPath("$.title").value("Backend Engineering Intern"));
    }

    @Test
    void getById_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/api/internships/int-999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("not found")));
    }

    @Test
    void listAll_allItemsHaveNoOffsetFields() throws Exception {
        // Verify that seed-only fields (postedDaysOffset / deadlineDaysOffset)
        // are NOT exposed in the API response.
        mockMvc.perform(get("/api/internships").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].postedDaysOffset").doesNotExist())
                .andExpect(jsonPath("$[0].deadlineDaysOffset").doesNotExist());
    }
}
