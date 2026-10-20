package com.pathfinder.backend.dto;

import jakarta.validation.constraints.*;

import java.util.List;

/**
 * Request body for PUT /api/students/{id}.
 *
 * Validation mirrors the rules in the frontend's validators.js so that
 * server-side rejection messages are equivalent to client-side messages.
 */
public record ProfileUpdateRequest(

        @NotBlank(message = "Enter your full name (at least 2 characters).")
        @Size(min = 2, max = 80, message = "Full name must be between 2 and 80 characters.")
        String fullName,

        @NotBlank(message = "Enter your email address.")
        @Email(message = "Enter a valid email address, for example name@example.com.")
        String email,

        @NotBlank(message = "Enter your college or university name.")
        @Size(min = 2, message = "Enter your college or university name.")
        String college,

        @NotBlank(message = "Select your degree.")
        String degree,

        @NotNull(message = "Enter a graduation year between 2024 and 2032.")
        @Min(value = 2024, message = "Enter a graduation year between 2024 and 2032.")
        @Max(value = 2032, message = "Enter a graduation year between 2024 and 2032.")
        Integer graduationYear,

        @NotNull(message = "Enter your CGPA.")
        @DecimalMin(value = "0.0", message = "CGPA must be a number between 0 and 10.")
        @DecimalMax(value = "10.0", message = "CGPA must be a number between 0 and 10.")
        Double cgpa,

        @NotNull(message = "Add at least one technical skill.")
        @Size(min = 1, max = 30, message = "You can list at most 30 skills.")
        List<String> skills,

        @NotNull(message = "Select at least one preferred role.")
        @Size(min = 1, message = "Select at least one preferred role.")
        List<String> preferredRoles,

        List<String> preferredLocations,

        @NotBlank(message = "Choose a work mode preference.")
        String workModePreference,

        String resumeFileName
) {}
