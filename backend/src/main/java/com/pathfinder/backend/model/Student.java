package com.pathfinder.backend.model;

import java.util.List;

/**
 * Student profile.
 *
 * Matches the frontend shape documented in mockStudents.js:
 * {
 *   id, fullName, email, college, degree, graduationYear, cgpa,
 *   skills: string[], preferredRoles: string[], preferredLocations: string[],
 *   workModePreference: 'ANY' | 'REMOTE' | 'HYBRID' | 'ONSITE',
 *   resumeFileName: string,
 *   updatedAt: 'YYYY-MM-DD'
 * }
 */
public record Student(
        String id,
        String fullName,
        String email,
        String college,
        String degree,
        int graduationYear,
        double cgpa,
        List<String> skills,
        List<String> preferredRoles,
        List<String> preferredLocations,
        String workModePreference,
        String resumeFileName,
        String updatedAt
) {}
