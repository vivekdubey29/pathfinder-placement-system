package com.pathfinder.backend.exception;

/**
 * Thrown when an upstream third-party service (e.g. Himalayas API) is unavailable
 * or returns an unexpected error.  Mapped to HTTP 502 Bad Gateway by
 * {@link GlobalExceptionHandler}.
 */
public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String message) {
        super(message);
    }

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
