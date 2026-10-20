package com.pathfinder.backend.exception;

/**
 * Thrown when a request body contains a semantically invalid value
 * that passed Jakarta Bean Validation but fails business rules
 * (e.g. unknown status code).
 * Maps to HTTP 422 via {@link GlobalExceptionHandler}.
 */
public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}
