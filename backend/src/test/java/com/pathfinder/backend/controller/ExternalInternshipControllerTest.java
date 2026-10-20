package com.pathfinder.backend.controller;

import com.pathfinder.backend.exception.ExternalServiceException;
import com.pathfinder.backend.model.ExternalInternship;
import com.pathfinder.backend.service.HimalayasService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Slice tests for {@link ExternalInternshipController}.
 *
 * {@link HimalayasService} is mocked so no real HTTP calls are made during the test run.
 * The existing 31 tests are completely unaffected — this class only adds new cases.
 */
@WebMvcTest(ExternalInternshipController.class)
class ExternalInternshipControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private HimalayasService himalayasService;

    // ---- happy-path --------------------------------------------------------

    @Test
    void listReturns200WithListings() throws Exception {
        ExternalInternship listing = new ExternalInternship(
                "https://himalayas.app/companies/acme/jobs/backend-intern",
                "Backend Engineering Intern",
                "Acme Corp",
                "https://cdn.example.com/logo.png",
                List.of("Worldwide"),
                "Intern",
                30000,
                60000,
                "USD",
                List.of("Software-Engineer-Intern", "Backend-Development"),
                "2026-10-01",
                "https://himalayas.app/companies/acme/jobs/backend-intern?utm_source=api",
                "himalayas"
        );
        when(himalayasService.fetchInternships()).thenReturn(List.of(listing));

        mvc.perform(get("/api/external-internships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Backend Engineering Intern")))
                .andExpect(jsonPath("$[0].companyName", is("Acme Corp")))
                .andExpect(jsonPath("$[0].source", is("himalayas")))
                .andExpect(jsonPath("$[0].salaryMin", is(30000)))
                .andExpect(jsonPath("$[0].salaryMax", is(60000)))
                .andExpect(jsonPath("$[0].salaryCurrency", is("USD")))
                .andExpect(jsonPath("$[0].locations", contains("Worldwide")))
                .andExpect(jsonPath("$[0].applicationLink",
                        containsString("utm_source=api")))
                .andExpect(jsonPath("$[0].postedAt", is("2026-10-01")));
    }

    @Test
    void listReturns200WithEmptyArrayWhenNoResults() throws Exception {
        when(himalayasService.fetchInternships()).thenReturn(List.of());

        mvc.perform(get("/api/external-internships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ---- error propagation -------------------------------------------------

    @Test
    void listReturns502WhenUpstreamIsUnavailable() throws Exception {
        when(himalayasService.fetchInternships())
                .thenThrow(new ExternalServiceException(
                        "Unable to reach the Himalayas job listings service. Please try again later."));

        mvc.perform(get("/api/external-internships"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message",
                        containsString("Himalayas job listings service")));
    }
}
