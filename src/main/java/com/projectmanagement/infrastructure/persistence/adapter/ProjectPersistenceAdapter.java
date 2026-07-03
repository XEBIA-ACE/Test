package com.projectmanagement.infrastructure.persistence.adapter;

import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;
import com.projectmanagement.domain.port.out.ProjectRepository;
import com.projectmanagement.infrastructure.persistence.entity.ProjectJpaEntity;
import com.projectmanagement.infrastructure.persistence.mapper.ProjectMapper;
import com.projectmanagement.infrastructure.persistence.repository.SpringDataProjectRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Persistence adapter — implements the {@link ProjectRepository} output port
 * using Spring Data JPA.
 */
@Component
public class ProjectPersistenceAdapter implements ProjectRepository {

    private final SpringDataProjectRepository springDataRepo;
    private final ProjectMapper mapper;

    public ProjectPersistenceAdapter(
            SpringDataProjectRepository springDataRepo,
            ProjectMapper mapper) {
        this.springDataRepo = springDataRepo;
        this.mapper = mapper;
    }

    @Override
    public Project save(Project project) {
        ProjectJpaEntity entity = mapper.toJpaEntity(project);
        ProjectJpaEntity saved = springDataRepo.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Project> findById(UUID id) {
        return springDataRepo.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Project> findAll() {
        return springDataRepo.findAll()
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Project> findByStatus(ProjectStatus status) {
        return springDataRepo.findByStatus(status)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Project> findByOwnerId(String ownerId) {
        return springDataRepo.findByOwnerId(ownerId)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        springDataRepo.deleteById(id);
    }

    @Override
    public boolean existsById(UUID id) {
        return springDataRepo.existsById(id);
    }
}
