package org.simpleapp.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "project_permissions")
public class ProjectPermission {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "project_id", nullable = false, length = 36)
    private String projectId;

    @Column(name = "permission_level", nullable = false, length = 32)
    @Enumerated(EnumType.STRING)
    private PermissionLevel permissionLevel;

    protected ProjectPermission() {
    }

    public ProjectPermission(String id, String userId, String projectId, PermissionLevel permissionLevel) {
        this.id = id;
        this.userId = userId;
        this.projectId = projectId;
        this.permissionLevel = permissionLevel;
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getProjectId() {
        return projectId;
    }

    public PermissionLevel getPermissionLevel() {
        return permissionLevel;
    }
}
