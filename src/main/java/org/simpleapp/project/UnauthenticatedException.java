package org.simpleapp.project;

/** Raised when a request carries no valid identity (US-003 FR-009, maps to HTTP 401). */
public class UnauthenticatedException extends RuntimeException {

    public UnauthenticatedException(String message) {
        super(message);
    }
}
