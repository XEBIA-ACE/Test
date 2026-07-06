package org.simpleapp.controller;

import org.simpleapp.dto.ErrorResponseDto;
import org.simpleapp.dto.FieldError;
import org.simpleapp.dto.RegistrationRequestDto;
import org.simpleapp.dto.RegistrationResponseDto;
import org.simpleapp.service.RegistrationService;
import org.simpleapp.service.RegistrationService.RegistrationResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/auth")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register/email")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequestDto request,
                                      BindingResult bindingResult) {
        // Handle bean validation errors
        if (bindingResult.hasErrors()) {
            ErrorResponseDto errorResponse = new ErrorResponseDto();
            bindingResult.getFieldErrors().forEach(error -> {
                String field = mapFieldName(error.getField());
                errorResponse.addError(new FieldError(field, field + "_required", error.getDefaultMessage()));
            });
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(errorResponse);
        }

        RegistrationResult result = registrationService.register(request);

        switch (result.getType()) {
            case SUCCESS:
                return ResponseEntity.status(HttpStatus.CREATED).body(result.getSuccessResponse());
            case VALIDATION_ERROR:
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(result.getErrorResponse());
            case DUPLICATE_EMAIL:
                return ResponseEntity.status(HttpStatus.CONFLICT).body(result.getErrorResponse());
            default:
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String mapFieldName(String fieldName) {
        switch (fieldName) {
            case "emailAddress":
                return "email_address";
            case "consentFlag":
                return "consent_flag";
            default:
                return fieldName;
        }
    }
}
