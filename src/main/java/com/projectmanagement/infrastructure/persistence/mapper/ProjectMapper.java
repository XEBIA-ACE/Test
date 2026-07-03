package com.projectmanagement.infrastructure.persistence.mapper;

import com.projectmanagement.domain.model.Project;
import com.projectmanagement.infrastructure.persistence.entity.ProjectJpaEntity;
import org.springframework.stereotype.Component;

/**
 * Maps between the domain {@link Project} model and the JPA {@link ProjectJpaEntity}.
 */
@Component
public class ProjectMapper {

    public ProjectJpaEntity toJpaEntity(Project project) {
        ProjectJpaEntity entity = new ProjectJpaEntity();
        entity.setId(project.getId());
        entity.setName(project.getName());
        entity.setDescription(project.getDescription());
        entity.setStatus(project.getStatus());
        entity.setStartDate(project.getStartDate());
        entity.setEndDate(project.getEndDate());
        entity.setOwnerId(project.getOwnerId());
        entity.setCreatedAt(project.getCreatedAt());
        entity.setUpdatedAt(project.getUpdatedAt());
        return entity;
    }

    public Project toDomain(ProjectJpaEntity entity) {
        return Project.reconstitute(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getOwnerId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
