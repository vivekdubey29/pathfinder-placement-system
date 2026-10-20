package com.pathfinder.backend.controller;

import com.pathfinder.backend.model.Internship;
import com.pathfinder.backend.service.InternshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Phase 1 — Internship API.
 *
 * GET /api/internships       → Internship[] (all 24 listings)
 * GET /api/internships/{id}  → Internship   (404 if unknown)
 */
@RestController
@RequestMapping("/api/internships")
public class InternshipController {

    private final InternshipService internshipService;

    public InternshipController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    @GetMapping
    public ResponseEntity<List<Internship>> listAll() {
        return ResponseEntity.ok(internshipService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Internship> getById(@PathVariable String id) {
        // ResourceNotFoundException → 404 via GlobalExceptionHandler.
        return ResponseEntity.ok(internshipService.findById(id));
    }
}
