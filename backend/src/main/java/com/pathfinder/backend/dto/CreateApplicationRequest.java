package com.pathfinder.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/applications.
 */
public record CreateApplicationRequest(
        @NotBlank(message = "studentId is required.")
        String studentId,

        @NotBlank(message = "internshipId is required.")
        String internshipId,

        String status,   // defaults to SAVED if null/blank
        String notes
) {}
