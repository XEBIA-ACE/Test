package org.simpleapp.service;

import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.simpleapp.dto.ProjectUpdateRequest;
import org.simpleapp.exception.AccessDeniedException;
import org.simpleapp.exception.ValidationException;
import org.simpleapp.model.PermissionLevel;
import org.simpleapp.model.Project;
import org.simpleapp.model.ProjectType;
import org.simpleapp.repository.ProjectPermissionRepository;
import org.simpleapp.repository.ProjectRepository;
import org.simpleapp.repository.UserRepository;

import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class ProjectUpdateServiceTest {

    private ProjectService projectService;
    private ProjectRepository projectRepository;
    private UserRepository userRepository;
    private ProjectPermissionRepository permissionRepository;

    private Project existingProject;

    @Before
    public void setUp() {
        projectRepository = Mockito.mock(ProjectRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        permissionRepository = Mockito.mock(ProjectPermissionRepository.class);
        projectService = new ProjectService(projectRepository, userRepository, permissionRepository);

        existingProject = new Project("proj-001", "Original Name", "Original Desc",
                ProjectType.INTERNAL, "user-001", Instant.now(), Instant.now());
    }

    @Test
    public void saveCalledOnceAfterValidatorsPass() {
        when(projectRepository.findById("proj-001")).thenReturn(Optional.of(existingProject));
        when(permissionRepository.existsByProjectIdAndUserIdAndPermissionLevelIn(
                eq("proj-001"), eq("user-001"),
                eq(Arrays.asList(PermissionLevel.OWNER, PermissionLevel.EDITOR))))
                .thenReturn(true);
        when(userRepository.existsById("user-001")).thenReturn(true);
        when(projectRepository.save(any(Project.class))).thenReturn(existingProject);

        ProjectUpdateRequest request = new ProjectUpdateRequest("New Name", null, "INTERNAL", "user-001");
        projectService.updateProject("proj-001", request, "user-001");

        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    public void saveNeverCalledWhenValidationFails() {
        when(projectRepository.findById("proj-001")).thenReturn(Optional.of(existingProject));
        when(permissionRepository.existsByProjectIdAndUserIdAndPermissionLevelIn(
                eq("proj-001"), eq("user-001"),
                eq(Arrays.asList(PermissionLevel.OWNER, PermissionLevel.EDITOR))))
                .thenReturn(true);

        ProjectUpdateRequest request = new ProjectUpdateRequest("", null, null, null);

        try {
            projectService.updateProject("proj-001", request, "user-001");
        } catch (ValidationException ignored) {
        }

        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    public void updatedAtIsSetToCurrentTimestamp() {
        Instant before = Instant.now();

        when(projectRepository.findById("proj-001")).thenReturn(Optional.of(existingProject));
        when(permissionRepository.existsByProjectIdAndUserIdAndPermissionLevelIn(
                eq("proj-001"), eq("user-001"),
                eq(Arrays.asList(PermissionLevel.OWNER, PermissionLevel.EDITOR))))
                .thenReturn(true);
        when(userRepository.existsById("user-001")).thenReturn(true);
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectUpdateRequest request = new ProjectUpdateRequest("Updated", null, "INTERNAL", "user-001");
        projectService.updateProject("proj-001", request, "user-001");

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());

        Instant updatedAt = captor.getValue().getUpdatedAt();
        assertNotNull(updatedAt);
        assertEquals(true, !updatedAt.isBefore(before));
    }

    @Test(expected = AccessDeniedException.class)
    public void throwsAccessDeniedWhenUserLacksPermission() {
        when(projectRepository.findById("proj-001")).thenReturn(Optional.of(existingProject));
        when(permissionRepository.existsByProjectIdAndUserIdAndPermissionLevelIn(
                eq("proj-001"), eq("viewer-user"),
                eq(Arrays.asList(PermissionLevel.OWNER, PermissionLevel.EDITOR))))
                .thenReturn(false);

        ProjectUpdateRequest request = new ProjectUpdateRequest("New Name", null, null, null);
        projectService.updateProject("proj-001", request, "viewer-user");
    }

    @Test
    public void unchangedFieldsPreservedAfterUpdate() {
        when(projectRepository.findById("proj-001")).thenReturn(Optional.of(existingProject));
        when(permissionRepository.existsByProjectIdAndUserIdAndPermissionLevelIn(
                eq("proj-001"), eq("user-001"),
                eq(Arrays.asList(PermissionLevel.OWNER, PermissionLevel.EDITOR))))
                .thenReturn(true);
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectUpdateRequest request = new ProjectUpdateRequest("New Name", null, null, null);
        projectService.updateProject("proj-001", request, "user-001");

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());

        Project saved = captor.getValue();
        assertEquals("New Name", saved.getName());
        assertEquals("Original Desc", saved.getDescription());
        assertEquals(ProjectType.INTERNAL, saved.getType());
        assertEquals("user-001", saved.getOwnerId());
    }
}
