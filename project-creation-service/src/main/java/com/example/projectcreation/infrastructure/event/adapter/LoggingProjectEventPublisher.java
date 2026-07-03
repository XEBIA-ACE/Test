package com.example.projectcreation.infrastructure.event.adapter;

import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.port.out.ProjectEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Event publishing adapter — logs the event to stdout.
 *
 * TODO: Replace with a real message broker (Kafka, RabbitMQ, SQS, etc.)
 *       by implementing {@link ProjectEventPublisher} and swapping this bean.
 */
@Component
public class LoggingProjectEventPublisher implements ProjectEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingProjectEventPublisher.class);

    @Override
    public void publishProjectCreated(Project project) {
        log.info("EVENT project.created — id={} name={} status={}",
                project.getId(), project.getName(), project.getStatus());
    }
}
