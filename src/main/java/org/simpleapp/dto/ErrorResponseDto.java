package org.simpleapp.dto;

import java.util.ArrayList;
import java.util.List;

public class ErrorResponseDto {

    private List<FieldError> errors = new ArrayList<>();

    public ErrorResponseDto() {
    }

    public ErrorResponseDto(List<FieldError> errors) {
        this.errors = errors;
    }

    public List<FieldError> getErrors() {
        return errors;
    }

    public void setErrors(List<FieldError> errors) {
        this.errors = errors;
    }

    public void addError(FieldError error) {
        this.errors.add(error);
    }
}
