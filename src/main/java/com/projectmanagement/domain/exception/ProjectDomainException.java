package com.projectmanagement.domain.exception;

/**
 * Thrown when a project operation violates business rules.
 */
public class ProjectDomainException extends RuntimeException {

    public ProjectDomainException(String message) {
        super(message);
    }

    public ProjectDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
