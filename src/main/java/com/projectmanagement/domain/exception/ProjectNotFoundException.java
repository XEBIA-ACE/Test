package com.projectmanagement.domain.exception;

import java.util.UUID;

/**
 * Thrown when a requested Project cannot be found.
 */
public class ProjectNotFoundException extends RuntimeException {

    public ProjectNotFoundException(UUID id) {
        super("Project not found with id: " + id);
    }

    public ProjectNotFoundException(String message) {
        super(message);
    }
}
