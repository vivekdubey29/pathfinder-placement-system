package com.pathfinder.backend.model;

import java.util.List;

/**
 * Represents a Company embedded inside an Internship.
 * Matches the frontend shape: { id, name, industry, size, headquarters, about }
 */
public record Company(
        String id,
        String name,
        String industry,
        String size,
        String headquarters,
        String about
) {}
