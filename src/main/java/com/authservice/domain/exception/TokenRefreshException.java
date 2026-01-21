package com.authservice.domain.exception;

/**
 * Exception thrown when refresh token operations fail.
 */
public class TokenRefreshException extends RuntimeException {

    public TokenRefreshException(String message) {
        super(message);
    }

    public TokenRefreshException(String message, Throwable cause) {
        super(message, cause);
    }
}
