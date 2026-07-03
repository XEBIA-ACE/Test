package com.projectmanagement.domain.port.out;

import java.util.UUID;

/**
 * Output port — defines how the domain interacts with an external Reporting service.
 */
public interface ReportingServicePort {

    /**
     * Notifies the reporting service that a project has been created.
     *
     * @param projectId the project identifier
     */
    void notifyProjectCreated(UUID projectId);

    /**
     * Notifies the reporting service that a project status has changed.
     *
     * @param projectId the project identifier
     * @param newStatus the new status value
     */
    void notifyProjectStatusChanged(UUID projectId, String newStatus);
}
