package com.pathfinder.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    public record HealthResponse(
            String status,
            String service,
            String message
    ) {}

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(
                "UP",
                "pathfinder-backend",
                "PathFinder backend is running."
        );
    }
}