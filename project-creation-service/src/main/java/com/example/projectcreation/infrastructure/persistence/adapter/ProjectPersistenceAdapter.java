package com.example.projectcreation.infrastructure.persistence.adapter;

import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.port.out.ProjectRepository;
import com.example.projectcreation.infrastructure.persistence.entity.ProjectJpaEntity;
import com.example.projectcreation.infrastructure.persistence.repository.SpringDataProjectRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Persistence adapter — implements the {@link ProjectRepository} outbound port
 * using Spring Data JPA.
 */
@Component
public class ProjectPersistenceAdapter implements ProjectRepository {

    private final SpringDataProjectRepository springDataRepo;

    public ProjectPersistenceAdapter(SpringDataProjectRepository springDataRepo) {
        this.springDataRepo = springDataRepo;
    }

    @Override
    public Project save(Project project) {
        ProjectJpaEntity entity = toEntity(project);
        ProjectJpaEntity saved = springDataRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Project> findById(UUID id) {
        return springDataRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<Project> findAll() {
        return springDataRepo.findAll()
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private ProjectJpaEntity toEntity(Project project) {
        return new ProjectJpaEntity(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private Project toDomain(ProjectJpaEntity entity) {
        return new Project(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
