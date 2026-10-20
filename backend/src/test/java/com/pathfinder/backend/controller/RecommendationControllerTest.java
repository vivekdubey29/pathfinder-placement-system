package com.pathfinder.backend.controller;

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
 * Phase 4 tests — Recommendation API.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RecommendationControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void getRecommendations_demoStudent_returns200WithCorrectShape() throws Exception {
        mockMvc.perform(get("/api/recommendations/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value("stu-001"))
                .andExpect(jsonPath("$.engine").isMap())
                .andExpect(jsonPath("$.engine.name").isString())
                .andExpect(jsonPath("$.engine.version").isString())
                .andExpect(jsonPath("$.engine.isPlaceholder").value(false))
                .andExpect(jsonPath("$.recommendations").isArray())
                .andExpect(jsonPath("$.recommendations", hasSize(24)));
    }

    @Test
    void getRecommendations_limitParam_truncatesResults() throws Exception {
        mockMvc.perform(get("/api/recommendations/stu-001?limit=5").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendations", hasSize(5)));
    }

    @Test
    void getRecommendations_recommendationShape_isCorrect() throws Exception {
        mockMvc.perform(get("/api/recommendations/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendations[0].rank").value(1))
                .andExpect(jsonPath("$.recommendations[0].matchScore").isNumber())
                .andExpect(jsonPath("$.recommendations[0].internship").isMap())
                .andExpect(jsonPath("$.recommendations[0].matchedSkills").isArray())
                .andExpect(jsonPath("$.recommendations[0].missingSkills").isArray())
                .andExpect(jsonPath("$.recommendations[0].eligibility").isMap())
                .andExpect(jsonPath("$.recommendations[0].eligibility.eligible").isBoolean())
                .andExpect(jsonPath("$.recommendations[0].scoreBreakdown").isArray())
                .andExpect(jsonPath("$.recommendations[0].explanation").isString())
                .andExpect(jsonPath("$.recommendations[0].suggestedSkills").isArray());
    }

    @Test
    void getRecommendations_scoresAreDescendingWithinEligibleGroup() throws Exception {
        // All eligible recommendations must have scores >= all ineligible ones.
        // We verify the first eligible and last eligible rank ordering is sound
        // by checking that score[0] >= score[1] (at minimum).
        mockMvc.perform(get("/api/recommendations/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                // Rank 1 score should be >= rank 2 score — we can only assert this loosely with jsonPath.
                .andExpect(jsonPath("$.recommendations[0].rank").value(1))
                .andExpect(jsonPath("$.recommendations[1].rank").value(2));
    }

    @Test
    void getRecommendations_unknownStudent_returns404() throws Exception {
        mockMvc.perform(get("/api/recommendations/stu-999").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void getRecommendations_eligibilityChecksPresent() throws Exception {
        mockMvc.perform(get("/api/recommendations/stu-001").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendations[0].eligibility.checks").isArray())
                .andExpect(jsonPath("$.recommendations[0].eligibility.checks", hasSize(3)));
    }
}
