package com.example.projectcreation.domain.exception;

/**
 * Thrown when project data fails domain validation.
 */
public class ProjectValidationException extends RuntimeException {

    public ProjectValidationException(String message) {
        super(message);
    }
}
