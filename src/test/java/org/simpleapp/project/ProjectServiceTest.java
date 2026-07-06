package org.simpleapp.project;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class ProjectServiceTest {

    @Mock
    private ProjectRepository repository;

    private ProjectService service;

    private final UUID caller = UUID.randomUUID();
    private final UUID otherUser = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        service = new ProjectService(repository);
    }

    private Project project(UUID id, String name, UUID owner) {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        return new Project(id, name, "desc", "internal", owner, now, now);
    }

    @Test
    public void listReturnsSummariesWithNameAndOwner() {
        Project p = project(projectId, "Apollo", caller);
        when(repository.findAccessibleByUser(caller)).thenReturn(Arrays.asList(p));

        List<ProjectSummary> result = service.listAccessibleProjects(caller);

        assertEquals(1, result.size());
        assertEquals("Apollo", result.get(0).getName());
        assertEquals(caller, result.get(0).getOwnerId());
    }

    @Test
    public void listReturnsEmptyWhenNoAccessibleProjects() {
        when(repository.findAccessibleByUser(caller)).thenReturn(Collections.emptyList());

        List<ProjectSummary> result = service.listAccessibleProjects(caller);

        assertTrue(result.isEmpty());
    }

    @Test
    public void getProjectReturnsDetailForAuthorizedUser() {
        Project p = project(projectId, "Apollo", caller);
        when(repository.findById(projectId)).thenReturn(Optional.of(p));
        when(repository.isMember(projectId, caller)).thenReturn(true);

        Project result = service.getProject(caller, projectId);

        assertEquals("Apollo", result.getName());
        assertEquals("desc", result.getDescription());
        assertEquals("internal", result.getType());
    }

    @Test(expected = ProjectNotFoundException.class)
    public void getProjectThrowsNotFoundWhenMissingRegardlessOfAuthorization() {
        when(repository.findById(projectId)).thenReturn(Optional.empty());

        service.getProject(caller, projectId);
    }

    @Test(expected = AccessDeniedException.class)
    public void getProjectThrowsAccessDeniedForUnauthorizedUser() {
        Project p = project(projectId, "Apollo", otherUser);
        when(repository.findById(projectId)).thenReturn(Optional.of(p));
        when(repository.isMember(projectId, caller)).thenReturn(false);

        service.getProject(caller, projectId);
    }
}
