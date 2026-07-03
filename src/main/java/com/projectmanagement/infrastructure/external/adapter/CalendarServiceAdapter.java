package com.projectmanagement.infrastructure.external.adapter;

import com.projectmanagement.domain.port.out.CalendarServicePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Stub adapter for the external Calendar service.
 * Replace the stub implementation with a real HTTP client when the
 * Calendar service contract is available.
 */
@Component
public class CalendarServiceAdapter implements CalendarServicePort {

    private static final Logger log = LoggerFactory.getLogger(CalendarServiceAdapter.class);

    @Value("${external.calendar.base-url:http://localhost:8081}")
    private String calendarBaseUrl;

    @Override
    public String createProjectEvent(
            UUID projectId,
            String projectName,
            LocalDate startDate,
            LocalDate endDate) {

        // TODO: replace with real HTTP call to calendarBaseUrl
        log.info("[STUB] Creating calendar event for project '{}' ({} → {})",
                projectName, startDate, endDate);
        return "stub-event-" + projectId;
    }

    @Override
    public void deleteProjectEvent(String externalEventId) {
        // TODO: replace with real HTTP call to calendarBaseUrl
        log.info("[STUB] Deleting calendar event '{}'", externalEventId);
    }
}
