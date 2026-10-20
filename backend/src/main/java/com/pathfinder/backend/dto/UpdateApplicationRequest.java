package com.pathfinder.backend.dto;

/**
 * Request body for PUT /api/applications/{id}.
 * Both fields are optional — only non-null values are applied.
 */
public record UpdateApplicationRequest(
        String status,  // nullable — only update if present
        String notes    // nullable — only update if present
) {}
