package com.pathfinder.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.util.List;

/**
 * Full internship listing.
 *
 * The seed JSON uses {@code postedDaysOffset} and {@code deadlineDaysOffset}
 * (integers relative to today). The {@link InternshipSeed} helper class holds
 * those raw fields; this class holds resolved {@code LocalDate} values that
 * Jackson serialises as "YYYY-MM-DD" strings — the shape the frontend expects.
 */
public record Internship(
        String id,
        String title,
        String roleCategory,
        Company company,
        String location,
        String workMode,
        int stipendMonthly,
        int durationMonths,
        LocalDate postedDate,
        LocalDate applicationDeadline,
        String description,
        List<String> responsibilities,
        List<String> requiredSkills,
        List<String> preferredSkills,
        Eligibility eligibility
) {}
