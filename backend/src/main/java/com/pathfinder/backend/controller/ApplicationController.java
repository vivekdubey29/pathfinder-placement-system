package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.CreateApplicationRequest;
import com.pathfinder.backend.dto.UpdateApplicationRequest;
import com.pathfinder.backend.model.ApplicationRecord;
import com.pathfinder.backend.service.ApplicationService;
import com.pathfinder.backend.service.InternshipService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Phase 3 — Application Tracker API.
 *
 * GET    /api/applications/{studentId}       → ApplicationRecord[]
 * POST   /api/applications                   → ApplicationRecord  (201)
 * PUT    /api/applications/{applicationId}   → ApplicationRecord
 * DELETE /api/applications/{applicationId}   → 204 No Content
 */
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final InternshipService  internshipService;

    public ApplicationController(ApplicationService applicationService,
                                 InternshipService internshipService) {
        this.applicationService = applicationService;
        this.internshipService  = internshipService;
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<List<ApplicationRecord>> listByStudent(
            @PathVariable String studentId) {
        return ResponseEntity.ok(applicationService.findByStudentId(studentId));
    }

    @PostMapping
    public ResponseEntity<ApplicationRecord> create(
            @Valid @RequestBody CreateApplicationRequest request) {
        ApplicationRecord created = applicationService.create(request, internshipService);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{applicationId}")
    public ResponseEntity<ApplicationRecord> update(
            @PathVariable String applicationId,
            @RequestBody UpdateApplicationRequest request) {
        return ResponseEntity.ok(applicationService.update(applicationId, request));
    }

    @DeleteMapping("/{applicationId}")
    public ResponseEntity<Void> delete(@PathVariable String applicationId) {
        applicationService.delete(applicationId);
        return ResponseEntity.noContent().build();
    }
}
