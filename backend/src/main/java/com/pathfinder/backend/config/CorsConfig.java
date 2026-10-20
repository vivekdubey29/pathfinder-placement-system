package com.pathfinder.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        // Local development
                        "http://localhost:5173",
                        "http://localhost:5174",
                        // Production frontend on Render
                        "https://pathfinder-frontend-g6y9.onrender.com"
                )
                .allowedMethods(
                        "GET", "POST", "PUT", "DELETE", "OPTIONS"
                )
                .allowedHeaders("Content-Type", "Accept");
    }
}
