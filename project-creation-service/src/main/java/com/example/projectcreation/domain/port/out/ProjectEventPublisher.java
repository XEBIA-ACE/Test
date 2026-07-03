package com.example.projectcreation.domain.port.out;

import com.example.projectcreation.domain.model.Project;

/**
 * Outbound port — event publishing contract.
 * Implemented by the infrastructure layer (e.g. Kafka, SQS, in-memory).
 */
public interface ProjectEventPublisher {

    /**
     * Publishes a "project created" event so downstream consumers can react.
     *
     * @param project the newly created project
     */
    void publishProjectCreated(Project project);
}
