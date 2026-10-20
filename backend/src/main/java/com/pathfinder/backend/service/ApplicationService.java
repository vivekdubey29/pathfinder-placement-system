package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.CreateApplicationRequest;
import com.pathfinder.backend.dto.UpdateApplicationRequest;
import com.pathfinder.backend.exception.ConflictException;
import com.pathfinder.backend.exception.ResourceNotFoundException;
import com.pathfinder.backend.exception.ValidationException;
import com.pathfinder.backend.model.ApplicationRecord;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * In-memory application tracker store.
 *
 * <p>Uses a {@code ConcurrentHashMap} (thread-safe, O(1) get/put) for the
 * primary store.  A stable sorted list is produced on every read — acceptable
 * for 24 internships × 8 initial records.
 *
 * <p>Seeded with the same 8 records as the frontend's mockApplications.js,
 * using today-relative date offsets that mirror {@code isoDateFromToday(n)}.
 *
 * <p><b>Limitation:</b> all data is lost on backend restart.
 *
 * Valid statuses: SAVED, APPLIED, INTERVIEW, OFFERED, REJECTED.
 */
@Service
public class ApplicationService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "SAVED", "APPLIED", "INTERVIEW", "OFFERED", "REJECTED");

    // ConcurrentHashMap: thread-safe, O(1) get/put for in-memory store.
    private final ConcurrentHashMap<String, ApplicationRecord> store = new ConcurrentHashMap<>();

    // AtomicLong ensures unique monotonic counter even under concurrent writes.
    private final AtomicLong idCounter = new AtomicLong(9);

    @PostConstruct
    void seedInitialRecords() {
        LocalDate today = LocalDate.now();
        // Mirror mockApplications.js seed data.
        add(new ApplicationRecord("app-0001", "stu-001", "int-001", "APPLIED",
                d(today, -2), d(today, -2), d(today, -2),
                "Applied through the company careers page."));
        add(new ApplicationRecord("app-0002", "stu-001", "int-002", "REJECTED",
                d(today, -19), d(today, -19), d(today, -5),
                "Rejected after the screening round."));
        add(new ApplicationRecord("app-0003", "stu-001", "int-008", "OFFERED",
                d(today, -22), d(today, -22), d(today, -8),
                "Offer received. Reply needed within a week."));
        add(new ApplicationRecord("app-0004", "stu-001", "int-013", "INTERVIEW",
                d(today, -26), d(today, -26), d(today, -9),
                "Technical interview scheduled. Revise React and Node.js basics."));
        add(new ApplicationRecord("app-0005", "stu-001", "int-019", "APPLIED",
                d(today, -4), d(today, -4), d(today, -4), ""));
        add(new ApplicationRecord("app-0006", "stu-001", "int-011", "SAVED",
                d(today, -1), null, d(today, -1),
                "Strong match. Prepare system design basics before applying."));
        add(new ApplicationRecord("app-0007", "stu-001", "int-023", "SAVED",
                d(today, -3), null, d(today, -3), ""));
        add(new ApplicationRecord("app-0008", "stu-001", "int-006", "SAVED",
                d(today, 0), null, d(today, 0), ""));
    }

    // ---- helpers ----

    private void add(ApplicationRecord record) {
        store.put(record.id(), record);
    }

    private static String d(LocalDate base, int offsetDays) {
        return base.plusDays(offsetDays).toString();
    }

    // ---- public API ----

    /** Returns all records for a student, sorted newest-update first (stable by id). */
    public List<ApplicationRecord> findByStudentId(String studentId) {
        return store.values().stream()
                .filter(r -> studentId.equals(r.studentId()))
                .sorted(Comparator
                        .comparing(ApplicationRecord::updatedAt).reversed()
                        .thenComparing(ApplicationRecord::id))
                .collect(Collectors.toUnmodifiableList());
    }

    /**
     * Creates a new application record.
     *
     * @param req                the request body
     * @param internshipService  used to verify the internship exists
     * @throws ResourceNotFoundException if the internship is unknown
     * @throws ConflictException         if the student already tracks this internship
     * @throws ValidationException       if status is invalid
     */
    public ApplicationRecord create(CreateApplicationRequest req,
                                    InternshipService internshipService) {
        // Verify internship exists (throws 404 if not).
        internshipService.findById(req.internshipId());

        String status = (req.status() == null || req.status().isBlank()) ? "SAVED" : req.status();
        requireValidStatus(status);

        // Duplicate check: same student + same internship.
        boolean duplicate = store.values().stream()
                .anyMatch(r -> r.studentId().equals(req.studentId())
                        && r.internshipId().equals(req.internshipId()));
        if (duplicate) {
            throw new ConflictException("This internship is already in your tracker.");
        }

        String today = LocalDate.now().toString();
        String newId = generateId();

        ApplicationRecord record = new ApplicationRecord(
                newId,
                req.studentId(),
                req.internshipId(),
                status,
                today,
                "SAVED".equals(status) ? null : today,
                today,
                req.notes() != null ? req.notes() : ""
        );

        store.put(newId, record);
        return record;
    }

    /**
     * Updates status and/or notes on an existing record.
     *
     * <ul>
     *   <li>Moving back to SAVED clears {@code appliedAt}.</li>
     *   <li>Moving from SAVED to another status sets {@code appliedAt} to today
     *       if it was previously {@code null}.</li>
     * </ul>
     */
    public ApplicationRecord update(String applicationId, UpdateApplicationRequest req) {
        ApplicationRecord current = store.get(applicationId);
        if (current == null) {
            throw new ResourceNotFoundException(
                    "Application \"" + applicationId + "\" was not found.");
        }

        String status = current.status();
        String appliedAt = current.appliedAt();
        String notes = current.notes();
        String today = LocalDate.now().toString();

        if (req.status() != null) {
            requireValidStatus(req.status());
            status = req.status();
            if ("SAVED".equals(status)) {
                appliedAt = null;
            } else {
                appliedAt = current.appliedAt() != null ? current.appliedAt() : today;
            }
        }
        if (req.notes() != null) {
            notes = req.notes();
        }

        ApplicationRecord updated = new ApplicationRecord(
                current.id(),
                current.studentId(),
                current.internshipId(),
                status,
                current.trackedAt(),
                appliedAt,
                today,
                notes
        );

        store.put(applicationId, updated);
        return updated;
    }

    /**
     * Deletes a record.
     *
     * @throws ResourceNotFoundException if the record does not exist
     */
    public void delete(String applicationId) {
        if (!store.containsKey(applicationId)) {
            throw new ResourceNotFoundException(
                    "Application \"" + applicationId + "\" was not found.");
        }
        store.remove(applicationId);
    }

    private void requireValidStatus(String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new ValidationException(
                    "\"" + status + "\" is not a valid application status.");
        }
    }

    /**
     * Generates a short unique ID.
     *
     * <p>{@link AtomicLong} gives a monotonically increasing numeric segment so
     * IDs never collide within a session; the hex random suffix reduces the
     * (already tiny) chance of a clash after a restart if old data is imported.
     */
    private String generateId() {
        long counter = idCounter.getAndIncrement();
        String random = Long.toHexString(Double.doubleToLongBits(Math.random())).substring(0, 4);
        return "app-" + Long.toString(counter, 36) + random;
    }
}
