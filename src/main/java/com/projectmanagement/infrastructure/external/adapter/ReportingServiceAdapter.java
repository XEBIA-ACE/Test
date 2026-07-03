package com.projectmanagement.infrastructure.external.adapter;

import com.projectmanagement.domain.port.out.ReportingServicePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Stub adapter for the external Reporting service.
 * Replace the stub implementation with a real HTTP client when the
 * Reporting service contract is available.
 */
@Component
public class ReportingServiceAdapter implements ReportingServicePort {

    private static final Logger log = LoggerFactory.getLogger(ReportingServiceAdapter.class);

    @Value("${external.reporting.base-url:http://localhost:8082}")
    private String reportingBaseUrl;

    @Override
    public void notifyProjectCreated(UUID projectId) {
        // TODO: replace with real HTTP call to reportingBaseUrl
        log.info("[STUB] Notifying reporting service: project created '{}'", projectId);
    }

    @Override
    public void notifyProjectStatusChanged(UUID projectId, String newStatus) {
        // TODO: replace with real HTTP call to reportingBaseUrl
        log.info("[STUB] Notifying reporting service: project '{}' status → '{}'",
                projectId, newStatus);
    }
}
