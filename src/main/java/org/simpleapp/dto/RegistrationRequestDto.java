package org.simpleapp.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class RegistrationRequestDto {

    @NotBlank(message = "Email address is required")
    private String emailAddress;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Consent flag is required")
    private Boolean consentFlag;

    public RegistrationRequestDto() {
    }

    public RegistrationRequestDto(String emailAddress, String password, Boolean consentFlag) {
        this.emailAddress = emailAddress;
        this.password = password;
        this.consentFlag = consentFlag;
    }

    public String getEmailAddress() {
        return emailAddress;
    }

    public void setEmailAddress(String emailAddress) {
        this.emailAddress = emailAddress;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getConsentFlag() {
        return consentFlag;
    }

    public void setConsentFlag(Boolean consentFlag) {
        this.consentFlag = consentFlag;
    }
}
