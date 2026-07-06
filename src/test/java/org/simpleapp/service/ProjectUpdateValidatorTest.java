package org.simpleapp.service;

import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import org.simpleapp.dto.ProjectUpdateRequest;
import org.simpleapp.dto.ValidationError;
import org.simpleapp.model.Project;
import org.simpleapp.model.ProjectType;
import org.simpleapp.repository.ProjectPermissionRepository;
import org.simpleapp.repository.ProjectRepository;
import org.simpleapp.repository.UserRepository;

import java.time.Instant;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.when;

public class ProjectUpdateValidatorTest {

    private ProjectService projectService;
    private UserRepository userRepository;

    private Project existingProject;

    @Before
    public void setUp() {
        ProjectRepository projectRepository = Mockito.mock(ProjectRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        ProjectPermissionRepository permissionRepository = Mockito.mock(ProjectPermissionRepository.class);
        projectService = new ProjectService(projectRepository, userRepository, permissionRepository);

        existingProject = new Project("proj-001", "Original Name", "Original Desc",
                ProjectType.INTERNAL, "user-001", Instant.now(), Instant.now());
    }

    @Test
    public void emptyNameProducesFieldError() {
        ProjectUpdateRequest request = new ProjectUpdateRequest("", null, null, null);
        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertEquals(1, errors.size());
        assertEquals("name", errors.get(0).getField());
    }

    @Test
    public void blankNameProducesFieldError() {
        ProjectUpdateRequest request = new ProjectUpdateRequest("   ", null, null, null);
        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertEquals(1, errors.size());
        assertEquals("name", errors.get(0).getField());
    }

    @Test
    public void unrecognizedTypeProducesFieldError() {
        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, "INVALID_TYPE", null);
        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertEquals(1, errors.size());
        assertEquals("type", errors.get(0).getField());
    }

    @Test
    public void nonExistentOwnerIdProducesFieldError() {
        when(userRepository.existsById("nonexistent-user")).thenReturn(false);

        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, "nonexistent-user");
        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertEquals(1, errors.size());
        assertEquals("owner_id", errors.get(0).getField());
    }

    @Test
    public void omittedDescriptionLeavesExistingValueUnchanged() {
        ProjectUpdateRequest request = new ProjectUpdateRequest("New Name", null, null, null);
        when(userRepository.existsById(Mockito.anyString())).thenReturn(true);

        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertTrue(errors.isEmpty());
        assertEquals("Original Desc", existingProject.getDescription());
    }

    @Test
    public void explicitNullDescriptionAcceptedWithoutError() {
        ProjectUpdateRequest request = new ProjectUpdateRequest();
        request.setName(null);
        request.setDescription(null);
        request.setType(null);
        request.setOwnerId(null);

        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertTrue(errors.isEmpty());
    }

    @Test
    public void validRequestProducesNoErrors() {
        when(userRepository.existsById("user-001")).thenReturn(true);

        ProjectUpdateRequest request = new ProjectUpdateRequest("Valid Name", "desc", "INTERNAL", "user-001");
        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertTrue(errors.isEmpty());
    }

    @Test
    public void multipleValidationErrorsReturnedTogether() {
        when(userRepository.existsById("nonexistent")).thenReturn(false);

        ProjectUpdateRequest request = new ProjectUpdateRequest("", null, "BOGUS", "nonexistent");
        List<ValidationError> errors = projectService.validate(request, existingProject);

        assertEquals(3, errors.size());
    }
}
