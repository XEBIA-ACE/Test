package com.projectmanagement.domain.port.out;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Output port — defines how the domain interacts with an external Calendar service.
 */
public interface CalendarServicePort {

    /**
     * Creates a calendar event for the project timeline.
     *
     * @param projectId the project identifier
     * @param projectName the project name
     * @param startDate project start date
     * @param endDate project end date
     * @return external calendar event ID
     */
    String createProjectEvent(UUID projectId, String projectName, LocalDate startDate, LocalDate endDate);

    /**
     * Deletes the calendar event associated with the project.
     *
     * @param externalEventId the external calendar event ID
     */
    void deleteProjectEvent(String externalEventId);
}
