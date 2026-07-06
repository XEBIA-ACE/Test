package org.simpleapp.dto;

public class ProjectUpdateRequest {

    private String name;
    private String description;
    private String type;
    private String ownerId;

    public ProjectUpdateRequest() {
    }

    public ProjectUpdateRequest(String name, String description, String type, String ownerId) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.ownerId = ownerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }
}
