package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.ProfileUpdateRequest;
import com.pathfinder.backend.model.Student;
import com.pathfinder.backend.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Phase 2 — Student Profile API.
 *
 * GET /api/students/{id}  → Student
 * PUT /api/students/{id}  (body: ProfileUpdateRequest) → Student (saved)
 */
@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getProfile(@PathVariable String id) {
        return ResponseEntity.ok(studentService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateProfile(
            @PathVariable String id,
            @Valid @RequestBody ProfileUpdateRequest request) {
        // Bean Validation errors → 422 via GlobalExceptionHandler.
        // Business-rule validation is inside StudentService.update().
        return ResponseEntity.ok(studentService.update(id, request));
    }
}
