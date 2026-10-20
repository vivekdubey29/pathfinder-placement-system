package com.pathfinder.backend.model;

/**
 * Application record (tracker entry).
 *
 * Matches the frontend shape documented in mockApplications.js:
 * {
 *   id, studentId, internshipId,
 *   status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED',
 *   trackedAt: 'YYYY-MM-DD',   — when the record was first created
 *   appliedAt: 'YYYY-MM-DD' | null — null while status is SAVED
 *   updatedAt: 'YYYY-MM-DD',
 *   notes: string
 * }
 */
public record ApplicationRecord(
        String id,
        String studentId,
        String internshipId,
        String status,
        String trackedAt,
        String appliedAt,   // nullable
        String updatedAt,
        String notes
) {}
