package com.example.projectcreation.domain.port.in;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Immutable command object carrying the data required to create a project.
 */
public record CreateProjectCommand(

        @NotBlank(message = "Project name must not be blank")
        @Size(min = 1, max = 255, message = "Project name must be between 1 and 255 characters")
        String name,

        @Size(max = 1000, message = "Description must not exceed 1000 characters")
        String description
) {}
