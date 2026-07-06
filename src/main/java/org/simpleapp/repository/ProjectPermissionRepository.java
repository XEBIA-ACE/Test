package org.simpleapp.repository;

import org.simpleapp.model.PermissionLevel;
import org.simpleapp.model.ProjectPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectPermissionRepository extends JpaRepository<ProjectPermission, String> {

    Optional<ProjectPermission> findByProjectIdAndUserId(String projectId, String userId);

    boolean existsByProjectIdAndUserIdAndPermissionLevelIn(
            String projectId, String userId, java.util.Collection<PermissionLevel> levels);
}
