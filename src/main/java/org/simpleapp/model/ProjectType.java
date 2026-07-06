package org.simpleapp.model;

public enum ProjectType {
    INTERNAL,
    EXTERNAL,
    RESEARCH,
    PROTOTYPE;

    public static boolean isValid(String value) {
        if (value == null) {
            return false;
        }
        for (ProjectType type : values()) {
            if (type.name().equals(value)) {
                return true;
            }
        }
        return false;
    }
}
