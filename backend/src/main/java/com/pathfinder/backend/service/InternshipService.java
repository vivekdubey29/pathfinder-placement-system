package com.pathfinder.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pathfinder.backend.exception.ResourceNotFoundException;
import com.pathfinder.backend.model.Internship;
import com.pathfinder.backend.model.InternshipSeed;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Loads the internship seed data from the classpath at startup, resolves the
 * relative-day offsets to real {@code LocalDate} values, and serves them via
 * simple lookup methods.
 *
 * <p>Data is held in a {@code Map<String, Internship>} keyed by internship ID
 * so that individual look-ups are O(1). The ordered list is pre-built once.
 */
@Service
public class InternshipService {

    private final ObjectMapper objectMapper;

    // Populated at startup via @PostConstruct — never mutated afterwards.
    private List<Internship> internshipList = Collections.emptyList();
    private Map<String, Internship> internshipById = Collections.emptyMap();

    public InternshipService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void loadSeedData() throws IOException {
        ClassPathResource resource = new ClassPathResource("data/internships.json");
        try (InputStream stream = resource.getInputStream()) {
            List<InternshipSeed> seeds = objectMapper.readValue(
                    stream, new TypeReference<List<InternshipSeed>>() {});

            LocalDate today = LocalDate.now();

            // Convert each seed to a resolved Internship.
            // HashMap stores all 24 IDs; insertion order is preserved by
            // Collectors.toUnmodifiableMap with LinkedHashMap (via groupingBy).
            // For this size, a simple ArrayList + HashMap combo is sufficient.
            internshipList = seeds.stream()
                    .map(seed -> toInternship(seed, today))
                    .collect(Collectors.toUnmodifiableList());

            // HashMap: O(1) look-up by ID. Used by getById().
            internshipById = internshipList.stream()
                    .collect(Collectors.toUnmodifiableMap(Internship::id, Function.identity()));
        }
    }

    /** Returns all 24 internship listings in seed order. */
    public List<Internship> findAll() {
        return internshipList;
    }

    /** Returns a single internship or throws 404. */
    public Internship findById(String id) {
        Internship internship = internshipById.get(id);
        if (internship == null) {
            throw new ResourceNotFoundException("Internship \"" + id + "\" was not found.");
        }
        return internship;
    }

    // ---- private helpers ----

    private Internship toInternship(InternshipSeed seed, LocalDate today) {
        return new Internship(
                seed.id(),
                seed.title(),
                seed.roleCategory(),
                seed.company(),
                seed.location(),
                seed.workMode(),
                seed.stipendMonthly(),
                seed.durationMonths(),
                today.plusDays(seed.postedDaysOffset()),
                today.plusDays(seed.deadlineDaysOffset()),
                seed.description(),
                seed.responsibilities(),
                seed.requiredSkills(),
                seed.preferredSkills(),
                seed.eligibility()
        );
    }
}
