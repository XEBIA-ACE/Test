package org.simpleapp.project;

/** Raised when a user is not authorized to access a project (US-003 FR-006, maps to HTTP 403). */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }
}
