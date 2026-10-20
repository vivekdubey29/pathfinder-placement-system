package com.pathfinder.backend.exception;

/**
 * Thrown when a duplicate resource is being created.
 * Maps to HTTP 409 via {@link GlobalExceptionHandler}.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
