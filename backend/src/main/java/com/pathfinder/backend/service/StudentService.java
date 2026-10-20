package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.ProfileUpdateRequest;
import com.pathfinder.backend.exception.ResourceNotFoundException;
import com.pathfinder.backend.exception.ValidationException;
import com.pathfinder.backend.model.Student;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory student profile store.
 *
 * <p>Seeded with the same demo student as the frontend (id: "stu-001").
 * A {@code ConcurrentHashMap} is used for thread safety even though the
 * application has no concurrent writes in practice; it avoids surprising
 * race conditions if Spring Boot's embedded Tomcat uses multiple threads.
 *
 * <p>Limitation: data is lost on backend restart. This matches the spec
 * ("in-memory implementation initially").
 *
 * Valid degree values mirror frontend's DEGREE_OPTIONS constant.
 * Valid workModePreference values mirror WORK_MODE_PREFERENCES constant.
 */
@Service
public class StudentService {

    public static final String DEMO_STUDENT_ID = "stu-001";

    private static final List<String> VALID_DEGREES = List.of(
            "B.Tech", "B.E.", "BCA", "B.Sc", "B.Des", "M.Tech", "MCA", "M.Sc");

    private static final List<String> VALID_WORK_MODE_PREFS = List.of(
            "ANY", "REMOTE", "HYBRID", "ONSITE");

    // ConcurrentHashMap: thread-safe in-memory store.
    // Key = studentId, Value = mutable student snapshot.
    private final ConcurrentHashMap<String, Student> store = new ConcurrentHashMap<>();

    @PostConstruct
    void seedDemoStudent() {
        store.put(DEMO_STUDENT_ID, new Student(
                DEMO_STUDENT_ID,
                "Aarav Mehta",
                "aarav.mehta@example.com",
                "Northfield Institute of Technology",
                "B.Tech",
                2027,
                8.2,
                List.of("Java", "Data Structures", "Algorithms", "SQL", "Python",
                        "JavaScript", "React", "HTML", "CSS", "Git",
                        "Object-Oriented Programming"),
                List.of("Backend Development", "Full Stack Development", "Frontend Development"),
                List.of("Bengaluru", "Hyderabad", "Pune"),
                "HYBRID",
                "",
                "2026-10-01"
        ));
    }

    /** Returns the student profile or throws 404. */
    public Student findById(String studentId) {
        Student student = store.get(studentId);
        if (student == null) {
            throw new ResourceNotFoundException("Student \"" + studentId + "\" was not found.");
        }
        return student;
    }

    /**
     * Validates and applies a profile update.
     *
     * <p>Bean Validation on {@link ProfileUpdateRequest} covers basic field
     * constraints. This method handles additional business rules (degree enum,
     * workModePreference enum, locations required unless REMOTE).
     *
     * @return the saved student (with updated {@code updatedAt})
     */
    public Student update(String studentId, ProfileUpdateRequest req) {
        Student current = findById(studentId);   // throws 404 if not found

        // Business-rule validation not coverable by annotations alone.
        if (!VALID_DEGREES.contains(req.degree())) {
            throw new ValidationException("Select your degree.");
        }
        if (!VALID_WORK_MODE_PREFS.contains(req.workModePreference())) {
            throw new ValidationException("Choose a work mode preference.");
        }
        List<String> locations = req.preferredLocations() != null ? req.preferredLocations() : List.of();
        if (locations.isEmpty() && !"REMOTE".equals(req.workModePreference())) {
            throw new ValidationException(
                    "Select at least one preferred location, or set work mode to Remote.");
        }

        String today = LocalDate.now().toString();

        Student saved = new Student(
                studentId,
                req.fullName().trim(),
                req.email().trim().toLowerCase(),
                req.college().trim(),
                req.degree(),
                req.graduationYear(),
                Math.round(req.cgpa() * 100.0) / 100.0,
                deduplicateSkills(req.skills()),
                deduplicate(req.preferredRoles()),
                deduplicate(locations),
                req.workModePreference(),
                req.resumeFileName() != null ? req.resumeFileName().trim() : "",
                today
        );

        store.put(studentId, saved);
        return saved;
    }

    /** Deduplicates skills preserving first occurrence (case-insensitive). */
    private List<String> deduplicateSkills(List<String> skills) {
        java.util.LinkedHashSet<String> seen = new java.util.LinkedHashSet<>();
        List<String> result = new ArrayList<>();
        for (String skill : skills) {
            String key = skill.trim().toLowerCase();
            if (seen.add(key)) {
                result.add(skill.trim());
            }
        }
        return List.copyOf(result);
    }

    /** Deduplicates strings preserving first occurrence (case-insensitive). */
    private List<String> deduplicate(List<String> items) {
        java.util.LinkedHashSet<String> seen = new java.util.LinkedHashSet<>();
        List<String> result = new ArrayList<>();
        for (String item : items) {
            String key = item.trim().toLowerCase();
            if (seen.add(key)) {
                result.add(item.trim());
            }
        }
        return List.copyOf(result);
    }
}
