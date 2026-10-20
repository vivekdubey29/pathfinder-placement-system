package com.pathfinder.backend.controller;

import com.pathfinder.backend.model.ExternalInternship;
import com.pathfinder.backend.service.HimalayasService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes external internship / job listings sourced from the Himalayas Remote Jobs API.
 *
 * <p>This endpoint is intentionally separate from {@code /api/internships} to make it
 * clear to consumers that these are live external records, not PathFinder seed data.
 *
 * <p>Caching is handled by {@link HimalayasService} — the controller itself is stateless.
 *
 * <p>Error behaviour:
 * <ul>
 *   <li>If the upstream Himalayas API is unreachable or returns an error, the service
 *       throws {@link com.pathfinder.backend.exception.ExternalServiceException}, which
 *       {@link com.pathfinder.backend.exception.GlobalExceptionHandler} converts to
 *       HTTP 502 with a descriptive JSON body.</li>
 *   <li>There is NO silent fallback to fictional records.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/external-internships")
public class ExternalInternshipController {

    private final HimalayasService himalayasService;

    public ExternalInternshipController(HimalayasService himalayasService) {
        this.himalayasService = himalayasService;
    }

    /**
     * GET /api/external-internships
     *
     * @return 200 with an array of live Himalayas listings, or 502 if the upstream
     *         service is unavailable.
     */
    @GetMapping
    public ResponseEntity<List<ExternalInternship>> list() {
        return ResponseEntity.ok(himalayasService.fetchInternships());
    }
}
