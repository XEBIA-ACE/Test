package org.simpleapp.project;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.junit.Before;
import org.junit.Test;

public class ProjectRepositoryTest {

    private ProjectRepository repository;

    @Before
    public void setUp() {
        repository = new ProjectRepository();
    }

    @Test
    public void ownerIsTreatedAsAuthorizedMember() {
        UUID owner = UUID.randomUUID();
        Project p = newProject("Solo", owner, Instant.parse("2026-02-01T00:00:00Z"));
        repository.save(p, Collections.emptySet());

        assertTrue(repository.isMember(p.getId(), owner));
    }

    @Test
    public void newlySavedProjectIsImmediatelyVisibleToMember() {
        UUID owner = UUID.randomUUID();
        Project p = newProject("Fresh", owner, Instant.parse("2026-03-01T00:00:00Z"));
        repository.save(p, Collections.emptySet());

        List<Project> accessible = repository.findAccessibleByUser(owner);
        assertEquals(1, accessible.size());
        assertEquals("Fresh", accessible.get(0).getName());
    }

    @Test
    public void listingIsOrderedByCreatedAtThenId() {
        UUID user = UUID.randomUUID();
        Project later = newProject("Later", user, Instant.parse("2026-05-01T00:00:00Z"));
        Project earlier = newProject("Earlier", user, Instant.parse("2026-04-01T00:00:00Z"));
        repository.save(later, Collections.emptySet());
        repository.save(earlier, Collections.emptySet());

        List<Project> accessible = repository.findAccessibleByUser(user);
        assertEquals("Earlier", accessible.get(0).getName());
        assertEquals("Later", accessible.get(1).getName());
    }

    @Test
    public void unrelatedUserSeesNoProjects() {
        assertTrue(repository.findAccessibleByUser(UUID.randomUUID()).isEmpty());
    }

    @Test
    public void nonMemberIsNotAuthorized() {
        UUID owner = UUID.randomUUID();
        Project p = newProject("Private", owner, Instant.parse("2026-06-01T00:00:00Z"));
        repository.save(p, Collections.emptySet());

        assertFalse(repository.isMember(p.getId(), UUID.randomUUID()));
    }

    private Project newProject(String name, UUID owner, Instant createdAt) {
        return new Project(UUID.randomUUID(), name, "desc", "internal", owner, createdAt, createdAt);
    }
}
