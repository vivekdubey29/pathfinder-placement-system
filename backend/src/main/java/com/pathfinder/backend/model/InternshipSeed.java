package com.pathfinder.backend.model;

import java.util.List;

/**
 * Raw seed shape as stored in internships.json.
 *
 * {@code postedDaysOffset} and {@code deadlineDaysOffset} are resolved to real
 * dates when the application boots. Jackson deserialises this class; the public
 * service layer always works with {@link Internship} (resolved dates).
 */
public record InternshipSeed(
        String id,
        String title,
        String roleCategory,
        Company company,
        String location,
        String workMode,
        int stipendMonthly,
        int durationMonths,
        String description,
        List<String> responsibilities,
        List<String> requiredSkills,
        List<String> preferredSkills,
        Eligibility eligibility,
        int postedDaysOffset,
        int deadlineDaysOffset
) {}
