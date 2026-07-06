package org.simpleapp.project;

/** Raised when a requested project does not exist (US-003 FR-007, maps to HTTP 404). */
public class ProjectNotFoundException extends RuntimeException {

    public ProjectNotFoundException(String message) {
        super(message);
    }
}
