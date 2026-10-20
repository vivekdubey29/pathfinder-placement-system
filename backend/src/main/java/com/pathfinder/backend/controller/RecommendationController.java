package com.pathfinder.backend.controller;

import com.pathfinder.backend.service.InternshipService;
import com.pathfinder.backend.service.RecommendationService;
import com.pathfinder.backend.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Phase 4 — Recommendations API.
 *
 * GET /api/recommendations/{studentId}?limit=N
 *   → { studentId, engine: EngineInfo, recommendations: Recommendation[] }
 *
 * The {@code limit} query parameter is optional; omitting it returns all 24.
 */
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final StudentService        studentService;
    private final InternshipService     internshipService;

    public RecommendationController(RecommendationService recommendationService,
                                    StudentService studentService,
                                    InternshipService internshipService) {
        this.recommendationService = recommendationService;
        this.studentService        = studentService;
        this.internshipService     = internshipService;
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<RecommendationService.RecommendationResponse> getRecommendations(
            @PathVariable String studentId,
            @RequestParam(name = "limit", required = false, defaultValue = "0") int limit) {

        var student     = studentService.findById(studentId);      // 404 if unknown
        var internships = internshipService.findAll();

        var result = recommendationService.generate(student, internships, limit);
        return ResponseEntity.ok(result);
    }
}
