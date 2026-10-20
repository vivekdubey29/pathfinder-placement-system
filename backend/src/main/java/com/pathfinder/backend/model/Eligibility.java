package com.pathfinder.backend.model;

import java.util.List;

/**
 * Eligibility criteria embedded inside an Internship.
 * Matches the frontend shape: { minCgpa, degrees, graduationYears }
 */
public record Eligibility(
        double minCgpa,
        List<String> degrees,
        List<Integer> graduationYears
) {}
