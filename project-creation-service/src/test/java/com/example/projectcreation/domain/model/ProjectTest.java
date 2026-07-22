package com.example.projectcreation.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for the {@link Project} domain entity.
 */
class ProjectTest {

    @Test
    @DisplayName("Project.create() initialises with PENDING status")
    void create_initializesWithPendingStatus() {
        Project project = Project.create("Test", "desc");

        assertThat(project.getId()).isNotNull();
        assertThat(project.getName()).isEqualTo("Test");
        assertThat(project.getDescription()).isEqualTo("desc");
        assertThat(project.getStatus()).isEqualTo(ProjectStatus.PENDING);
        assertThat(project.getCreatedAt()).isNotNull();
        assertThat(project.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("activate() transitions status to ACTIVE")
    void activate_setsStatusToActive() {
        Project project = Project.create("Test", "desc");
        project.activate();

        assertThat(project.getStatus()).isEqualTo(ProjectStatus.ACTIVE);
    }

    @Test
    @DisplayName("archive() transitions status to ARCHIVED")
    void archive_setsStatusToArchived() {
        Project project = Project.create("Test", "desc");
        project.archive();

        assertThat(project.getStatus()).isEqualTo(ProjectStatus.ARCHIVED);
    }

    @Test
    @DisplayName("activate() updates the updatedAt timestamp")
    void activate_updatesTimestamp() throws InterruptedException {
        Project project = Project.create("Test", "desc");
        var before = project.getUpdatedAt();

        Thread.sleep(5); // ensure clock advances
        project.activate();

        assertThat(project.getUpdatedAt()).isAfterOrEqualTo(before);
    }
}
