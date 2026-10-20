package com.pathfinder.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Converts exceptions into structured JSON error responses.
 *
 * The frontend's apiClient.js reads:
 *   payload.message  — displayed to the user
 *   payload.errors   — field-level error map (optional), placed in ApiError.details
 *
 * So every error response has at minimum { "message": "..." }.
 * Validation responses additionally carry { "errors": { "fieldName": "message" } }.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ---- 404 ----

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return errorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    // ---- 409 ----

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(ConflictException ex) {
        return errorResponse(HttpStatus.CONFLICT, ex.getMessage(), null);
    }

    // ---- 422 (business-rule validation) ----

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidationException ex) {
        return errorResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), null);
    }

    // ---- 422 (Jakarta Bean Validation — @Valid on request body) ----

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleBeanValidation(MethodArgumentNotValidException ex) {
        // Collect one message per field; preserve insertion order for readability.
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        return errorResponse(HttpStatus.UNPROCESSABLE_ENTITY, "Profile validation failed.", fieldErrors);
    }

    // ---- 502 (upstream / external service failure) ----

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<Map<String, Object>> handleExternalService(ExternalServiceException ex) {
        return errorResponse(HttpStatus.BAD_GATEWAY, ex.getMessage(), null);
    }

    // ---- 500 (unexpected) ----

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        // Do NOT expose the stack trace or original message to clients.
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again.", null);
    }

    // ---- helper ----

    private ResponseEntity<Map<String, Object>> errorResponse(
            HttpStatus status, String message, Object errors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        if (errors != null) {
            body.put("errors", errors);
        }
        return ResponseEntity.status(status).body(body);
    }
}
