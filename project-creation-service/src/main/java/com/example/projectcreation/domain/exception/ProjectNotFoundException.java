package com.example.projectcreation.domain.exception;

/**
 * Thrown when a requested project cannot be found.
 */
public class ProjectNotFoundException extends RuntimeException {

    public ProjectNotFoundException(String message) {
        super(message);
    }
}
